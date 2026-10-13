import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation, mutation, query, type QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { moduleStatusValidator } from "./schema";
import { getTrackAccess, requireTrackPermission, requireUser } from "./lib/auth";
import {
  LIMITS,
  MAX_LESSONS_PER_MODULE,
  MAX_MODULES_PER_UNIT,
  MAX_UNITS_PER_TRACK,
  cleanObjectives,
  cleanText,
  cleanTitle,
  cleanVideoUrl,
  loadLessons,
  uniqueLessonSlug,
  uniqueModuleSlug,
} from "./lib/curriculum";

const MAX_TRACKS = 200;
const CLEANUP_BATCH = 200;

const directionValidator = v.union(v.literal("up"), v.literal("down"));

async function requireEditor(ctx: QueryCtx, trackId: Id<"tracks">) {
  const { user } = await requireTrackPermission(ctx, trackId, "track.content");
  const track = await ctx.db.get("tracks", trackId);
  if (track === null) {
    throw new ConvexError("Track not found");
  }
  return { user, track };
}

async function requireUnitEditor(ctx: QueryCtx, unitId: Id<"units">) {
  const unit = await ctx.db.get("units", unitId);
  if (unit === null) {
    throw new ConvexError("Unit not found");
  }
  await requireEditor(ctx, unit.trackId);
  return unit;
}

async function requireModuleEditor(ctx: QueryCtx, moduleId: Id<"modules">) {
  const mod = await ctx.db.get("modules", moduleId);
  if (mod === null) {
    throw new ConvexError("Module not found");
  }
  await requireEditor(ctx, mod.trackId);
  return mod;
}

async function requireLessonEditor(ctx: QueryCtx, lessonId: Id<"lessons">) {
  const lesson = await ctx.db.get("lessons", lessonId);
  if (lesson === null) {
    throw new ConvexError("Lesson not found");
  }
  const mod = await requireModuleEditor(ctx, lesson.moduleId);
  return { lesson, mod };
}

export const listEditableTracks = query({
  args: {},
  returns: v.array(v.object({ _id: v.id("tracks"), name: v.string() })),
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const tracks = await ctx.db.query("tracks").take(MAX_TRACKS);
    const result = [];
    for (const track of tracks) {
      if (track.status !== "active") continue;
      const access = await getTrackAccess(ctx, user, track._id);
      if (access.permissions.includes("track.content")) {
        result.push({ _id: track._id, name: track.name });
      }
    }
    return result.sort((a, b) => a.name.localeCompare(b.name));
  },
});

export const outline = query({
  args: { trackId: v.id("tracks") },
  returns: v.array(
    v.object({
      _id: v.id("units"),
      title: v.string(),
      description: v.union(v.string(), v.null()),
      modules: v.array(
        v.object({
          _id: v.id("modules"),
          slug: v.string(),
          title: v.string(),
          description: v.union(v.string(), v.null()),
          objectives: v.array(v.string()),
          status: moduleStatusValidator,
          lessonCount: v.number(),
        }),
      ),
    }),
  ),
  handler: async (ctx, args) => {
    await requireEditor(ctx, args.trackId);
    const units = await ctx.db
      .query("units")
      .withIndex("by_trackId_and_sortOrder", (q) => q.eq("trackId", args.trackId))
      .take(MAX_UNITS_PER_TRACK);
    return await Promise.all(
      units.map(async (unit) => {
        const modules = await ctx.db
          .query("modules")
          .withIndex("by_unitId_and_sortOrder", (q) => q.eq("unitId", unit._id))
          .take(MAX_MODULES_PER_UNIT);
        return {
          _id: unit._id,
          title: unit.title,
          description: unit.description ?? null,
          modules: modules.map((m) => ({
            _id: m._id,
            slug: m.slug,
            title: m.title,
            description: m.description ?? null,
            objectives: m.objectives,
            status: m.status,
            lessonCount: m.lessonCount,
          })),
        };
      }),
    );
  },
});

export const listLessons = query({
  args: { moduleId: v.id("modules") },
  returns: v.array(
    v.object({
      _id: v.id("lessons"),
      slug: v.string(),
      title: v.string(),
      hasVideo: v.boolean(),
      wordCount: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    // The editor panel can still be subscribed for a moment after its module is deleted.
    if ((await ctx.db.get("modules", args.moduleId)) === null) return [];
    await requireModuleEditor(ctx, args.moduleId);
    const lessons = await loadLessons(ctx, args.moduleId);
    return lessons.map((lesson) => ({
      _id: lesson._id,
      slug: lesson.slug,
      title: lesson.title,
      hasVideo: lesson.videoUrl !== undefined,
      wordCount: lesson.body.trim() ? lesson.body.trim().split(/\s+/).length : 0,
    }));
  },
});

/** Returns null when the lesson is gone or the caller can't edit its track. */
export const getLesson = query({
  args: { lessonId: v.id("lessons") },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("lessons"),
      title: v.string(),
      slug: v.string(),
      body: v.string(),
      videoUrl: v.string(),
      transcript: v.string(),
      summary: v.string(),
      module: v.object({ _id: v.id("modules"), slug: v.string(), title: v.string(), status: moduleStatusValidator }),
      track: v.object({ _id: v.id("tracks"), name: v.string() }),
    }),
  ),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const lesson = await ctx.db.get("lessons", args.lessonId);
    if (lesson === null) return null;
    const mod = await ctx.db.get("modules", lesson.moduleId);
    const track = await ctx.db.get("tracks", lesson.trackId);
    if (mod === null || track === null) return null;
    const access = await getTrackAccess(ctx, user, track._id);
    if (!access.permissions.includes("track.content")) return null;
    return {
      _id: lesson._id,
      title: lesson.title,
      slug: lesson.slug,
      body: lesson.body,
      videoUrl: lesson.videoUrl ?? "",
      transcript: lesson.transcript ?? "",
      summary: lesson.summary ?? "",
      module: { _id: mod._id, slug: mod.slug, title: mod.title, status: mod.status },
      track: { _id: track._id, name: track.name },
    };
  },
});

// ---------- Units ----------

export const createUnit = mutation({
  args: { trackId: v.id("tracks"), title: v.string(), description: v.optional(v.string()) },
  returns: v.id("units"),
  handler: async (ctx, args) => {
    const { track } = await requireEditor(ctx, args.trackId);
    if (track.status !== "active") {
      throw new ConvexError("Restore this track before editing its curriculum");
    }
    const units = await ctx.db
      .query("units")
      .withIndex("by_trackId_and_sortOrder", (q) => q.eq("trackId", track._id))
      .take(MAX_UNITS_PER_TRACK);
    if (units.length >= MAX_UNITS_PER_TRACK) {
      throw new ConvexError(`A track can have at most ${MAX_UNITS_PER_TRACK} units`);
    }
    const last = units[units.length - 1];
    return await ctx.db.insert("units", {
      trackId: track._id,
      title: cleanTitle(args.title, "Unit"),
      description: args.description === undefined ? undefined : cleanText(args.description, LIMITS.description, "Description"),
      sortOrder: last ? last.sortOrder + 1 : 0,
    });
  },
});

export const updateUnit = mutation({
  args: { unitId: v.id("units"), title: v.optional(v.string()), description: v.optional(v.string()) },
  returns: v.null(),
  handler: async (ctx, args) => {
    const unit = await requireUnitEditor(ctx, args.unitId);
    await ctx.db.patch("units", unit._id, {
      ...(args.title !== undefined && { title: cleanTitle(args.title, "Unit") }),
      ...(args.description !== undefined && {
        description: cleanText(args.description, LIMITS.description, "Description"),
      }),
    });
    return null;
  },
});

export const deleteUnit = mutation({
  args: { unitId: v.id("units") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const unit = await requireUnitEditor(ctx, args.unitId);
    const firstModule = await ctx.db
      .query("modules")
      .withIndex("by_unitId_and_sortOrder", (q) => q.eq("unitId", unit._id))
      .first();
    if (firstModule !== null) {
      throw new ConvexError("Delete or move this unit's modules first");
    }
    await ctx.db.delete("units", unit._id);
    return null;
  },
});

export const moveUnit = mutation({
  args: { unitId: v.id("units"), direction: directionValidator },
  returns: v.null(),
  handler: async (ctx, args) => {
    const unit = await requireUnitEditor(ctx, args.unitId);
    const neighbor =
      args.direction === "up"
        ? await ctx.db
            .query("units")
            .withIndex("by_trackId_and_sortOrder", (q) => q.eq("trackId", unit.trackId).lt("sortOrder", unit.sortOrder))
            .order("desc")
            .first()
        : await ctx.db
            .query("units")
            .withIndex("by_trackId_and_sortOrder", (q) => q.eq("trackId", unit.trackId).gt("sortOrder", unit.sortOrder))
            .first();
    if (neighbor === null) return null;
    await ctx.db.patch("units", unit._id, { sortOrder: neighbor.sortOrder });
    await ctx.db.patch("units", neighbor._id, { sortOrder: unit.sortOrder });
    return null;
  },
});

// ---------- Modules ----------

export const createModule = mutation({
  args: { unitId: v.id("units"), title: v.string() },
  returns: v.object({ moduleId: v.id("modules"), slug: v.string() }),
  handler: async (ctx, args) => {
    const unit = await requireUnitEditor(ctx, args.unitId);
    const title = cleanTitle(args.title, "Module");
    const existing = await ctx.db
      .query("modules")
      .withIndex("by_unitId_and_sortOrder", (q) => q.eq("unitId", unit._id))
      .take(MAX_MODULES_PER_UNIT);
    if (existing.length >= MAX_MODULES_PER_UNIT) {
      throw new ConvexError(`A unit can have at most ${MAX_MODULES_PER_UNIT} modules`);
    }
    const slug = await uniqueModuleSlug(ctx, title);
    const moduleId = await ctx.db.insert("modules", {
      trackId: unit.trackId,
      unitId: unit._id,
      title,
      slug,
      sortOrder: existing.length > 0 ? existing[existing.length - 1].sortOrder + 1 : 0,
      status: "draft",
      objectives: [],
      lessonCount: 0,
    });
    return { moduleId, slug };
  },
});

export const updateModule = mutation({
  args: {
    moduleId: v.id("modules"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    objectives: v.optional(v.array(v.string())),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const mod = await requireModuleEditor(ctx, args.moduleId);
    await ctx.db.patch("modules", mod._id, {
      ...(args.title !== undefined && { title: cleanTitle(args.title, "Module") }),
      ...(args.description !== undefined && {
        description: cleanText(args.description, LIMITS.description, "Description"),
      }),
      ...(args.objectives !== undefined && { objectives: cleanObjectives(args.objectives) }),
    });
    return null;
  },
});

export const setModuleStatus = mutation({
  args: { moduleId: v.id("modules"), status: moduleStatusValidator },
  returns: v.null(),
  handler: async (ctx, args) => {
    const mod = await requireModuleEditor(ctx, args.moduleId);
    if (args.status === "published" && mod.lessonCount === 0) {
      throw new ConvexError("Add at least one lesson before publishing");
    }
    await ctx.db.patch("modules", mod._id, { status: args.status });
    return null;
  },
});

export const deleteModule = mutation({
  args: { moduleId: v.id("modules") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const mod = await requireModuleEditor(ctx, args.moduleId);
    if (mod.lessonCount > 0) {
      throw new ConvexError("Delete this module's lessons first");
    }
    const mission = await ctx.db
      .query("missions")
      .withIndex("by_moduleId_and_sortOrder", (q) => q.eq("moduleId", mod._id))
      .first();
    if (mission !== null) {
      throw new ConvexError("Delete this module's missions first");
    }
    await ctx.db.delete("modules", mod._id);
    await ctx.scheduler.runAfter(0, internal.curriculumEditor.cleanupModuleCompletions, { moduleId: mod._id });
    return null;
  },
});

export const moveModule = mutation({
  args: { moduleId: v.id("modules"), direction: directionValidator },
  returns: v.null(),
  handler: async (ctx, args) => {
    const mod = await requireModuleEditor(ctx, args.moduleId);
    const neighbor =
      args.direction === "up"
        ? await ctx.db
            .query("modules")
            .withIndex("by_unitId_and_sortOrder", (q) => q.eq("unitId", mod.unitId).lt("sortOrder", mod.sortOrder))
            .order("desc")
            .first()
        : await ctx.db
            .query("modules")
            .withIndex("by_unitId_and_sortOrder", (q) => q.eq("unitId", mod.unitId).gt("sortOrder", mod.sortOrder))
            .first();
    if (neighbor === null) return null;
    await ctx.db.patch("modules", mod._id, { sortOrder: neighbor.sortOrder });
    await ctx.db.patch("modules", neighbor._id, { sortOrder: mod.sortOrder });
    return null;
  },
});

// ---------- Lessons ----------

export const createLesson = mutation({
  args: { moduleId: v.id("modules"), title: v.string() },
  returns: v.id("lessons"),
  handler: async (ctx, args) => {
    const mod = await requireModuleEditor(ctx, args.moduleId);
    const title = cleanTitle(args.title, "Lesson");
    const lessons = await loadLessons(ctx, mod._id);
    if (lessons.length >= MAX_LESSONS_PER_MODULE) {
      throw new ConvexError(`A module can have at most ${MAX_LESSONS_PER_MODULE} lessons`);
    }
    const lessonId = await ctx.db.insert("lessons", {
      moduleId: mod._id,
      trackId: mod.trackId,
      title,
      slug: await uniqueLessonSlug(ctx, mod._id, title),
      body: "",
      sortOrder: lessons.length > 0 ? lessons[lessons.length - 1].sortOrder + 1 : 0,
    });
    await ctx.db.patch("modules", mod._id, { lessonCount: lessons.length + 1 });
    return lessonId;
  },
});

export const updateLesson = mutation({
  args: {
    lessonId: v.id("lessons"),
    title: v.optional(v.string()),
    body: v.optional(v.string()),
    videoUrl: v.optional(v.string()),
    transcript: v.optional(v.string()),
    summary: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { lesson } = await requireLessonEditor(ctx, args.lessonId);
    if (args.body !== undefined && args.body.length > LIMITS.body) {
      throw new ConvexError(`The lesson must be ${LIMITS.body.toLocaleString("en-US")} characters or fewer`);
    }
    await ctx.db.patch("lessons", lesson._id, {
      ...(args.title !== undefined && { title: cleanTitle(args.title, "Lesson") }),
      ...(args.body !== undefined && { body: args.body }),
      ...(args.videoUrl !== undefined && { videoUrl: cleanVideoUrl(args.videoUrl) }),
      ...(args.transcript !== undefined && {
        transcript: cleanText(args.transcript, LIMITS.transcript, "Transcript"),
      }),
      ...(args.summary !== undefined && { summary: cleanText(args.summary, LIMITS.summary, "Summary") }),
    });
    return null;
  },
});

export const deleteLesson = mutation({
  args: { lessonId: v.id("lessons") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { lesson, mod } = await requireLessonEditor(ctx, args.lessonId);
    await ctx.db.delete("lessons", lesson._id);
    const remaining = Math.max(0, mod.lessonCount - 1);
    await ctx.db.patch("modules", mod._id, {
      lessonCount: remaining,
      ...(remaining === 0 && { status: "draft" as const }),
    });
    await ctx.scheduler.runAfter(0, internal.curriculumEditor.cleanupLessonCompletions, { lessonId: lesson._id });
    return null;
  },
});

export const moveLesson = mutation({
  args: { lessonId: v.id("lessons"), direction: directionValidator },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { lesson } = await requireLessonEditor(ctx, args.lessonId);
    const neighbor =
      args.direction === "up"
        ? await ctx.db
            .query("lessons")
            .withIndex("by_moduleId_and_sortOrder", (q) => q.eq("moduleId", lesson.moduleId).lt("sortOrder", lesson.sortOrder))
            .order("desc")
            .first()
        : await ctx.db
            .query("lessons")
            .withIndex("by_moduleId_and_sortOrder", (q) => q.eq("moduleId", lesson.moduleId).gt("sortOrder", lesson.sortOrder))
            .first();
    if (neighbor === null) return null;
    await ctx.db.patch("lessons", lesson._id, { sortOrder: neighbor.sortOrder });
    await ctx.db.patch("lessons", neighbor._id, { sortOrder: lesson.sortOrder });
    return null;
  },
});

// ---------- Cleanup ----------

export const cleanupLessonCompletions = internalMutation({
  args: { lessonId: v.id("lessons") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const batch = await ctx.db
      .query("lessonCompletions")
      .withIndex("by_lessonId", (q) => q.eq("lessonId", args.lessonId))
      .take(CLEANUP_BATCH);
    for (const completion of batch) {
      await ctx.db.delete("lessonCompletions", completion._id);
    }
    if (batch.length === CLEANUP_BATCH) {
      await ctx.scheduler.runAfter(0, internal.curriculumEditor.cleanupLessonCompletions, args);
    }
    return null;
  },
});

export const cleanupModuleCompletions = internalMutation({
  args: { moduleId: v.id("modules") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const batch = await ctx.db
      .query("moduleCompletions")
      .withIndex("by_moduleId", (q) => q.eq("moduleId", args.moduleId))
      .take(CLEANUP_BATCH);
    for (const completion of batch) {
      await ctx.db.delete("moduleCompletions", completion._id);
    }
    if (batch.length === CLEANUP_BATCH) {
      await ctx.scheduler.runAfter(0, internal.curriculumEditor.cleanupModuleCompletions, args);
    }
    return null;
  },
});

import { ConvexError, v } from "convex/values";
import { mutation, query, type QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { missionReviewTypeValidator, moduleStatusValidator } from "./schema";
import {
  isMissionSatisfied,
  latestSubmission,
  loadMissions,
  missionStatus,
  recomputeModuleCompletion,
} from "./lib/missions";
import { missionStatusValidator } from "./lib/validators";
import {
  completedLessonIds,
  flattenOutline,
  loadLessons,
  loadOutline,
  getTrackViewer,
  loadTrackProgress,
  moduleProgress,
  padNumber,
  requireTrackViewer,
} from "./lib/curriculum";

const progressValidator = v.union(v.literal("complete"), v.literal("in_progress"), v.literal("not_started"));
const linkValidator = v.union(v.object({ slug: v.string(), title: v.string() }), v.null());
const trackRefValidator = v.object({ _id: v.id("tracks"), name: v.string() });

/**
 * Finds a module by its slug. Returns null when it doesn't exist, is a draft
 * the caller can't edit, or belongs to a track the caller can't see.
 */
async function loadVisibleModule(ctx: QueryCtx, slug: string) {
  const mod = await ctx.db
    .query("modules")
    .withIndex("by_slug", (q) => q.eq("slug", slug))
    .unique();
  if (mod === null) return null;
  const viewer = await getTrackViewer(ctx, mod.trackId);
  if (viewer === null) return null;
  if (mod.status !== "published" && !viewer.canEdit) return null;
  return { module: mod, ...viewer };
}

function link(module: Doc<"modules"> | undefined) {
  return module ? { slug: module.slug, title: module.title } : null;
}

const moduleMissionValidator = v.object({
  _id: v.id("missions"),
  slug: v.string(),
  title: v.string(),
  reviewType: missionReviewTypeValidator,
  status: missionStatusValidator,
  satisfied: v.boolean(),
});

async function moduleMissions(ctx: QueryCtx, userId: Id<"users">, moduleId: Id<"modules">) {
  const missions = await loadMissions(ctx, moduleId);
  return await Promise.all(
    missions.map(async (mission) => {
      const latest = await latestSubmission(ctx, userId, mission._id);
      return {
        _id: mission._id,
        slug: mission.slug,
        title: mission.title,
        reviewType: mission.reviewType,
        status: missionStatus(latest),
        satisfied: isMissionSatisfied(mission, latest),
      };
    }),
  );
}

export const overview = query({
  args: { trackId: v.id("tracks") },
  returns: v.object({
    track: trackRefValidator,
    canEdit: v.boolean(),
    totals: v.object({ modules: v.number(), completedModules: v.number() }),
    units: v.array(
      v.object({
        _id: v.id("units"),
        number: v.string(),
        title: v.string(),
        description: v.union(v.string(), v.null()),
        modules: v.array(
          v.object({
            _id: v.id("modules"),
            slug: v.string(),
            number: v.string(),
            title: v.string(),
            status: moduleStatusValidator,
            lessonCount: v.number(),
            completedLessons: v.number(),
            progress: progressValidator,
          }),
        ),
      }),
    ),
  }),
  handler: async (ctx, args) => {
    const { user, track, canEdit } = await requireTrackViewer(ctx, args.trackId);
    const outline = await loadOutline(ctx, track._id, canEdit);
    const progress = await loadTrackProgress(ctx, user._id, track._id);

    let modulesTotal = 0;
    let modulesDone = 0;
    const units = outline.map(({ unit, number, modules }) => ({
      _id: unit._id,
      number,
      title: unit.title,
      description: unit.description ?? null,
      modules: modules.map(({ module, number: moduleNumber }) => {
        const state = moduleProgress(module, progress);
        if (module.status === "published") {
          modulesTotal += 1;
          if (state.progress === "complete") modulesDone += 1;
        }
        return {
          _id: module._id,
          slug: module.slug,
          number: moduleNumber,
          title: module.title,
          status: module.status,
          lessonCount: module.lessonCount,
          completedLessons: state.completedLessons,
          progress: state.progress,
        };
      }),
    }));

    return {
      track: { _id: track._id, name: track.name },
      canEdit,
      totals: { modules: modulesTotal, completedModules: modulesDone },
      units,
    };
  },
});

export const getModule = query({
  args: { slug: v.string() },
  returns: v.union(v.null(), v.object({
    track: trackRefValidator,
    canEdit: v.boolean(),
    unit: v.object({ number: v.string(), title: v.string() }),
    module: v.object({
      _id: v.id("modules"),
      slug: v.string(),
      number: v.string(),
      title: v.string(),
      description: v.union(v.string(), v.null()),
      objectives: v.array(v.string()),
      status: moduleStatusValidator,
    }),
    lessons: v.array(
      v.object({
        _id: v.id("lessons"),
        slug: v.string(),
        number: v.string(),
        title: v.string(),
        hasVideo: v.boolean(),
        completed: v.boolean(),
      }),
    ),
    missions: v.array(moduleMissionValidator),
    isComplete: v.boolean(),
    continueLessonSlug: v.union(v.string(), v.null()),
    previousIncomplete: linkValidator,
    prev: linkValidator,
    next: linkValidator,
  })),
  handler: async (ctx, args) => {
    const visible = await loadVisibleModule(ctx, args.slug);
    if (visible === null) return null;
    const { module, user, track, canEdit } = visible;
    const flat = flattenOutline(await loadOutline(ctx, track._id, canEdit));
    const index = flat.findIndex((entry) => entry.module._id === module._id);
    const entry = flat[index];
    if (entry === undefined) return null;

    const [lessons, done, completion, missions] = await Promise.all([
      loadLessons(ctx, module._id),
      completedLessonIds(ctx, user._id, module._id),
      ctx.db
        .query("moduleCompletions")
        .withIndex("by_userId_and_moduleId", (q) => q.eq("userId", user._id).eq("moduleId", module._id))
        .first(),
      moduleMissions(ctx, user._id, module._id),
    ]);

    const previous = index > 0 ? flat[index - 1].module : undefined;
    const previousDone =
      previous === undefined
        ? true
        : (await ctx.db
            .query("moduleCompletions")
            .withIndex("by_userId_and_moduleId", (q) => q.eq("userId", user._id).eq("moduleId", previous._id))
            .first()) !== null;

    const lessonRows = lessons.map((lesson, i) => ({
      _id: lesson._id,
      slug: lesson.slug,
      number: padNumber(i + 1),
      title: lesson.title,
      hasVideo: lesson.videoUrl !== undefined,
      completed: done.has(lesson._id),
    }));

    return {
      track: { _id: track._id, name: track.name },
      canEdit,
      unit: { number: entry.unitNumber, title: entry.unit.title },
      module: {
        _id: module._id,
        slug: module.slug,
        number: entry.number,
        title: module.title,
        description: module.description ?? null,
        objectives: module.objectives,
        status: module.status,
      },
      lessons: lessonRows,
      missions,
      isComplete: completion !== null,
      continueLessonSlug: (lessonRows.find((l) => !l.completed) ?? lessonRows[0])?.slug ?? null,
      previousIncomplete: previousDone ? null : link(previous),
      prev: link(previous),
      next: link(flat[index + 1]?.module),
    };
  },
});

export const getLesson = query({
  args: { moduleSlug: v.string(), lessonSlug: v.string() },
  returns: v.union(v.null(), v.object({
    track: trackRefValidator,
    canEdit: v.boolean(),
    module: v.object({
      _id: v.id("modules"),
      slug: v.string(),
      title: v.string(),
      status: moduleStatusValidator,
    }),
    lesson: v.object({
      _id: v.id("lessons"),
      slug: v.string(),
      number: v.string(),
      title: v.string(),
      body: v.string(),
      videoUrl: v.union(v.string(), v.null()),
      transcript: v.union(v.string(), v.null()),
      summary: v.union(v.string(), v.null()),
    }),
    completed: v.boolean(),
    lessons: v.array(v.object({ slug: v.string(), title: v.string(), completed: v.boolean() })),
    missions: v.array(moduleMissionValidator),
    prev: linkValidator,
    next: linkValidator,
    nextModule: linkValidator,
  })),
  handler: async (ctx, args) => {
    const visible = await loadVisibleModule(ctx, args.moduleSlug);
    if (visible === null) return null;
    const { module, user, track, canEdit } = visible;
    const [lessons, done, missions] = await Promise.all([
      loadLessons(ctx, module._id),
      completedLessonIds(ctx, user._id, module._id),
      moduleMissions(ctx, user._id, module._id),
    ]);
    const index = lessons.findIndex((l) => l.slug === args.lessonSlug);
    const lesson = lessons[index];
    if (lesson === undefined) return null;

    let nextModule = null;
    if (index === lessons.length - 1) {
      const flat = flattenOutline(await loadOutline(ctx, track._id, canEdit));
      const moduleIndex = flat.findIndex((entry) => entry.module._id === module._id);
      nextModule = link(flat[moduleIndex + 1]?.module);
    }

    return {
      track: { _id: track._id, name: track.name },
      canEdit,
      module: { _id: module._id, slug: module.slug, title: module.title, status: module.status },
      lesson: {
        _id: lesson._id,
        slug: lesson.slug,
        number: padNumber(index + 1),
        title: lesson.title,
        body: lesson.body,
        videoUrl: lesson.videoUrl ?? null,
        transcript: lesson.transcript ?? null,
        summary: lesson.summary ?? null,
      },
      completed: done.has(lesson._id),
      lessons: lessons.map((l) => ({ slug: l.slug, title: l.title, completed: done.has(l._id) })),
      missions,
      prev: index > 0 ? { slug: lessons[index - 1].slug, title: lessons[index - 1].title } : null,
      next: lessons[index + 1] ? { slug: lessons[index + 1].slug, title: lessons[index + 1].title } : null,
      nextModule,
    };
  },
});

export const home = query({
  args: { trackId: v.id("tracks") },
  returns: v.object({
    track: trackRefValidator,
    cohort: v.union(
      v.object({ name: v.string(), startsAt: v.number(), endsAt: v.union(v.number(), v.null()) }),
      v.null(),
    ),
    modules: v.object({ total: v.number(), completed: v.number() }),
    next: v.union(
      v.object({
        moduleSlug: v.string(),
        moduleTitle: v.string(),
        unitTitle: v.string(),
        lessonSlug: v.string(),
        lessonTitle: v.string(),
        completedLessons: v.number(),
        lessonCount: v.number(),
        /** Set once every lesson is done but a mission still stands between the learner and completion. */
        mission: v.union(v.object({ slug: v.string(), title: v.string() }), v.null()),
      }),
      v.null(),
    ),
  }),
  handler: async (ctx, args) => {
    const { user, track } = await requireTrackViewer(ctx, args.trackId);
    const flat = flattenOutline(await loadOutline(ctx, track._id, false));
    const progress = await loadTrackProgress(ctx, user._id, track._id);

    const enrollment = await ctx.db
      .query("enrollments")
      .withIndex("by_userId_and_trackId", (q) => q.eq("userId", user._id).eq("trackId", track._id))
      .first();
    const cohort = enrollment ? await ctx.db.get("cohorts", enrollment.cohortId) : null;

    let next = null;
    const upcoming = flat.find(
      ({ module }) => module.lessonCount > 0 && !progress.modulesDone.has(module._id),
    );
    if (upcoming !== undefined) {
      const [lessons, done] = await Promise.all([
        loadLessons(ctx, upcoming.module._id),
        completedLessonIds(ctx, user._id, upcoming.module._id),
      ]);
      const pendingLesson = lessons.find((l) => !done.has(l._id));
      const lesson = pendingLesson ?? lessons[0];
      if (lesson !== undefined) {
        let mission = null;
        if (pendingLesson === undefined) {
          const missions = await moduleMissions(ctx, user._id, upcoming.module._id);
          const pending = missions.find((m) => !m.satisfied);
          mission = pending ? { slug: pending.slug, title: pending.title } : null;
        }
        next = {
          moduleSlug: upcoming.module.slug,
          moduleTitle: upcoming.module.title,
          unitTitle: upcoming.unit.title,
          lessonSlug: lesson.slug,
          lessonTitle: lesson.title,
          completedLessons: lessons.filter((l) => done.has(l._id)).length,
          lessonCount: lessons.length,
          mission,
        };
      }
    }

    return {
      track: { _id: track._id, name: track.name },
      cohort: cohort ? { name: cohort.name, startsAt: cohort.startsAt, endsAt: cohort.endsAt ?? null } : null,
      modules: {
        total: flat.length,
        completed: flat.filter(({ module }) => progress.modulesDone.has(module._id)).length,
      },
      next,
    };
  },
});

/**
 * Marks a lesson done or not done. Finishing the last lesson completes the
 * module once its missions are satisfied; un-marking any lesson reopens it.
 */
export const setLessonComplete = mutation({
  args: { lessonId: v.id("lessons"), complete: v.boolean() },
  returns: v.object({ moduleComplete: v.boolean() }),
  handler: async (ctx, args) => {
    const lesson = await ctx.db.get("lessons", args.lessonId);
    if (lesson === null) {
      throw new ConvexError("Lesson not found");
    }
    const mod = await ctx.db.get("modules", lesson.moduleId);
    if (mod === null) {
      throw new ConvexError("Lesson not found");
    }
    const { user, canEdit } = await requireTrackViewer(ctx, mod.trackId);
    if (mod.status !== "published" && !canEdit) {
      throw new ConvexError("Lesson not found");
    }

    const existing = await ctx.db
      .query("lessonCompletions")
      .withIndex("by_userId_and_lessonId", (q) => q.eq("userId", user._id).eq("lessonId", lesson._id))
      .first();
    if (args.complete && existing === null) {
      await ctx.db.insert("lessonCompletions", {
        userId: user._id,
        lessonId: lesson._id,
        moduleId: mod._id,
        trackId: mod.trackId,
      });
    } else if (!args.complete && existing !== null) {
      await ctx.db.delete("lessonCompletions", existing._id);
    }

    return { moduleComplete: await recomputeModuleCompletion(ctx, user._id, mod) };
  },
});

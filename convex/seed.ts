import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";
import { normalizeEmail } from "./lib/auth";
import { PLATFORM_PERMISSIONS } from "./lib/permissions";
import { createAndSend } from "./invitations";
import { uniqueLessonSlug, uniqueModuleSlug } from "./lib/curriculum";
import { loadMissions, uniqueMissionSlug } from "./lib/missions";
import { DESIGN_LAB_CURRICULUM, DESIGN_LAB_MISSIONS } from "./lib/sampleCurriculum";
import { SAMPLE_RESOURCES } from "./lib/sampleResources";
import { SAMPLE_ROADMAPS } from "./lib/sampleRoadmaps";

const TRACKS = [
  {
    slug: "design_lab",
    name: "Design Lab",
    description: "Bitcoin product and UX design",
  },
  {
    slug: "oss_lab",
    name: "Open Source Lab",
    description: "Bitcoin open source contributions",
  },
];

export const tracks = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    for (const track of TRACKS) {
      const existing = await ctx.db
        .query("tracks")
        .withIndex("by_slug", (q) => q.eq("slug", track.slug))
        .unique();
      if (existing === null) {
        await ctx.db.insert("tracks", { ...track, status: "active" });
      }
    }
    return null;
  },
});

export const cohort = internalMutation({
  args: { trackSlug: v.string(), name: v.string() },
  returns: v.id("cohorts"),
  handler: async (ctx, args) => {
    const track = await ctx.db
      .query("tracks")
      .withIndex("by_slug", (q) => q.eq("slug", args.trackSlug))
      .unique();
    if (track === null) {
      throw new ConvexError(`No track with slug ${args.trackSlug}`);
    }
    return await ctx.db.insert("cohorts", {
      trackId: track._id,
      name: args.name,
      startsAt: Date.now(),
      status: "active",
    });
  },
});

/** Adds sample Design Lab content. Does nothing if the track already has units. */
export const curriculum = internalMutation({
  args: { trackSlug: v.optional(v.string()) },
  returns: v.object({ units: v.number(), modules: v.number(), lessons: v.number() }),
  handler: async (ctx, args) => {
    const trackSlug = args.trackSlug ?? "design_lab";
    const track = await ctx.db
      .query("tracks")
      .withIndex("by_slug", (q) => q.eq("slug", trackSlug))
      .unique();
    if (track === null) {
      throw new ConvexError(`No track with slug ${trackSlug}`);
    }
    const existing = await ctx.db
      .query("units")
      .withIndex("by_trackId_and_sortOrder", (q) => q.eq("trackId", track._id))
      .first();
    if (existing !== null) {
      return { units: 0, modules: 0, lessons: 0 };
    }

    let modules = 0;
    let lessons = 0;
    for (const [unitIndex, unit] of DESIGN_LAB_CURRICULUM.entries()) {
      const unitId = await ctx.db.insert("units", {
        trackId: track._id,
        title: unit.title,
        description: unit.description,
        sortOrder: unitIndex,
      });
      for (const [moduleIndex, mod] of unit.modules.entries()) {
        const moduleId = await ctx.db.insert("modules", {
          trackId: track._id,
          unitId,
          title: mod.title,
          description: mod.description,
          slug: await uniqueModuleSlug(ctx, mod.title),
          sortOrder: moduleIndex,
          status: mod.published ? "published" : "draft",
          objectives: mod.objectives,
          lessonCount: mod.lessons.length,
        });
        modules += 1;
        for (const [lessonIndex, lesson] of mod.lessons.entries()) {
          await ctx.db.insert("lessons", {
            moduleId,
            trackId: track._id,
            title: lesson.title,
            slug: await uniqueLessonSlug(ctx, moduleId, lesson.title),
            body: lesson.body,
            summary: lesson.summary,
            sortOrder: lessonIndex,
          });
          lessons += 1;
        }
      }
    }
    return { units: DESIGN_LAB_CURRICULUM.length, modules, lessons };
  },
});

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Adds sample missions to the Design Lab modules, with deadlines for every
 * cohort that isn't archived. Skips missions whose module is missing or
 * already has a mission with the same title, so it's safe to run again.
 */
export const missions = internalMutation({
  args: { trackSlug: v.optional(v.string()) },
  returns: v.object({ missions: v.number(), deadlines: v.number() }),
  handler: async (ctx, args) => {
    const trackSlug = args.trackSlug ?? "design_lab";
    const track = await ctx.db
      .query("tracks")
      .withIndex("by_slug", (q) => q.eq("slug", trackSlug))
      .unique();
    if (track === null) {
      throw new ConvexError(`No track with slug ${trackSlug}`);
    }
    const [modules, cohorts] = await Promise.all([
      ctx.db
        .query("modules")
        .withIndex("by_trackId", (q) => q.eq("trackId", track._id))
        .take(500),
      ctx.db
        .query("cohorts")
        .withIndex("by_trackId", (q) => q.eq("trackId", track._id))
        .take(100),
    ]);
    const liveCohorts = cohorts.filter((c) => c.status !== "archived");

    let created = 0;
    let deadlines = 0;
    for (const sample of DESIGN_LAB_MISSIONS) {
      const mod = modules.find((m) => m.title === sample.moduleTitle);
      if (mod === undefined) continue;
      const existing = await loadMissions(ctx, mod._id);
      if (existing.some((m) => m.title === sample.title)) continue;

      const missionId = await ctx.db.insert("missions", {
        trackId: track._id,
        moduleId: mod._id,
        title: sample.title,
        slug: await uniqueMissionSlug(ctx, sample.title),
        brief: sample.brief,
        rubric: sample.rubric,
        reviewType: sample.reviewType,
        sortOrder: existing.length,
      });
      created += 1;
      for (const cohort of liveCohorts) {
        await ctx.db.insert("missionDeadlines", {
          missionId,
          cohortId: cohort._id,
          dueAt: cohort.startsAt + sample.dueWeek * WEEK_MS - 1,
        });
        deadlines += 1;
      }
      await ctx.scheduler.runAfter(0, internal.curriculumEditor.cleanupModuleCompletions, { moduleId: mod._id });
    }
    return { missions: created, deadlines };
  },
});

/**
 * Adds the starter Materials and Reference entries, shown in every track.
 * Skips entries whose title already exists in the same kind, so it's safe to run again.
 */
export const resources = internalMutation({
  args: {},
  returns: v.object({ created: v.number() }),
  handler: async (ctx) => {
    let created = 0;
    for (const kind of ["material", "reference"] as const) {
      const existing = await ctx.db
        .query("resources")
        .withIndex("by_kind_and_sortOrder", (q) => q.eq("kind", kind))
        .take(500);
      const titles = new Set(existing.map((r) => r.title));
      let sortOrder = existing.reduce((max, r) => Math.max(max, r.sortOrder), 0);
      for (const sample of SAMPLE_RESOURCES) {
        if (sample.kind !== kind || titles.has(sample.title)) continue;
        sortOrder += 1;
        await ctx.db.insert("resources", {
          kind,
          category: sample.category,
          title: sample.title,
          description: sample.description,
          resourceType: "link",
          url: sample.url,
          meta: sample.meta,
          source: sample.source,
          sortOrder,
        });
        created += 1;
      }
    }
    return { created };
  },
});

/**
 * Adds starter global guides for the roadmaps library (see
 * `convex/lib/sampleRoadmaps.ts`). Skips guides whose title already exists,
 * so it's safe to run again.
 */
export const roadmaps = internalMutation({
  args: {},
  returns: v.object({ created: v.number() }),
  handler: async (ctx) => {
    const existing = await ctx.db.query("roadmaps").take(100);
    const titles = new Set(existing.map((r) => r.title));
    let sortOrder = existing.length;
    let created = 0;
    for (const sample of SAMPLE_ROADMAPS) {
      if (titles.has(sample.title)) continue;
      const taken = await ctx.db
        .query("roadmaps")
        .withIndex("by_slug", (q) => q.eq("slug", sample.slug))
        .first();
      const roadmapId = await ctx.db.insert("roadmaps", {
        title: sample.title,
        slug: taken ? `${sample.slug}-guide` : sample.slug,
        description: sample.description,
        status: "published",
        showInLibrary: true,
        sortOrder,
      });
      sortOrder += 1;
      for (const [index, step] of sample.steps.entries()) {
        await ctx.db.insert("roadmapNodes", {
          roadmapId,
          kind: "custom",
          title: step.title,
          description: step.description,
          url: step.url,
          lane: step.lane,
          sortOrder: index,
          badge: step.badge,
        });
      }
      created += sample.steps.length;
    }
    return { created };
  },
});

/** Sends the very first invitation, as a super admin. */
export const bootstrapSuperAdmin = internalMutation({
  args: { email: v.string() },
  returns: v.id("invitations"),
  handler: async (ctx, args) => {
    return await createAndSend(
      ctx,
      normalizeEmail(args.email),
      { platformRole: "super_admin", permissions: [...PLATFORM_PERMISSIONS], trackGrants: [] },
      undefined,
    );
  },
});

/** Promotes someone who already has an account to super admin. */
export const makeSuperAdmin = internalMutation({
  args: { email: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", normalizeEmail(args.email)))
      .first();
    if (user === null) {
      throw new ConvexError(`No user with email ${args.email}`);
    }
    await ctx.db.patch("users", user._id, {
      platformRole: "super_admin",
      permissions: [...PLATFORM_PERMISSIONS],
      status: "active",
      updatedAt: Date.now(),
    });
    return null;
  },
});

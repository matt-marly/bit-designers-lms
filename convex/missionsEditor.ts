import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import { mutation, query, type QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { cohortStatusValidator, missionReviewTypeValidator, moduleStatusValidator } from "./schema";
import { getTrackAccess, requireTrackPermission, requireUser } from "./lib/auth";
import { cleanTitle } from "./lib/curriculum";
import {
  MAX_MISSIONS_PER_MODULE,
  MISSION_LIMITS,
  cleanRubric,
  loadMissions,
  uniqueMissionSlug,
} from "./lib/missions";

const MAX_COHORTS_PER_TRACK = 100;

const directionValidator = v.union(v.literal("up"), v.literal("down"));

async function requireModuleEditor(ctx: QueryCtx, moduleId: Id<"modules">) {
  const mod = await ctx.db.get("modules", moduleId);
  if (mod === null) {
    throw new ConvexError("Module not found");
  }
  await requireTrackPermission(ctx, mod.trackId, "track.content");
  return mod;
}

async function requireMissionEditor(ctx: QueryCtx, missionId: Id<"missions">) {
  const mission = await ctx.db.get("missions", missionId);
  if (mission === null) {
    throw new ConvexError("Mission not found");
  }
  await requireTrackPermission(ctx, mission.trackId, "track.content");
  return mission;
}

async function hasSubmissions(ctx: QueryCtx, missionId: Id<"missions">) {
  const first = await ctx.db
    .query("submissions")
    .withIndex("by_missionId", (q) => q.eq("missionId", missionId))
    .first();
  return first !== null;
}

export const listForModule = query({
  args: { moduleId: v.id("modules") },
  returns: v.array(
    v.object({
      _id: v.id("missions"),
      slug: v.string(),
      title: v.string(),
      reviewType: missionReviewTypeValidator,
      criteria: v.number(),
      hasBrief: v.boolean(),
    }),
  ),
  handler: async (ctx, args) => {
    // The editor panel can still be subscribed for a moment after its module is deleted.
    if ((await ctx.db.get("modules", args.moduleId)) === null) return [];
    await requireModuleEditor(ctx, args.moduleId);
    const missions = await loadMissions(ctx, args.moduleId);
    return missions.map((mission) => ({
      _id: mission._id,
      slug: mission.slug,
      title: mission.title,
      reviewType: mission.reviewType,
      criteria: mission.rubric.length,
      hasBrief: mission.brief.trim().length > 0,
    }));
  },
});

/** Returns null when the mission is gone or the caller can't edit its track. */
export const getMission = query({
  args: { missionId: v.id("missions") },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("missions"),
      title: v.string(),
      slug: v.string(),
      brief: v.string(),
      rubric: v.array(v.string()),
      reviewType: missionReviewTypeValidator,
      hasSubmissions: v.boolean(),
      module: v.object({ _id: v.id("modules"), slug: v.string(), title: v.string(), status: moduleStatusValidator }),
      track: v.object({ _id: v.id("tracks"), name: v.string() }),
      deadlines: v.array(
        v.object({
          cohortId: v.id("cohorts"),
          cohortName: v.string(),
          cohortStatus: cohortStatusValidator,
          startsAt: v.number(),
          dueAt: v.union(v.number(), v.null()),
        }),
      ),
    }),
  ),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const mission = await ctx.db.get("missions", args.missionId);
    if (mission === null) return null;
    const [mod, track] = await Promise.all([
      ctx.db.get("modules", mission.moduleId),
      ctx.db.get("tracks", mission.trackId),
    ]);
    if (mod === null || track === null) return null;
    const access = await getTrackAccess(ctx, user, track._id);
    if (!access.permissions.includes("track.content")) return null;

    const cohorts = await ctx.db
      .query("cohorts")
      .withIndex("by_trackId", (q) => q.eq("trackId", track._id))
      .take(MAX_COHORTS_PER_TRACK);
    const deadlines = await Promise.all(
      cohorts
        .filter((c) => c.status !== "archived")
        .sort((a, b) => a.startsAt - b.startsAt)
        .map(async (cohort) => {
          const deadline = await ctx.db
            .query("missionDeadlines")
            .withIndex("by_missionId_and_cohortId", (q) => q.eq("missionId", mission._id).eq("cohortId", cohort._id))
            .unique();
          return {
            cohortId: cohort._id,
            cohortName: cohort.name,
            cohortStatus: cohort.status,
            startsAt: cohort.startsAt,
            dueAt: deadline?.dueAt ?? null,
          };
        }),
    );

    return {
      _id: mission._id,
      title: mission.title,
      slug: mission.slug,
      brief: mission.brief,
      rubric: mission.rubric,
      reviewType: mission.reviewType,
      hasSubmissions: await hasSubmissions(ctx, mission._id),
      module: { _id: mod._id, slug: mod.slug, title: mod.title, status: mod.status },
      track: { _id: track._id, name: track.name },
      deadlines,
    };
  },
});

/**
 * Adds a mission. Nobody has done it yet, so every completion of the module
 * is cleared.
 */
export const createMission = mutation({
  args: { moduleId: v.id("modules"), title: v.string() },
  returns: v.id("missions"),
  handler: async (ctx, args) => {
    const mod = await requireModuleEditor(ctx, args.moduleId);
    const title = cleanTitle(args.title, "Mission");
    const missions = await loadMissions(ctx, mod._id);
    if (missions.length >= MAX_MISSIONS_PER_MODULE) {
      throw new ConvexError(`A module can have at most ${MAX_MISSIONS_PER_MODULE} missions`);
    }
    const missionId = await ctx.db.insert("missions", {
      trackId: mod.trackId,
      moduleId: mod._id,
      title,
      slug: await uniqueMissionSlug(ctx, title),
      brief: "",
      rubric: [],
      reviewType: "reviewed",
      sortOrder: missions.length > 0 ? missions[missions.length - 1].sortOrder + 1 : 0,
    });
    await ctx.scheduler.runAfter(0, internal.curriculumEditor.cleanupModuleCompletions, { moduleId: mod._id });
    return missionId;
  },
});

export const updateMission = mutation({
  args: {
    missionId: v.id("missions"),
    title: v.optional(v.string()),
    brief: v.optional(v.string()),
    rubric: v.optional(v.array(v.string())),
    reviewType: v.optional(missionReviewTypeValidator),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const mission = await requireMissionEditor(ctx, args.missionId);
    if (args.brief !== undefined && args.brief.length > MISSION_LIMITS.brief) {
      throw new ConvexError(`The brief must be ${MISSION_LIMITS.brief.toLocaleString("en-US")} characters or fewer`);
    }
    await ctx.db.patch("missions", mission._id, {
      ...(args.title !== undefined && { title: cleanTitle(args.title, "Mission") }),
      ...(args.brief !== undefined && { brief: args.brief }),
      ...(args.rubric !== undefined && { rubric: cleanRubric(args.rubric) }),
      ...(args.reviewType !== undefined && { reviewType: args.reviewType }),
    });
    return null;
  },
});

export const deleteMission = mutation({
  args: { missionId: v.id("missions") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const mission = await requireMissionEditor(ctx, args.missionId);
    if (await hasSubmissions(ctx, mission._id)) {
      throw new ConvexError("Learners have already submitted work for this mission, so it can't be deleted");
    }
    const deadlines = await ctx.db
      .query("missionDeadlines")
      .withIndex("by_missionId_and_cohortId", (q) => q.eq("missionId", mission._id))
      .take(MAX_COHORTS_PER_TRACK);
    for (const deadline of deadlines) {
      await ctx.db.delete("missionDeadlines", deadline._id);
    }
    await ctx.db.delete("missions", mission._id);
    return null;
  },
});

export const moveMission = mutation({
  args: { missionId: v.id("missions"), direction: directionValidator },
  returns: v.null(),
  handler: async (ctx, args) => {
    const mission = await requireMissionEditor(ctx, args.missionId);
    const neighbor =
      args.direction === "up"
        ? await ctx.db
            .query("missions")
            .withIndex("by_moduleId_and_sortOrder", (q) =>
              q.eq("moduleId", mission.moduleId).lt("sortOrder", mission.sortOrder),
            )
            .order("desc")
            .first()
        : await ctx.db
            .query("missions")
            .withIndex("by_moduleId_and_sortOrder", (q) =>
              q.eq("moduleId", mission.moduleId).gt("sortOrder", mission.sortOrder),
            )
            .first();
    if (neighbor === null) return null;
    await ctx.db.patch("missions", mission._id, { sortOrder: neighbor.sortOrder });
    await ctx.db.patch("missions", neighbor._id, { sortOrder: mission.sortOrder });
    return null;
  },
});

/** Sets or clears (`dueAt: null`) one cohort's deadline. Existing submissions keep their late flag. */
export const setDeadline = mutation({
  args: { missionId: v.id("missions"), cohortId: v.id("cohorts"), dueAt: v.union(v.number(), v.null()) },
  returns: v.null(),
  handler: async (ctx, args) => {
    const mission = await requireMissionEditor(ctx, args.missionId);
    const cohort = await ctx.db.get("cohorts", args.cohortId);
    if (cohort === null || cohort.trackId !== mission.trackId) {
      throw new ConvexError("Cohort not found in this track");
    }
    if (args.dueAt !== null && !Number.isFinite(args.dueAt)) {
      throw new ConvexError("Pick a valid due date");
    }
    const existing = await ctx.db
      .query("missionDeadlines")
      .withIndex("by_missionId_and_cohortId", (q) => q.eq("missionId", mission._id).eq("cohortId", cohort._id))
      .unique();
    if (args.dueAt === null) {
      if (existing !== null) await ctx.db.delete("missionDeadlines", existing._id);
    } else if (existing === null) {
      await ctx.db.insert("missionDeadlines", { missionId: mission._id, cohortId: cohort._id, dueAt: args.dueAt });
    } else {
      await ctx.db.patch("missionDeadlines", existing._id, { dueAt: args.dueAt });
    }
    return null;
  },
});

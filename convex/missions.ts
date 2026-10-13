import { ConvexError, v } from "convex/values";
import { mutation, query, type QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { missionReviewTypeValidator, moduleStatusValidator } from "./schema";
import { getTrackViewer, requireTrackViewer } from "./lib/curriculum";
import { isEndedCohort } from "./lib/auth";
import {
  ALLOWED_FILE_TYPES,
  MAX_FILE_BYTES,
  MAX_VERSIONS_PER_MISSION,
  MISSION_LIMITS,
  canSubmit,
  cleanSubmissionLink,
  dueDateFor,
  historyEntryValidator,
  isMissionSatisfied,
  latestSubmission,
  loadTrackMissions,
  missionStatus,
  recomputeModuleCompletion,
  submissionHistory,
} from "./lib/missions";
import { missionStatusValidator } from "./lib/validators";

const linkValidator = v.union(v.object({ slug: v.string(), title: v.string() }), v.null());

/** The learner's enrollment in this track, and whether its cohort has ended. */
async function learnerEnrollment(ctx: QueryCtx, userId: Id<"users">, trackId: Id<"tracks">) {
  const enrollment = await ctx.db
    .query("enrollments")
    .withIndex("by_userId_and_trackId", (q) => q.eq("userId", userId).eq("trackId", trackId))
    .first();
  const cohort = enrollment ? await ctx.db.get("cohorts", enrollment.cohortId) : null;
  return { enrollment, cohort, isAlumni: cohort !== null && isEndedCohort(cohort) };
}

export const list = query({
  args: { trackId: v.id("tracks") },
  returns: v.object({
    track: v.object({ _id: v.id("tracks"), name: v.string() }),
    cohort: v.union(v.object({ name: v.string() }), v.null()),
    isStudent: v.boolean(),
    isAlumni: v.boolean(),
    stats: v.object({
      total: v.number(),
      done: v.number(),
      needsRevision: v.number(),
      waiting: v.number(),
      notStarted: v.number(),
    }),
    missions: v.array(
      v.object({
        _id: v.id("missions"),
        slug: v.string(),
        number: v.string(),
        title: v.string(),
        reviewType: missionReviewTypeValidator,
        module: v.object({ slug: v.string(), number: v.string(), title: v.string() }),
        unit: v.object({ number: v.string(), title: v.string() }),
        status: missionStatusValidator,
        satisfied: v.boolean(),
        dueAt: v.union(v.number(), v.null()),
        isLate: v.boolean(),
        version: v.union(v.number(), v.null()),
        submittedAt: v.union(v.number(), v.null()),
      }),
    ),
  }),
  handler: async (ctx, args) => {
    const { user, track } = await requireTrackViewer(ctx, args.trackId);
    const { enrollment, cohort, isAlumni } = await learnerEnrollment(ctx, user._id, track._id);
    const entries = await loadTrackMissions(ctx, track._id, false);

    const missions = await Promise.all(
      entries.map(async ({ mission, module, number, unit, unitNumber, missionNumber }) => {
        const [latest, dueAt] = await Promise.all([
          latestSubmission(ctx, user._id, mission._id),
          cohort ? dueDateFor(ctx, mission._id, cohort._id) : Promise.resolve(null),
        ]);
        const satisfied = isMissionSatisfied(mission, latest);
        return {
          _id: mission._id,
          slug: mission.slug,
          number: missionNumber,
          title: mission.title,
          reviewType: mission.reviewType,
          module: { slug: module.slug, number, title: module.title },
          unit: { number: unitNumber, title: unit.title },
          status: missionStatus(latest),
          satisfied,
          dueAt,
          isLate: latest !== null ? latest.isLate : dueAt !== null && !satisfied && Date.now() > dueAt,
          version: latest?.version ?? null,
          submittedAt: latest?._creationTime ?? null,
        };
      }),
    );

    return {
      track: { _id: track._id, name: track.name },
      cohort: cohort ? { name: cohort.name } : null,
      isStudent: enrollment !== null && !isAlumni,
      isAlumni,
      stats: {
        total: missions.length,
        done: missions.filter((m) => m.satisfied).length,
        needsRevision: missions.filter((m) => m.status === "needs_revision").length,
        waiting: missions.filter((m) => m.status === "submitted" || m.status === "in_review").length,
        notStarted: missions.filter((m) => m.status === "not_started").length,
      },
      missions,
    };
  },
});

/** Returns null when the mission is missing, in a draft module the caller can't edit, or in a track they can't see. */
export const get = query({
  args: { slug: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      track: v.object({ _id: v.id("tracks"), name: v.string() }),
      canEdit: v.boolean(),
      isStudent: v.boolean(),
      isAlumni: v.boolean(),
      canSubmit: v.boolean(),
      mission: v.object({
        _id: v.id("missions"),
        slug: v.string(),
        number: v.string(),
        title: v.string(),
        brief: v.string(),
        rubric: v.array(v.string()),
        reviewType: missionReviewTypeValidator,
      }),
      module: v.object({ slug: v.string(), title: v.string(), status: moduleStatusValidator }),
      unit: v.object({ number: v.string(), title: v.string() }),
      status: missionStatusValidator,
      satisfied: v.boolean(),
      dueAt: v.union(v.number(), v.null()),
      total: v.number(),
      submissions: v.array(historyEntryValidator),
      prev: linkValidator,
      next: linkValidator,
    }),
  ),
  handler: async (ctx, args) => {
    const mission = await ctx.db
      .query("missions")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (mission === null) return null;
    const viewer = await getTrackViewer(ctx, mission.trackId);
    if (viewer === null) return null;
    const { user, track, canEdit } = viewer;

    const entries = await loadTrackMissions(ctx, track._id, canEdit);
    const index = entries.findIndex((e) => e.mission._id === mission._id);
    const entry = entries[index];
    if (entry === undefined) return null;

    const { enrollment, isAlumni } = await learnerEnrollment(ctx, user._id, track._id);
    const isStudent = enrollment !== null && !isAlumni;
    const [history, latest, dueAt] = await Promise.all([
      submissionHistory(ctx, user._id, mission._id),
      latestSubmission(ctx, user._id, mission._id),
      enrollment ? dueDateFor(ctx, mission._id, enrollment.cohortId) : Promise.resolve(null),
    ]);
    const neighbour = (e: (typeof entries)[number] | undefined) =>
      e ? { slug: e.mission.slug, title: e.mission.title } : null;

    return {
      track: { _id: track._id, name: track.name },
      canEdit,
      isStudent,
      isAlumni,
      canSubmit: isStudent && entry.module.status === "published" && canSubmit(mission, latest),
      mission: {
        _id: mission._id,
        slug: mission.slug,
        number: entry.missionNumber,
        title: mission.title,
        brief: mission.brief,
        rubric: mission.rubric,
        reviewType: mission.reviewType,
      },
      module: { slug: entry.module.slug, title: entry.module.title, status: entry.module.status },
      unit: { number: entry.unitNumber, title: entry.unit.title },
      status: missionStatus(latest),
      satisfied: isMissionSatisfied(mission, latest),
      dueAt,
      total: entries.length,
      submissions: history,
      prev: neighbour(entries[index - 1]),
      next: neighbour(entries[index + 1]),
    };
  },
});

async function requireSubmittableMission(ctx: QueryCtx, missionId: Id<"missions">) {
  const mission = await ctx.db.get("missions", missionId);
  if (mission === null) {
    throw new ConvexError("Mission not found");
  }
  const mod = await ctx.db.get("modules", mission.moduleId);
  const { user, track } = await requireTrackViewer(ctx, mission.trackId);
  if (mod === null || mod.status !== "published") {
    throw new ConvexError("Mission not found");
  }
  if (track.status !== "active") {
    throw new ConvexError("This track is archived");
  }
  const { enrollment, isAlumni } = await learnerEnrollment(ctx, user._id, track._id);
  if (enrollment === null) {
    throw new ConvexError("Only students in this track can submit work");
  }
  if (isAlumni) {
    throw new ConvexError("Your cohort has ended, so you can't submit new work");
  }
  return { mission, mod, user, enrollment };
}

export const generateUploadUrl = mutation({
  args: { missionId: v.id("missions") },
  returns: v.string(),
  handler: async (ctx, args) => {
    await requireSubmittableMission(ctx, args.missionId);
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Validation problems come back as `{ ok: false }` rather than a thrown error,
 * so the rejected upload can be deleted in the same (committed) transaction.
 */
export const submit = mutation({
  args: {
    missionId: v.id("missions"),
    linkUrl: v.string(),
    fileId: v.optional(v.id("_storage")),
    fileName: v.optional(v.string()),
    note: v.optional(v.string()),
  },
  returns: v.union(
    v.object({ ok: v.literal(true), submissionId: v.id("submissions"), moduleComplete: v.boolean() }),
    v.object({ ok: v.literal(false), error: v.string() }),
  ),
  handler: async (ctx, args) => {
    const { mission, mod, user, enrollment } = await requireSubmittableMission(ctx, args.missionId);
    const latest = await latestSubmission(ctx, user._id, mission._id);
    const note = args.note?.trim() || undefined;
    const file = args.fileId ? await ctx.db.system.get("_storage", args.fileId) : null;

    let error: string | null = null;
    let linkUrl = "";
    if (!canSubmit(mission, latest)) {
      error = latest?.status === "passed" ? "This mission has already passed" : "Your last submission is still waiting for review";
    } else if ((latest?.version ?? 0) >= MAX_VERSIONS_PER_MISSION) {
      error = "You've reached the limit of submissions for this mission";
    } else if (note !== undefined && note.length > MISSION_LIMITS.note) {
      error = `The note must be ${MISSION_LIMITS.note.toLocaleString("en-US")} characters or fewer`;
    } else if (args.fileId && file === null) {
      error = "The file upload didn't finish. Try attaching it again.";
    } else if (file !== null && file.size > MAX_FILE_BYTES) {
      error = "Files must be 10 MB or smaller";
    } else if (file !== null && !(ALLOWED_FILE_TYPES as readonly string[]).includes(file.contentType ?? "")) {
      error = "Attach a PDF, PNG, JPG or WebP file";
    } else {
      try {
        linkUrl = cleanSubmissionLink(args.linkUrl);
      } catch (e) {
        error = e instanceof ConvexError && typeof e.data === "string" ? e.data : "Enter a valid link";
      }
    }
    if (error !== null) {
      if (file !== null) await ctx.storage.delete(file._id);
      return { ok: false as const, error };
    }

    const fileName = file !== null ? (args.fileName?.trim() || "attachment").slice(0, MISSION_LIMITS.fileName) : undefined;
    const dueAt = await dueDateFor(ctx, mission._id, enrollment.cohortId);
    const submissionId = await ctx.db.insert("submissions", {
      userId: user._id,
      missionId: mission._id,
      trackId: mission.trackId,
      cohortId: enrollment.cohortId,
      linkUrl,
      fileId: file?._id,
      fileName,
      note,
      status: mission.reviewType === "completion_only" ? "passed" : "submitted",
      isLate: dueAt !== null && Date.now() > dueAt,
      version: (latest?.version ?? 0) + 1,
    });
    return { ok: true as const, submissionId, moduleComplete: await recomputeModuleCompletion(ctx, user._id, mod) };
  },
});

import { ConvexError, v } from "convex/values";
import { mutation, query, type QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { missionReviewTypeValidator, reviewOutcomeValidator, submissionStatusValidator } from "./schema";
import { getTrackAccess, requireTrackPermission, requireUser } from "./lib/auth";
import { notify } from "./lib/notifications";
import {
  MAX_VERSIONS_PER_MISSION,
  MISSION_LIMITS,
  dueDateFor,
  historyEntry,
  historyEntryValidator,
  recomputeModuleCompletion,
} from "./lib/missions";

const MAX_TRACKS = 200;
const QUEUE_LIMIT = 50;
const COUNT_LIMIT = 100;

const tabValidator = v.union(v.literal("to_review"), v.literal("in_review"), v.literal("reviewed"));

const entryValidator = v.object({
  _id: v.id("submissions"),
  status: submissionStatusValidator,
  version: v.number(),
  isLate: v.boolean(),
  submittedAt: v.number(),
  dueAt: v.union(v.number(), v.null()),
  linkUrl: v.string(),
  fileName: v.union(v.string(), v.null()),
  fileUrl: v.union(v.string(), v.null()),
  note: v.union(v.string(), v.null()),
  isOwn: v.boolean(),
  learner: v.object({ name: v.string(), email: v.string() }),
  mission: v.object({
    _id: v.id("missions"),
    slug: v.string(),
    title: v.string(),
    reviewType: missionReviewTypeValidator,
    rubric: v.array(v.string()),
  }),
  moduleTitle: v.string(),
  track: v.object({ _id: v.id("tracks"), name: v.string() }),
  cohortName: v.string(),
  reviewer: v.union(v.object({ name: v.string(), isMe: v.boolean() }), v.null()),
  review: v.union(
    v.object({
      outcome: reviewOutcomeValidator,
      comment: v.string(),
      reviewerName: v.string(),
      reviewedAt: v.number(),
      rubricChecks: v.union(v.array(v.boolean()), v.null()),
    }),
    v.null(),
  ),
});

async function reviewableTrackDocs(ctx: QueryCtx, user: Doc<"users">) {
  const tracks = await ctx.db.query("tracks").take(MAX_TRACKS);
  const result: Doc<"tracks">[] = [];
  for (const track of tracks) {
    const access = await getTrackAccess(ctx, user, track._id);
    if (access.permissions.includes("track.reviews")) result.push(track);
  }
  return result.sort((a, b) => a.name.localeCompare(b.name));
}

async function queueEntry(ctx: QueryCtx, submission: Doc<"submissions">, viewerId: Id<"users">) {
  const [mission, learner, track, cohort, reviewer, details, dueAt] = await Promise.all([
    ctx.db.get("missions", submission.missionId),
    ctx.db.get("users", submission.userId),
    ctx.db.get("tracks", submission.trackId),
    ctx.db.get("cohorts", submission.cohortId),
    submission.reviewerId ? ctx.db.get("users", submission.reviewerId) : Promise.resolve(null),
    historyEntry(ctx, submission),
    dueDateFor(ctx, submission.missionId, submission.cohortId),
  ]);
  if (mission === null || learner === null || track === null) return null;
  const mod = await ctx.db.get("modules", mission.moduleId);
  return {
    _id: submission._id,
    status: submission.status,
    version: submission.version,
    isLate: submission.isLate,
    submittedAt: submission._creationTime,
    dueAt,
    linkUrl: submission.linkUrl,
    fileName: details.fileName,
    fileUrl: details.fileUrl,
    note: details.note,
    isOwn: submission.userId === viewerId,
    learner: { name: learner.fullName, email: learner.email },
    mission: {
      _id: mission._id,
      slug: mission.slug,
      title: mission.title,
      reviewType: mission.reviewType,
      rubric: mission.rubric,
    },
    moduleTitle: mod?.title ?? "",
    track: { _id: track._id, name: track.name },
    cohortName: cohort?.name ?? "",
    reviewer: reviewer ? { name: reviewer.fullName, isMe: reviewer._id === viewerId } : null,
    review: details.review,
  };
}

async function loadTab(ctx: QueryCtx, trackId: Id<"tracks">, tab: "to_review" | "in_review" | "reviewed") {
  if (tab === "reviewed") {
    return await ctx.db
      .query("submissions")
      .withIndex("by_trackId_and_reviewedAt", (q) => q.eq("trackId", trackId).gt("reviewedAt", 0))
      .order("desc")
      .take(QUEUE_LIMIT);
  }
  return await ctx.db
    .query("submissions")
    .withIndex("by_trackId_and_status", (q) =>
      q.eq("trackId", trackId).eq("status", tab === "to_review" ? "submitted" : "in_review"),
    )
    .take(QUEUE_LIMIT);
}

export const reviewableTracks = query({
  args: {},
  returns: v.array(v.object({ _id: v.id("tracks"), name: v.string(), waiting: v.number() })),
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const tracks = await reviewableTrackDocs(ctx, user);
    return await Promise.all(
      tracks.map(async (track) => {
        const waiting = await ctx.db
          .query("submissions")
          .withIndex("by_trackId_and_status", (q) => q.eq("trackId", track._id).eq("status", "submitted"))
          .take(COUNT_LIMIT);
        return { _id: track._id, name: track.name, waiting: waiting.length };
      }),
    );
  },
});

/** Submissions waiting for a first look, across every track the caller reviews. Capped at 100. */
export const waitingCount = query({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    let total = 0;
    for (const track of await reviewableTrackDocs(ctx, user)) {
      if (total >= COUNT_LIMIT) break;
      const waiting = await ctx.db
        .query("submissions")
        .withIndex("by_trackId_and_status", (q) => q.eq("trackId", track._id).eq("status", "submitted"))
        .take(COUNT_LIMIT - total);
      total += waiting.length;
    }
    return total;
  },
});

/**
 * Oldest first for work still waiting, most recent first for reviewed work.
 * Without `trackId` it covers every track the caller can review.
 */
export const queue = query({
  args: { trackId: v.optional(v.id("tracks")), tab: tabValidator, cohortId: v.optional(v.id("cohorts")) },
  returns: v.array(entryValidator),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    let trackIds: Id<"tracks">[];
    if (args.trackId !== undefined) {
      await requireTrackPermission(ctx, args.trackId, "track.reviews");
      trackIds = [args.trackId];
    } else {
      trackIds = (await reviewableTrackDocs(ctx, user)).map((t) => t._id);
    }

    const batches = await Promise.all(trackIds.map((trackId) => loadTab(ctx, trackId, args.tab)));
    const submissions = batches
      .flat()
      .filter((s) => args.cohortId === undefined || s.cohortId === args.cohortId)
      .sort((a, b) =>
        args.tab === "reviewed" ? (b.reviewedAt ?? 0) - (a.reviewedAt ?? 0) : a._creationTime - b._creationTime,
      )
      .slice(0, QUEUE_LIMIT);

    const entries = await Promise.all(submissions.map((s) => queueEntry(ctx, s, user._id)));
    return entries.filter((e) => e !== null);
  },
});

/** Earlier attempts by the same learner on the same mission, newest first. Null when off limits. */
export const history = query({
  args: { submissionId: v.id("submissions") },
  returns: v.union(v.null(), v.array(historyEntryValidator)),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const submission = await ctx.db.get("submissions", args.submissionId);
    if (submission === null) return null;
    const access = await getTrackAccess(ctx, user, submission.trackId);
    if (!access.permissions.includes("track.reviews")) return null;
    const earlier = await ctx.db
      .query("submissions")
      .withIndex("by_userId_and_missionId", (q) =>
        q.eq("userId", submission.userId).eq("missionId", submission.missionId),
      )
      .order("desc")
      .take(MAX_VERSIONS_PER_MISSION);
    return await Promise.all(
      earlier.filter((s) => s.version < submission.version).map((s) => historyEntry(ctx, s)),
    );
  },
});

async function requireReviewable(ctx: QueryCtx, submissionId: Id<"submissions">) {
  const submission = await ctx.db.get("submissions", submissionId);
  if (submission === null) {
    throw new ConvexError("Submission not found");
  }
  const { user } = await requireTrackPermission(ctx, submission.trackId, "track.reviews");
  if (submission.userId === user._id) {
    throw new ConvexError("You can't review your own work");
  }
  if (submission.status !== "submitted" && submission.status !== "in_review") {
    throw new ConvexError("This submission has already been reviewed");
  }
  return { submission, user };
}

/** Claims a submission so other reviewers can see someone is on it. */
export const startReview = mutation({
  args: { submissionId: v.id("submissions") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { submission, user } = await requireReviewable(ctx, args.submissionId);
    if (submission.status === "in_review" && submission.reviewerId !== user._id) {
      throw new ConvexError("Someone else is already reviewing this");
    }
    await ctx.db.patch("submissions", submission._id, { status: "in_review", reviewerId: user._id });
    return null;
  },
});

/** Records the outcome. Anyone with review rights can finish a review another reviewer started. */
export const review = mutation({
  args: {
    submissionId: v.id("submissions"),
    outcome: reviewOutcomeValidator,
    comment: v.string(),
    rubricChecks: v.optional(v.array(v.boolean())),
  },
  returns: v.object({ moduleComplete: v.boolean() }),
  handler: async (ctx, args) => {
    const { submission, user } = await requireReviewable(ctx, args.submissionId);
    const comment = args.comment.trim();
    if (!comment) {
      throw new ConvexError("Write a comment for the learner");
    }
    if (comment.length > MISSION_LIMITS.comment) {
      throw new ConvexError(`The comment must be ${MISSION_LIMITS.comment.toLocaleString("en-US")} characters or fewer`);
    }
    const mission = await ctx.db.get("missions", submission.missionId);
    if (mission === null) {
      throw new ConvexError("Mission not found");
    }
    if (args.rubricChecks !== undefined && args.rubricChecks.length !== mission.rubric.length) {
      throw new ConvexError("The rubric changed while you were reviewing. Reload and try again.");
    }

    await ctx.db.insert("reviews", {
      submissionId: submission._id,
      reviewerId: user._id,
      outcome: args.outcome,
      comment,
      rubricChecks: args.rubricChecks,
    });
    await ctx.db.patch("submissions", submission._id, {
      status: args.outcome,
      reviewerId: user._id,
      reviewedAt: Date.now(),
    });

    await notify(ctx, submission.userId, {
      type: "review",
      title: args.outcome === "passed" ? `Your work passed: ${mission.title}` : `Needs revision: ${mission.title}`,
      body: comment,
      link: `/missions/${mission.slug}`,
    });

    const mod = await ctx.db.get("modules", mission.moduleId);
    const moduleComplete = mod ? await recomputeModuleCompletion(ctx, submission.userId, mod) : false;
    return { moduleComplete };
  },
});

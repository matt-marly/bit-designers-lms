import { ConvexError, v } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { reviewOutcomeValidator, submissionStatusValidator } from "../schema";
import { maybeIssueCertificate } from "./certificates";
import { completedLessonIds, flattenOutline, loadLessons, loadOutline, padNumber, slugify } from "./curriculum";

export const MAX_MISSIONS_PER_MODULE = 10;
export const MAX_MISSIONS_PER_TRACK = 300;
export const MAX_VERSIONS_PER_MISSION = 50;
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const ALLOWED_FILE_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/webp"] as const;

export const MISSION_LIMITS = {
  brief: 20_000,
  criteria: 12,
  criterion: 300,
  note: 2000,
  comment: 5000,
  link: 1000,
  fileName: 200,
} as const;

export type MissionStatus = "not_started" | "submitted" | "in_review" | "passed" | "needs_revision";

export async function loadMissions(ctx: QueryCtx, moduleId: Id<"modules">) {
  return await ctx.db
    .query("missions")
    .withIndex("by_moduleId_and_sortOrder", (q) => q.eq("moduleId", moduleId))
    .take(MAX_MISSIONS_PER_MODULE);
}

/** Every mission of a track in teaching order, numbered from 01. */
export async function loadTrackMissions(ctx: QueryCtx, trackId: Id<"tracks">, includeDrafts: boolean) {
  const flat = flattenOutline(await loadOutline(ctx, trackId, includeDrafts));
  const perModule = await Promise.all(flat.map((entry) => loadMissions(ctx, entry.module._id)));
  return flat.flatMap((entry, i) => perModule[i].map((mission) => ({ ...entry, mission }))).map((entry, i) => ({
    ...entry,
    missionNumber: padNumber(i + 1),
  }));
}

export async function latestSubmission(ctx: QueryCtx, userId: Id<"users">, missionId: Id<"missions">) {
  return await ctx.db
    .query("submissions")
    .withIndex("by_userId_and_missionId", (q) => q.eq("userId", userId).eq("missionId", missionId))
    .order("desc")
    .first();
}

export function missionStatus(latest: Doc<"submissions"> | null): MissionStatus {
  return latest === null ? "not_started" : latest.status;
}

/** Completion-only missions count once submitted; reviewed missions only once passed. */
export function isMissionSatisfied(mission: Doc<"missions">, latest: Doc<"submissions"> | null): boolean {
  if (latest === null) return false;
  return mission.reviewType === "completion_only" || latest.status === "passed";
}

/** Whether the learner may send a new version right now. */
export function canSubmit(mission: Doc<"missions">, latest: Doc<"submissions"> | null): boolean {
  if (latest === null) return true;
  if (mission.reviewType === "completion_only") return true;
  return latest.status === "needs_revision";
}

/**
 * A module is complete when every lesson is done and every mission is
 * satisfied. Returns the new state.
 */
export async function recomputeModuleCompletion(
  ctx: MutationCtx,
  userId: Id<"users">,
  mod: Doc<"modules">,
): Promise<boolean> {
  const [lessons, done, missions] = await Promise.all([
    loadLessons(ctx, mod._id),
    completedLessonIds(ctx, userId, mod._id),
    loadMissions(ctx, mod._id),
  ]);
  let complete = (lessons.length > 0 || missions.length > 0) && lessons.every((l) => done.has(l._id));
  for (const mission of missions) {
    if (!complete) break;
    complete = isMissionSatisfied(mission, await latestSubmission(ctx, userId, mission._id));
  }

  const existing = await ctx.db
    .query("moduleCompletions")
    .withIndex("by_userId_and_moduleId", (q) => q.eq("userId", userId).eq("moduleId", mod._id))
    .first();
  if (complete && existing === null) {
    await ctx.db.insert("moduleCompletions", { userId, moduleId: mod._id, trackId: mod.trackId });
    await maybeIssueCertificate(ctx, userId, mod.trackId);
  } else if (!complete && existing !== null) {
    await ctx.db.delete("moduleCompletions", existing._id);
  }
  return complete;
}

export async function uniqueMissionSlug(ctx: QueryCtx, title: string): Promise<string> {
  const base = slugify(title) || "mission";
  for (let i = 1; i <= 100; i++) {
    const candidate = i === 1 ? base : `${base}-${i}`;
    const taken = await ctx.db
      .query("missions")
      .withIndex("by_slug", (q) => q.eq("slug", candidate))
      .first();
    if (taken === null) return candidate;
  }
  throw new ConvexError("Too many missions share this title. Pick a different one.");
}

export function cleanRubric(rubric: string[]): string[] {
  const cleaned = rubric.map((c) => c.trim()).filter(Boolean);
  if (cleaned.length > MISSION_LIMITS.criteria) {
    throw new ConvexError(`A rubric can have at most ${MISSION_LIMITS.criteria} criteria`);
  }
  for (const criterion of cleaned) {
    if (criterion.length > MISSION_LIMITS.criterion) {
      throw new ConvexError(`Each criterion must be ${MISSION_LIMITS.criterion} characters or fewer`);
    }
  }
  return cleaned;
}

export function cleanSubmissionLink(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new ConvexError("Add a link to your work");
  }
  if (trimmed.length > MISSION_LIMITS.link) {
    throw new ConvexError("The link is too long");
  }
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new ConvexError("Enter a full link, starting with https://");
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new ConvexError("Enter a full link, starting with https://");
  }
  return trimmed;
}

export const historyEntryValidator = v.object({
  _id: v.id("submissions"),
  version: v.number(),
  linkUrl: v.string(),
  fileName: v.union(v.string(), v.null()),
  fileUrl: v.union(v.string(), v.null()),
  note: v.union(v.string(), v.null()),
  status: submissionStatusValidator,
  isLate: v.boolean(),
  submittedAt: v.number(),
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

/** A learner's attempts at one mission, newest first, with reviews and signed file links. */
export async function submissionHistory(ctx: QueryCtx, userId: Id<"users">, missionId: Id<"missions">) {
  const submissions = await ctx.db
    .query("submissions")
    .withIndex("by_userId_and_missionId", (q) => q.eq("userId", userId).eq("missionId", missionId))
    .order("desc")
    .take(MAX_VERSIONS_PER_MISSION);
  return await Promise.all(submissions.map((s) => historyEntry(ctx, s)));
}

export async function historyEntry(ctx: QueryCtx, submission: Doc<"submissions">) {
  const [review, fileUrl] = await Promise.all([
    ctx.db
      .query("reviews")
      .withIndex("by_submissionId", (q) => q.eq("submissionId", submission._id))
      .order("desc")
      .first(),
    submission.fileId ? ctx.storage.getUrl(submission.fileId) : Promise.resolve(null),
  ]);
  const reviewer = review ? await ctx.db.get("users", review.reviewerId) : null;
  return {
    _id: submission._id,
    version: submission.version,
    linkUrl: submission.linkUrl,
    fileName: submission.fileName ?? null,
    fileUrl,
    note: submission.note ?? null,
    status: submission.status,
    isLate: submission.isLate,
    submittedAt: submission._creationTime,
    review: review
      ? {
          outcome: review.outcome,
          comment: review.comment,
          reviewerName: reviewer?.fullName ?? "A reviewer",
          reviewedAt: review._creationTime,
          rubricChecks: review.rubricChecks ?? null,
        }
      : null,
  };
}

export async function dueDateFor(ctx: QueryCtx, missionId: Id<"missions">, cohortId: Id<"cohorts">) {
  const deadline = await ctx.db
    .query("missionDeadlines")
    .withIndex("by_missionId_and_cohortId", (q) => q.eq("missionId", missionId).eq("cohortId", cohortId))
    .unique();
  return deadline?.dueAt ?? null;
}

import { v } from "convex/values";
import { query, type QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { getTrackAccess, hasAdminAccess, hasPlatformPermission, isEndedCohort, requireUser } from "./lib/auth";
import type { TrackPermission } from "./lib/permissions";

const MAX_TRACKS = 200;
const MAX_COHORTS_PER_TRACK = 100;
const COUNT_LIMIT = 100;
const MAX_LEARNERS_PER_COHORT = 500;
const RECENT_LIMIT = 6;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

type StaffedTrack = { track: Doc<"tracks">; permissions: TrackPermission[] };

async function staffedTracks(ctx: QueryCtx, user: Doc<"users">): Promise<StaffedTrack[]> {
  const tracks = await ctx.db.query("tracks").take(MAX_TRACKS);
  const result: StaffedTrack[] = [];
  for (const track of tracks) {
    const access = await getTrackAccess(ctx, user, track._id);
    if (access.staffRole !== null || access.permissions.length > 0) {
      result.push({ track, permissions: access.permissions });
    }
  }
  return result.sort((a, b) => a.track.name.localeCompare(b.track.name));
}

async function countSince(
  ctx: QueryCtx,
  trackId: Id<"tracks">,
  status: Doc<"submissions">["status"],
  since: number,
  limit: number,
) {
  if (limit <= 0) return 0;
  const rows = await ctx.db
    .query("submissions")
    .withIndex("by_trackId_and_status", (q) =>
      q.eq("trackId", trackId).eq("status", status).gt("_creationTime", since),
    )
    .take(limit);
  return rows.length;
}

const countValidator = v.object({ value: v.number(), capped: v.boolean() });

function capped(value: number) {
  return { value: Math.min(value, COUNT_LIMIT), capped: value >= COUNT_LIMIT };
}

/** Dashboard numbers for the tracks the caller staffs. `now` comes from the client. */
export const overview = query({
  args: { now: v.number() },
  returns: v.union(
    v.null(),
    v.object({
      can: v.object({ invite: v.boolean(), review: v.boolean(), announce: v.boolean(), schedule: v.boolean() }),
      activeCohorts: v.array(
        v.object({ _id: v.id("cohorts"), name: v.string(), trackName: v.string(), learners: v.number() }),
      ),
      learners: countValidator,
      waiting: countValidator,
      submittedThisWeek: countValidator,
      reviewedThisWeek: countValidator,
      nextSession: v.union(
        v.null(),
        v.object({ _id: v.id("workshops"), title: v.string(), scheduledAt: v.number(), trackName: v.string() }),
      ),
      recent: v.array(
        v.object({
          _id: v.id("submissions"),
          learnerName: v.string(),
          missionTitle: v.string(),
          trackName: v.string(),
          version: v.number(),
          submittedAt: v.number(),
        }),
      ),
    }),
  ),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (!(await hasAdminAccess(ctx, user))) return null;

    const tracks = await staffedTracks(ctx, user);
    const reviewTracks = tracks.filter((t) => t.permissions.includes("track.reviews"));
    const since = args.now - WEEK_MS;

    const activeCohorts: { _id: Id<"cohorts">; name: string; trackName: string; learners: number }[] = [];
    let learners = 0;
    for (const { track } of tracks) {
      const cohorts = await ctx.db
        .query("cohorts")
        .withIndex("by_trackId", (q) => q.eq("trackId", track._id))
        .take(MAX_COHORTS_PER_TRACK);
      for (const cohort of cohorts) {
        if (isEndedCohort(cohort)) continue;
        const enrolled = await ctx.db
          .query("enrollments")
          .withIndex("by_cohortId", (q) => q.eq("cohortId", cohort._id))
          .take(MAX_LEARNERS_PER_COHORT);
        learners += enrolled.length;
        activeCohorts.push({ _id: cohort._id, name: cohort.name, trackName: track.name, learners: enrolled.length });
      }
    }

    let waiting = 0;
    let submittedThisWeek = 0;
    let reviewedThisWeek = 0;
    const waitingDocs: Doc<"submissions">[] = [];
    for (const { track } of reviewTracks) {
      const rows = await ctx.db
        .query("submissions")
        .withIndex("by_trackId_and_status", (q) => q.eq("trackId", track._id).eq("status", "submitted"))
        .take(COUNT_LIMIT - waiting);
      waiting += rows.length;
      waitingDocs.push(...rows);

      for (const status of ["submitted", "in_review", "passed", "needs_revision"] as const) {
        submittedThisWeek += await countSince(ctx, track._id, status, since, COUNT_LIMIT - submittedThisWeek);
      }
      if (reviewedThisWeek < COUNT_LIMIT) {
        const reviewed = await ctx.db
          .query("submissions")
          .withIndex("by_trackId_and_reviewedAt", (q) => q.eq("trackId", track._id).gt("reviewedAt", since))
          .take(COUNT_LIMIT - reviewedThisWeek);
        reviewedThisWeek += reviewed.length;
      }
      if (waiting >= COUNT_LIMIT) break;
    }

    const trackName = new Map(tracks.map((t) => [t.track._id, t.track.name]));
    const recentDocs = waitingDocs.sort((a, b) => a._creationTime - b._creationTime).slice(0, RECENT_LIMIT);
    const recent = (
      await Promise.all(
        recentDocs.map(async (s) => {
          const [learner, mission] = await Promise.all([ctx.db.get("users", s.userId), ctx.db.get("missions", s.missionId)]);
          if (!learner || !mission) return null;
          return {
            _id: s._id,
            learnerName: learner.fullName,
            missionTitle: mission.title,
            trackName: trackName.get(s.trackId) ?? "",
            version: s.version,
            submittedAt: s._creationTime,
          };
        }),
      )
    ).filter((r) => r !== null);

    let nextSession: { _id: Id<"workshops">; title: string; scheduledAt: number; trackName: string } | null = null;
    for (const { track } of tracks) {
      const upcoming = await ctx.db
        .query("workshops")
        .withIndex("by_trackId_and_scheduledAt", (q) => q.eq("trackId", track._id).gt("scheduledAt", args.now))
        .first();
      if (upcoming && (nextSession === null || upcoming.scheduledAt < nextSession.scheduledAt)) {
        nextSession = { _id: upcoming._id, title: upcoming.title, scheduledAt: upcoming.scheduledAt, trackName: track.name };
      }
    }

    const anyTrack = (p: TrackPermission) => tracks.some((t) => t.permissions.includes(p));
    return {
      can: {
        invite: hasPlatformPermission(user, "invites.manage") || anyTrack("track.students.invite"),
        review: reviewTracks.length > 0,
        announce: hasPlatformPermission(user, "announcements.global") || anyTrack("track.announcements"),
        schedule: anyTrack("track.workshops"),
      },
      activeCohorts,
      learners: { value: learners, capped: false },
      waiting: capped(waiting),
      submittedThisWeek: capped(submittedThisWeek),
      reviewedThisWeek: capped(reviewedThisWeek),
      nextSession,
      recent,
    };
  },
});

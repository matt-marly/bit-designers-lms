import { v } from "convex/values";
import { query, type QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { getTrackViewer } from "./lib/curriculum";
import { avatarUrlFor } from "./lib/profile";

const MAX_COHORTS_PER_TRACK = 100;
const MAX_MEMBERS_PER_COHORT = 300;
const MAX_STAFF = 100;
const MAX_SHOWCASE_SCAN = 200;
const MAX_SHOWCASE_ITEMS = 60;

const personValidator = v.object({
  _id: v.id("users"),
  fullName: v.string(),
  avatarUrl: v.union(v.string(), v.null()),
  bio: v.union(v.string(), v.null()),
  portfolioUrl: v.union(v.string(), v.null()),
});

async function toPerson(ctx: QueryCtx, user: Doc<"users">) {
  return {
    _id: user._id,
    fullName: user.fullName,
    avatarUrl: await avatarUrlFor(ctx, user),
    bio: user.bio ?? null,
    portfolioUrl: user.portfolioUrl ?? null,
  };
}

async function activeUsers(ctx: QueryCtx, ids: Id<"users">[]) {
  const users = await Promise.all([...new Set(ids)].map((id) => ctx.db.get("users", id)));
  return users.filter((u): u is Doc<"users"> => u !== null && u.status === "active");
}

/**
 * Learners see their own cohort and the track's mentors. Staff without a
 * cohort see every cohort in the track. Emails are never included.
 */
export const directory = query({
  args: { trackId: v.id("tracks") },
  returns: v.union(
    v.null(),
    v.object({
      cohorts: v.array(
        v.object({
          _id: v.id("cohorts"),
          name: v.string(),
          startsAt: v.number(),
          endsAt: v.union(v.number(), v.null()),
          isOwn: v.boolean(),
          members: v.array(personValidator),
        }),
      ),
      mentors: v.array(personValidator.extend({ role: v.union(v.literal("lead_mentor"), v.literal("co_mentor")) })),
    }),
  ),
  handler: async (ctx, args) => {
    const viewer = await getTrackViewer(ctx, args.trackId);
    if (viewer === null) return null;
    const { access } = viewer;
    const isStaff = access.staffRole !== null || access.permissions.length > 0;

    let cohorts: Doc<"cohorts">[] = [];
    if (access.cohortId !== null) {
      const own = await ctx.db.get("cohorts", access.cohortId);
      if (own) cohorts = [own];
    }
    if (isStaff) {
      const all = await ctx.db
        .query("cohorts")
        .withIndex("by_trackId", (q) => q.eq("trackId", args.trackId))
        .take(MAX_COHORTS_PER_TRACK);
      const others = all.filter((c) => c._id !== access.cohortId && c.status !== "archived");
      cohorts = [...cohorts, ...others.sort((a, b) => b.startsAt - a.startsAt)];
    }

    const cohortResults = await Promise.all(
      cohorts.map(async (cohort) => {
        const enrollments = await ctx.db
          .query("enrollments")
          .withIndex("by_cohortId", (q) => q.eq("cohortId", cohort._id))
          .take(MAX_MEMBERS_PER_COHORT);
        const users = await activeUsers(ctx, enrollments.map((e) => e.userId));
        users.sort((a, b) => a.fullName.localeCompare(b.fullName));
        return {
          _id: cohort._id,
          name: cohort.name,
          startsAt: cohort.startsAt,
          endsAt: cohort.endsAt ?? null,
          isOwn: cohort._id === access.cohortId,
          members: await Promise.all(users.map((u) => toPerson(ctx, u))),
        };
      }),
    );

    const [leads, coMentors] = await Promise.all(
      (["lead_mentor", "co_mentor"] as const).map((role) =>
        ctx.db
          .query("trackMembers")
          .withIndex("by_trackId_and_role", (q) => q.eq("trackId", args.trackId).eq("role", role))
          .take(MAX_STAFF),
      ),
    );
    const roleOf = new Map<Id<"users">, "lead_mentor" | "co_mentor">();
    for (const m of coMentors) roleOf.set(m.userId, "co_mentor");
    for (const m of leads) roleOf.set(m.userId, "lead_mentor");
    const staffUsers = await activeUsers(ctx, [...roleOf.keys()]);
    staffUsers.sort(
      (a, b) =>
        Number(roleOf.get(a._id) === "co_mentor") - Number(roleOf.get(b._id) === "co_mentor") ||
        a.fullName.localeCompare(b.fullName),
    );
    const mentors = await Promise.all(
      staffUsers.map(async (u) => ({ ...(await toPerson(ctx, u)), role: roleOf.get(u._id)! })),
    );

    return { cohorts: cohortResults, mentors };
  },
});

/** Passed work on reviewed missions, newest first. Learners can opt out on their profile. Links only. */
export const showcase = query({
  args: { trackId: v.id("tracks") },
  returns: v.array(
    v.object({
      _id: v.id("submissions"),
      missionTitle: v.string(),
      missionSlug: v.string(),
      linkUrl: v.string(),
      reviewedAt: v.number(),
      learner: v.object({ _id: v.id("users"), fullName: v.string(), avatarUrl: v.union(v.string(), v.null()) }),
    }),
  ),
  handler: async (ctx, args) => {
    const viewer = await getTrackViewer(ctx, args.trackId);
    if (viewer === null) return [];

    const passed = await ctx.db
      .query("submissions")
      .withIndex("by_trackId_and_status", (q) => q.eq("trackId", args.trackId).eq("status", "passed"))
      .order("desc")
      .take(MAX_SHOWCASE_SCAN);

    const missions = new Map<Id<"missions">, Doc<"missions"> | null>();
    const users = new Map<Id<"users">, Doc<"users"> | null>();
    const seen = new Set<string>();
    const items = [];
    for (const submission of passed) {
      if (submission.reviewedAt === undefined) continue;
      const key = `${submission.userId}:${submission.missionId}`;
      if (seen.has(key)) continue;

      if (!missions.has(submission.missionId)) {
        missions.set(submission.missionId, await ctx.db.get("missions", submission.missionId));
      }
      const mission = missions.get(submission.missionId);
      if (!mission || mission.reviewType !== "reviewed") continue;
      const mod = await ctx.db.get("modules", mission.moduleId);
      if (!mod || mod.status !== "published") continue;

      if (!users.has(submission.userId)) {
        users.set(submission.userId, await ctx.db.get("users", submission.userId));
      }
      const user = users.get(submission.userId);
      if (!user || user.status !== "active" || user.showInShowcase === false) continue;

      seen.add(key);
      items.push({
        _id: submission._id,
        missionTitle: mission.title,
        missionSlug: mission.slug,
        linkUrl: submission.linkUrl,
        reviewedAt: submission.reviewedAt,
        learner: { _id: user._id, fullName: user.fullName, avatarUrl: await avatarUrlFor(ctx, user) },
      });
      if (items.length >= MAX_SHOWCASE_ITEMS) break;
    }
    return items.sort((a, b) => b.reviewedAt - a.reviewedAt);
  },
});

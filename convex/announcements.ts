import { ConvexError, v } from "convex/values";
import { mutation, query, type QueryCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import { plainPreview } from "./lib/notifications";
import type { Doc, Id } from "./_generated/dataModel";
import {
  getTrackAccess,
  hasPlatformPermission,
  isEndedCohort,
  requirePlatformPermission,
  requireTrackPermission,
  requireUser,
} from "./lib/auth";
import { getTrackViewer } from "./lib/curriculum";
import { requireText } from "./lib/urls";
import { ANNOUNCEMENT_LIMITS } from "./lib/announcements";

const MAX_TRACKS = 200;
const MAX_COHORTS_PER_TRACK = 100;
const MAX_ADMIN_ITEMS = 100;
const MAX_FEED_ITEMS = 20;

const scopeValidator = v.union(v.literal("global"), v.literal("cohort"));

const feedItemValidator = v.object({
  _id: v.id("announcements"),
  title: v.string(),
  body: v.string(),
  scope: scopeValidator,
  createdAt: v.number(),
  authorName: v.union(v.string(), v.null()),
});

async function authorName(ctx: QueryCtx, userId: Id<"users"> | undefined) {
  if (!userId) return null;
  const user = await ctx.db.get("users", userId);
  return user?.fullName ?? null;
}

async function requireCanManage(ctx: QueryCtx, announcement: Doc<"announcements">) {
  if (announcement.scope === "global") {
    return await requirePlatformPermission(ctx, "announcements.global");
  }
  if (!announcement.trackId) {
    throw new ConvexError("Not authorized");
  }
  const { user } = await requireTrackPermission(ctx, announcement.trackId, "track.announcements");
  return user;
}

export const create = mutation({
  args: {
    title: v.string(),
    body: v.string(),
    scope: scopeValidator,
    cohortId: v.optional(v.id("cohorts")),
  },
  returns: v.id("announcements"),
  handler: async (ctx, args) => {
    const title = requireText(args.title, ANNOUNCEMENT_LIMITS.title, "Title");
    const body = requireText(args.body, ANNOUNCEMENT_LIMITS.body, "Message");

    const notification = {
      type: "announcement" as const,
      title,
      body: plainPreview(body),
      link: "/home",
    };

    if (args.scope === "global") {
      const user = await requirePlatformPermission(ctx, "announcements.global");
      const id = await ctx.db.insert("announcements", { title, body, scope: "global", createdBy: user._id });
      await ctx.scheduler.runAfter(0, internal.notifications.fanOutGlobal, { ...notification, excludeUserId: user._id });
      return id;
    }

    if (!args.cohortId) {
      throw new ConvexError("Pick a cohort");
    }
    const cohort = await ctx.db.get("cohorts", args.cohortId);
    if (cohort === null) {
      throw new ConvexError("Cohort not found");
    }
    const { user } = await requireTrackPermission(ctx, cohort.trackId, "track.announcements");
    if (cohort.status === "archived") {
      throw new ConvexError("This cohort is archived");
    }
    const id = await ctx.db.insert("announcements", {
      title,
      body,
      scope: "cohort",
      cohortId: cohort._id,
      trackId: cohort.trackId,
      createdBy: user._id,
    });
    await ctx.scheduler.runAfter(0, internal.notifications.fanOutToCohort, {
      ...notification,
      cohortId: cohort._id,
      excludeUserId: user._id,
    });
    return id;
  },
});

export const remove = mutation({
  args: { announcementId: v.id("announcements") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const announcement = await ctx.db.get("announcements", args.announcementId);
    if (announcement === null) {
      throw new ConvexError("Announcement not found");
    }
    await requireCanManage(ctx, announcement);
    await ctx.db.delete("announcements", announcement._id);
    return null;
  },
});

export const listForAdmin = query({
  args: {},
  returns: v.object({
    canPostGlobal: v.boolean(),
    cohorts: v.array(v.object({ _id: v.id("cohorts"), name: v.string(), trackName: v.string(), ended: v.boolean() })),
    announcements: v.array(
      v.object({
        _id: v.id("announcements"),
        title: v.string(),
        body: v.string(),
        scope: scopeValidator,
        audience: v.string(),
        createdAt: v.number(),
        authorName: v.union(v.string(), v.null()),
        canDelete: v.boolean(),
      }),
    ),
  }),
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const canPostGlobal = hasPlatformPermission(user, "announcements.global");

    const cohorts: { _id: Id<"cohorts">; name: string; trackName: string; ended: boolean }[] = [];
    const tracks = await ctx.db.query("tracks").take(MAX_TRACKS);
    for (const track of tracks) {
      if (track.status !== "active") continue;
      const access = await getTrackAccess(ctx, user, track._id);
      if (!access.permissions.includes("track.announcements")) continue;
      const trackCohorts = await ctx.db
        .query("cohorts")
        .withIndex("by_trackId", (q) => q.eq("trackId", track._id))
        .take(MAX_COHORTS_PER_TRACK);
      for (const cohort of trackCohorts) {
        if (cohort.status === "archived") continue;
        cohorts.push({ _id: cohort._id, name: cohort.name, trackName: track.name, ended: isEndedCohort(cohort) });
      }
    }

    const docs: { doc: Doc<"announcements">; audience: string; canDelete: boolean }[] = [];
    if (canPostGlobal || cohorts.length > 0) {
      const global = await ctx.db
        .query("announcements")
        .withIndex("by_scope", (q) => q.eq("scope", "global"))
        .order("desc")
        .take(MAX_ADMIN_ITEMS);
      docs.push(...global.map((doc) => ({ doc, audience: "Everyone", canDelete: canPostGlobal })));
    }
    for (const cohort of cohorts) {
      const items = await ctx.db
        .query("announcements")
        .withIndex("by_cohortId", (q) => q.eq("cohortId", cohort._id))
        .order("desc")
        .take(MAX_ADMIN_ITEMS);
      docs.push(...items.map((doc) => ({ doc, audience: `${cohort.trackName} · ${cohort.name}`, canDelete: true })));
    }
    docs.sort((a, b) => b.doc._creationTime - a.doc._creationTime);

    const announcements = await Promise.all(
      docs.slice(0, MAX_ADMIN_ITEMS).map(async ({ doc, audience, canDelete }) => ({
        _id: doc._id,
        title: doc.title,
        body: doc.body,
        scope: doc.scope,
        audience,
        createdAt: doc._creationTime,
        authorName: await authorName(ctx, doc.createdBy),
        canDelete,
      })),
    );
    return { canPostGlobal, cohorts, announcements };
  },
});

/** Global announcements plus the learner's cohort, newest first. */
export const feed = query({
  args: { trackId: v.id("tracks"), limit: v.optional(v.number()) },
  returns: v.array(feedItemValidator),
  handler: async (ctx, args) => {
    const viewer = await getTrackViewer(ctx, args.trackId);
    if (viewer === null) return [];
    const limit = Math.max(1, Math.min(MAX_FEED_ITEMS, Math.floor(args.limit ?? 5)));
    const cohortId = viewer.access.cohortId;

    const [global, cohort] = await Promise.all([
      ctx.db
        .query("announcements")
        .withIndex("by_scope", (q) => q.eq("scope", "global"))
        .order("desc")
        .take(limit),
      cohortId
        ? ctx.db
            .query("announcements")
            .withIndex("by_cohortId", (q) => q.eq("cohortId", cohortId))
            .order("desc")
            .take(limit)
        : Promise.resolve([]),
    ]);
    const merged = [...global, ...cohort].sort((a, b) => b._creationTime - a._creationTime).slice(0, limit);
    return await Promise.all(
      merged.map(async (doc) => ({
        _id: doc._id,
        title: doc.title,
        body: doc.body,
        scope: doc.scope,
        createdAt: doc._creationTime,
        authorName: await authorName(ctx, doc.createdBy),
      })),
    );
  },
});

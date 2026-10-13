import { ConvexError, v } from "convex/values";
import { paginationOptsValidator, paginationResultValidator } from "convex/server";
import { internalMutation, mutation, query, type MutationCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { notificationTypeValidator } from "./schema";
import { getCurrentUser, requireUser } from "./lib/auth";
import { notify } from "./lib/notifications";

const FAN_OUT_BATCH = 200;
const MARK_READ_BATCH = 200;
/** The badge shows "99+" above this. */
const UNREAD_CAP = 99;

const notificationValidator = v.object({
  _id: v.id("notifications"),
  type: notificationTypeValidator,
  title: v.string(),
  body: v.union(v.string(), v.null()),
  link: v.union(v.string(), v.null()),
  read: v.boolean(),
  createdAt: v.number(),
});

const fanOutArgs = {
  type: notificationTypeValidator,
  title: v.string(),
  body: v.optional(v.string()),
  link: v.optional(v.string()),
  excludeUserId: v.optional(v.id("users")),
  cursor: v.optional(v.union(v.string(), v.null())),
};

export const list = query({
  args: { paginationOpts: paginationOptsValidator },
  returns: paginationResultValidator(notificationValidator),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const page = await ctx.db
      .query("notifications")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .paginate(args.paginationOpts);
    return {
      ...page,
      page: page.page.map((n) => ({
        _id: n._id,
        type: n.type,
        title: n.title,
        body: n.body ?? null,
        link: n.link ?? null,
        read: n.read,
        createdAt: n._creationTime,
      })),
    };
  },
});

/** Unread notifications, counted up to 100 so the badge can show "99+". */
export const unreadCount = query({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (user === null) return 0;
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_userId_and_read", (q) => q.eq("userId", user._id).eq("read", false))
      .take(UNREAD_CAP + 1);
    return unread.length;
  },
});

export const markRead = mutation({
  args: { notificationId: v.id("notifications") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const notification = await ctx.db.get("notifications", args.notificationId);
    if (notification === null || notification.userId !== user._id) {
      throw new ConvexError("Notification not found");
    }
    if (!notification.read) {
      await ctx.db.patch("notifications", notification._id, { read: true });
    }
    return null;
  },
});

/** Marks one batch read and schedules the next if more remain. */
async function markBatchRead(ctx: MutationCtx, userId: Id<"users">) {
  const unread = await ctx.db
    .query("notifications")
    .withIndex("by_userId_and_read", (q) => q.eq("userId", userId).eq("read", false))
    .take(MARK_READ_BATCH);
  for (const n of unread) {
    await ctx.db.patch("notifications", n._id, { read: true });
  }
  if (unread.length === MARK_READ_BATCH) {
    await ctx.scheduler.runAfter(0, internal.notifications.markAllReadBatch, { userId });
  }
}

export const markAllRead = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    await markBatchRead(ctx, user._id);
    return null;
  },
});

export const markAllReadBatch = internalMutation({
  args: { userId: v.id("users") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await markBatchRead(ctx, args.userId);
    return null;
  },
});

/** Notifies every learner enrolled in the cohort, one batch per run. */
export const fanOutToCohort = internalMutation({
  args: { cohortId: v.id("cohorts"), ...fanOutArgs },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { cohortId, cursor, excludeUserId, ...input } = args;
    const page = await ctx.db
      .query("enrollments")
      .withIndex("by_cohortId", (q) => q.eq("cohortId", cohortId))
      .paginate({ numItems: FAN_OUT_BATCH, cursor: cursor ?? null });
    for (const enrollment of page.page) {
      if (enrollment.userId === excludeUserId) continue;
      const user = await ctx.db.get("users", enrollment.userId);
      if (user === null || user.status !== "active") continue;
      await notify(ctx, enrollment.userId, input);
    }
    if (!page.isDone) {
      await ctx.scheduler.runAfter(0, internal.notifications.fanOutToCohort, { ...args, cursor: page.continueCursor });
    }
    return null;
  },
});

/** Notifies every active user, one batch per run. */
export const fanOutGlobal = internalMutation({
  args: fanOutArgs,
  returns: v.null(),
  handler: async (ctx, args) => {
    const { cursor, excludeUserId, ...input } = args;
    const page = await ctx.db.query("users").paginate({ numItems: FAN_OUT_BATCH, cursor: cursor ?? null });
    for (const user of page.page) {
      if (user._id === excludeUserId || user.status !== "active") continue;
      await notify(ctx, user._id, input);
    }
    if (!page.isDone) {
      await ctx.scheduler.runAfter(0, internal.notifications.fanOutGlobal, { ...args, cursor: page.continueCursor });
    }
    return null;
  },
});

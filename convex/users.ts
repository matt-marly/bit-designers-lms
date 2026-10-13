import { ConvexError, v } from "convex/values";
import { paginationOptsValidator, paginationResultValidator } from "convex/server";
import { mutation, query } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import schema, { cohortStatusValidator } from "./schema";
import { AVATAR_TYPES, MAX_AVATAR_BYTES, PROFILE_LIMITS, avatarUrlFor } from "./lib/profile";
import { cleanOptionalHttpUrl, cleanText, requireText } from "./lib/urls";
import {
  getCurrentUser,
  getTrackAccess,
  hasAdminAccess,
  normalizeEmail,
  requirePlatformPermission,
  requireUser,
} from "./lib/auth";
import { applyGrants } from "./lib/grants";
import {
  platformPermissionValidator,
  platformRoleValidator,
  staffRoleValidator,
  trackPermissionValidator,
  trackRoleValidator,
} from "./lib/validators";
import { findOpenInvitation } from "./invitations";

const MAX_TRACKS = 200;

export const me = query({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      user: schema.doc("users"),
      avatarUrl: v.union(v.string(), v.null()),
      hasAdminAccess: v.boolean(),
      tracks: v.array(
        v.object({
          trackId: v.id("tracks"),
          name: v.string(),
          staffRole: v.union(staffRoleValidator, v.null()),
          isStudent: v.boolean(),
          isAlumni: v.boolean(),
          cohort: v.union(
            v.object({
              _id: v.id("cohorts"),
              name: v.string(),
              startsAt: v.number(),
              endsAt: v.union(v.number(), v.null()),
              status: cohortStatusValidator,
            }),
            v.null(),
          ),
          permissions: v.array(trackPermissionValidator),
        }),
      ),
    }),
  ),
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (user === null) {
      return null;
    }

    const tracks = [];
    const activeTracks = await ctx.db.query("tracks").take(MAX_TRACKS);
    for (const track of activeTracks) {
      if (track.status !== "active") continue;
      const access = await getTrackAccess(ctx, user, track._id);
      if (access.canView) {
        const cohort = access.cohortId ? await ctx.db.get("cohorts", access.cohortId) : null;
        tracks.push({
          trackId: track._id,
          name: track.name,
          staffRole: access.staffRole,
          isStudent: access.isStudent,
          isAlumni: access.isAlumni,
          cohort: cohort
            ? {
                _id: cohort._id,
                name: cohort.name,
                startsAt: cohort.startsAt,
                endsAt: cohort.endsAt ?? null,
                status: cohort.status,
              }
            : null,
          permissions: access.permissions,
        });
      }
    }

    return {
      user,
      avatarUrl: await avatarUrlFor(ctx, user),
      hasAdminAccess: await hasAdminAccess(ctx, user),
      tracks,
    };
  },
});

/** Only fields that are passed change. An empty bio or portfolio link clears it. */
export const updateProfile = mutation({
  args: {
    fullName: v.optional(v.string()),
    bio: v.optional(v.string()),
    portfolioUrl: v.optional(v.string()),
    showInShowcase: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const patch: Partial<Doc<"users">> = { updatedAt: Date.now() };
    if (args.fullName !== undefined) {
      patch.fullName = requireText(args.fullName, PROFILE_LIMITS.fullName, "Name");
    }
    if (args.bio !== undefined) {
      patch.bio = cleanText(args.bio, PROFILE_LIMITS.bio, "Bio");
    }
    if (args.portfolioUrl !== undefined) {
      patch.portfolioUrl = cleanOptionalHttpUrl(args.portfolioUrl, "portfolio link");
    }
    if (args.showInShowcase !== undefined) {
      patch.showInShowcase = args.showInShowcase;
    }
    await ctx.db.patch("users", user._id, patch);
    return null;
  },
});

export const generateAvatarUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    await requireUser(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Sets or clears the profile photo. Returns an error instead of throwing so a
 * rejected upload can be deleted in the same transaction.
 */
export const setAvatar = mutation({
  args: { fileId: v.union(v.id("_storage"), v.null()) },
  returns: v.union(v.object({ ok: v.literal(true) }), v.object({ ok: v.literal(false), error: v.string() })),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (args.fileId !== null) {
      const file = await ctx.db.system.get("_storage", args.fileId);
      let error: string | null = null;
      if (file === null) {
        error = "The photo didn't finish uploading. Try again.";
      } else if (file.size > MAX_AVATAR_BYTES) {
        error = "Photos must be 2 MB or smaller";
      } else if (!(AVATAR_TYPES as readonly string[]).includes(file.contentType ?? "")) {
        error = "Use a PNG, JPG or WebP image";
      }
      if (error !== null) {
        if (file !== null) await ctx.storage.delete(file._id);
        return { ok: false as const, error };
      }
    }
    if (user.avatarFileId && user.avatarFileId !== args.fileId) {
      await ctx.storage.delete(user.avatarFileId);
    }
    await ctx.db.patch("users", user._id, { avatarFileId: args.fileId ?? undefined, updatedAt: Date.now() });
    return { ok: true as const };
  },
});

export const completeOnboarding = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    if (user.onboardedAt === undefined) {
      await ctx.db.patch("users", user._id, { onboardedAt: Date.now() });
    }
    return null;
  },
});

/**
 * Called by the client after every sign-in. Links the Clerk identity to a Convex
 * user, creating one from a pending invitation on first sign-in.
 */
export const ensureCurrent = mutation({
  args: { fullName: v.optional(v.string()) },
  returns: v.union(v.literal("ok"), v.literal("no_access"), v.literal("suspended")),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new ConvexError("Not authenticated");
    }

    const fullName = args.fullName?.trim();
    const existing = await getCurrentUser(ctx);
    if (existing !== null) {
      if (fullName && fullName !== existing.fullName) {
        await ctx.db.patch("users", existing._id, { fullName, updatedAt: Date.now() });
      }
      return existing.status === "active" ? "ok" : "suspended";
    }

    if (!identity.email || identity.emailVerified === false) {
      return "no_access";
    }
    const email = normalizeEmail(identity.email);

    const sameEmailUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    if (sameEmailUser !== null) {
      // Same person with a new Clerk account (e.g. it was deleted and re-invited).
      await ctx.db.patch("users", sameEmailUser._id, {
        tokenIdentifier: identity.tokenIdentifier,
        ...(fullName ? { fullName } : {}),
        updatedAt: Date.now(),
      });
      const pending = await findOpenInvitation(ctx, email);
      if (pending !== null) {
        await applyGrants(ctx, sameEmailUser, {
          platformRole: pending.platformRole,
          permissions: pending.permissions,
          trackGrants: pending.trackGrants,
        });
        await ctx.db.patch("invitations", pending._id, {
          status: "accepted",
          acceptedBy: sameEmailUser._id,
          updatedAt: Date.now(),
        });
      }
      return sameEmailUser.status === "active" ? "ok" : "suspended";
    }

    const invitation = await findOpenInvitation(ctx, email);
    if (invitation === null) {
      return "no_access";
    }

    const userId = await ctx.db.insert("users", {
      tokenIdentifier: identity.tokenIdentifier,
      email,
      fullName: fullName || identity.name || email.split("@")[0],
      platformRole: "member",
      permissions: [],
      status: "active",
    });
    const user = await ctx.db.get("users", userId);
    if (user === null) {
      throw new ConvexError("Failed to create user");
    }
    await applyGrants(ctx, user, {
      platformRole: invitation.platformRole,
      permissions: invitation.permissions,
      trackGrants: invitation.trackGrants,
    });
    await ctx.db.patch("invitations", invitation._id, {
      status: "accepted",
      acceptedBy: userId,
      updatedAt: Date.now(),
    });
    return "ok";
  },
});

const MAX_TRACK_ROLES_PER_USER = 50;

export const listForManagement = query({
  args: { paginationOpts: paginationOptsValidator },
  returns: paginationResultValidator(
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      fullName: v.string(),
      email: v.string(),
      platformRole: platformRoleValidator,
      permissions: v.array(platformPermissionValidator),
      status: v.union(v.literal("active"), v.literal("suspended")),
      isSelf: v.boolean(),
      canEdit: v.boolean(),
      trackRoles: v.array(
        v.object({
          trackId: v.id("tracks"),
          trackName: v.string(),
          role: trackRoleValidator,
          cohortName: v.union(v.string(), v.null()),
        }),
      ),
    }),
  ),
  handler: async (ctx, args) => {
    const actor = await requirePlatformPermission(ctx, "users.manage");
    const actorIsSuper = actor.platformRole === "super_admin";
    const results = await ctx.db.query("users").order("desc").paginate(args.paginationOpts);

    const page = await Promise.all(
      results.page.map(async (user) => {
        const trackRoles = [];
        const memberships = await ctx.db
          .query("trackMembers")
          .withIndex("by_userId", (q) => q.eq("userId", user._id))
          .take(MAX_TRACK_ROLES_PER_USER);
        for (const membership of memberships) {
          const track = await ctx.db.get("tracks", membership.trackId);
          trackRoles.push({
            trackId: membership.trackId,
            trackName: track?.name ?? "Deleted track",
            role: membership.role,
            cohortName: null,
          });
        }
        const enrollments = await ctx.db
          .query("enrollments")
          .withIndex("by_userId_and_cohortId", (q) => q.eq("userId", user._id))
          .take(MAX_TRACK_ROLES_PER_USER);
        for (const enrollment of enrollments) {
          const [track, cohort] = await Promise.all([
            ctx.db.get("tracks", enrollment.trackId),
            ctx.db.get("cohorts", enrollment.cohortId),
          ]);
          trackRoles.push({
            trackId: enrollment.trackId,
            trackName: track?.name ?? "Deleted track",
            role: "student" as const,
            cohortName: cohort?.name ?? null,
          });
        }

        const isSelf = user._id === actor._id;
        return {
          _id: user._id,
          _creationTime: user._creationTime,
          fullName: user.fullName,
          email: user.email,
          platformRole: user.platformRole,
          permissions: user.permissions,
          status: user.status,
          isSelf,
          canEdit: !isSelf && (actorIsSuper || user.platformRole !== "super_admin"),
          trackRoles,
        };
      }),
    );
    return { ...results, page };
  },
});

export const updatePermissions = mutation({
  args: {
    userId: v.id("users"),
    platformRole: platformRoleValidator,
    permissions: v.array(platformPermissionValidator),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const actor = await requirePlatformPermission(ctx, "users.manage");
    if (actor._id === args.userId) {
      throw new ConvexError("You can't change your own permissions");
    }
    const target = await ctx.db.get("users", args.userId);
    if (target === null) {
      throw new ConvexError("User not found");
    }

    const actorIsSuper = actor.platformRole === "super_admin";
    if (!actorIsSuper && (target.platformRole === "super_admin" || args.platformRole === "super_admin")) {
      throw new ConvexError("Only a super admin can change super admins");
    }
    if (!actorIsSuper) {
      const added = args.permissions.filter((p) => !target.permissions.includes(p));
      const removed = target.permissions.filter((p) => !args.permissions.includes(p));
      for (const permission of [...added, ...removed]) {
        if (!actor.permissions.includes(permission)) {
          throw new ConvexError(`You can't change a permission you don't have: ${permission}`);
        }
      }
    }

    await ctx.db.patch("users", target._id, {
      platformRole: args.platformRole,
      permissions: [...new Set(args.permissions)],
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const setStatus = mutation({
  args: {
    userId: v.id("users"),
    status: v.union(v.literal("active"), v.literal("suspended")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const actor = await requirePlatformPermission(ctx, "users.manage");
    if (actor._id === args.userId) {
      throw new ConvexError("You can't suspend yourself");
    }
    const target = await ctx.db.get("users", args.userId);
    if (target === null) {
      throw new ConvexError("User not found");
    }
    if (target.platformRole === "super_admin" && actor.platformRole !== "super_admin") {
      throw new ConvexError("Only a super admin can suspend a super admin");
    }
    await ctx.db.patch("users", target._id, { status: args.status, updatedAt: Date.now() });
    return null;
  },
});

import { ConvexError, Infer } from "convex/values";
import { Doc, Id } from "../_generated/dataModel";
import { MutationCtx, QueryCtx } from "../_generated/server";
import { getTrackAccess, getTrackMembership, hasPlatformPermission } from "./auth";
import {
  PLATFORM_PERMISSIONS,
  PlatformPermission,
  PlatformRole,
  TRACK_PERMISSIONS,
  TrackPermission,
} from "./permissions";
import { trackGrantValidator } from "./validators";

export type TrackGrant = Infer<typeof trackGrantValidator>;

export type Grants = {
  platformRole: PlatformRole;
  permissions: PlatformPermission[];
  trackGrants: TrackGrant[];
};

const ROLE_RANK: Record<PlatformRole, number> = {
  member: 0,
  platform_mentor: 1,
  admin: 2,
  super_admin: 3,
};

function isSuperAdmin(user: Doc<"users">) {
  return user.platformRole === "super_admin";
}

/**
 * Throws unless `grantor` may hand out every permission in `grants`.
 * People can never grant more than they hold themselves.
 */
export async function assertCanGrant(
  ctx: QueryCtx,
  grantor: Doc<"users">,
  grants: Grants,
): Promise<void> {
  const { platformRole, permissions, trackGrants } = grants;

  if (platformRole === "member" && permissions.length === 0 && trackGrants.length === 0) {
    throw new ConvexError("Give this person at least one permission or track role");
  }

  const grantsPlatformAccess = platformRole !== "member" || permissions.length > 0;
  if (grantsPlatformAccess && !hasPlatformPermission(grantor, "invites.manage")) {
    throw new ConvexError("You can only invite people into your own tracks");
  }
  if (platformRole === "super_admin" && !isSuperAdmin(grantor)) {
    throw new ConvexError("Only a super admin can create another super admin");
  }
  for (const permission of permissions) {
    if (!isSuperAdmin(grantor) && !hasPlatformPermission(grantor, permission)) {
      throw new ConvexError(`You can't grant a permission you don't have: ${permission}`);
    }
  }

  const seenTracks = new Set<Id<"tracks">>();
  for (const grant of trackGrants) {
    if (seenTracks.has(grant.trackId)) {
      throw new ConvexError("Each track can only appear once per invitation");
    }
    seenTracks.add(grant.trackId);

    const track = await ctx.db.get("tracks", grant.trackId);
    if (track === null || track.status !== "active") {
      throw new ConvexError("One of the selected tracks no longer exists");
    }

    const canManageTracks = hasPlatformPermission(grantor, "tracks.manage");
    const access = await getTrackAccess(ctx, grantor, grant.trackId);

    if (grant.role === "lead_mentor") {
      if (!canManageTracks) {
        throw new ConvexError(`Only people who manage tracks can assign a lead mentor for ${track.name}`);
      }
    } else if (grant.role === "co_mentor") {
      if (!canManageTracks && access.staffRole !== "lead_mentor") {
        throw new ConvexError(`Only the lead mentor can add co-mentors to ${track.name}`);
      }
      for (const permission of grant.permissions) {
        if (!canManageTracks && !access.permissions.includes(permission)) {
          throw new ConvexError(`You can't grant ${permission} on ${track.name}`);
        }
      }
    } else {
      if (!access.permissions.includes("track.students.invite")) {
        throw new ConvexError(`You can't invite students to ${track.name}`);
      }
      if (grant.cohortId === undefined) {
        throw new ConvexError(`Pick a cohort for the student in ${track.name}`);
      }
      const cohort = await ctx.db.get("cohorts", grant.cohortId);
      if (cohort === null || cohort.trackId !== grant.trackId) {
        throw new ConvexError(`That cohort doesn't belong to ${track.name}`);
      }
    }
  }
}

export async function setLeadMentor(
  ctx: MutationCtx,
  trackId: Id<"tracks">,
  userId: Id<"users">,
): Promise<void> {
  const currentLead = await ctx.db
    .query("trackMembers")
    .withIndex("by_trackId_and_role", (q) => q.eq("trackId", trackId).eq("role", "lead_mentor"))
    .unique();
  if (currentLead !== null && currentLead.userId !== userId) {
    await ctx.db.patch("trackMembers", currentLead._id, {
      role: "co_mentor",
      permissions: [...TRACK_PERMISSIONS],
    });
  }

  const membership = await getTrackMembership(ctx, userId, trackId);
  if (membership === null) {
    await ctx.db.insert("trackMembers", {
      trackId,
      userId,
      role: "lead_mentor",
      permissions: [...TRACK_PERMISSIONS],
    });
  } else if (membership.role !== "lead_mentor") {
    await ctx.db.patch("trackMembers", membership._id, {
      role: "lead_mentor",
      permissions: [...TRACK_PERMISSIONS],
    });
  }
}

export async function setCoMentor(
  ctx: MutationCtx,
  trackId: Id<"tracks">,
  userId: Id<"users">,
  permissions: TrackPermission[],
): Promise<void> {
  const membership = await getTrackMembership(ctx, userId, trackId);
  if (membership === null) {
    await ctx.db.insert("trackMembers", { trackId, userId, role: "co_mentor", permissions });
  } else if (membership.role === "co_mentor") {
    await ctx.db.patch("trackMembers", membership._id, { permissions });
  }
}

export async function enrollStudent(
  ctx: MutationCtx,
  userId: Id<"users">,
  trackId: Id<"tracks">,
  cohortId: Id<"cohorts">,
): Promise<void> {
  const existing = await ctx.db
    .query("enrollments")
    .withIndex("by_userId_and_cohortId", (q) => q.eq("userId", userId).eq("cohortId", cohortId))
    .unique();
  if (existing === null) {
    await ctx.db.insert("enrollments", { userId, cohortId, trackId, status: "active" });
  }
}

/** Applies invitation grants to a user, merging with anything they already have. */
export async function applyGrants(
  ctx: MutationCtx,
  user: Doc<"users">,
  grants: Grants,
): Promise<void> {
  const mergedPermissions = [
    ...new Set<PlatformPermission>([...user.permissions, ...grants.permissions]),
  ].sort((a, b) => PLATFORM_PERMISSIONS.indexOf(a) - PLATFORM_PERMISSIONS.indexOf(b));
  const platformRole =
    ROLE_RANK[grants.platformRole] > ROLE_RANK[user.platformRole]
      ? grants.platformRole
      : user.platformRole;

  await ctx.db.patch("users", user._id, {
    platformRole,
    permissions: mergedPermissions,
    updatedAt: Date.now(),
  });

  for (const grant of grants.trackGrants) {
    if (grant.role === "lead_mentor") {
      await setLeadMentor(ctx, grant.trackId, user._id);
    } else if (grant.role === "co_mentor") {
      await setCoMentor(ctx, grant.trackId, user._id, grant.permissions);
    } else if (grant.cohortId !== undefined) {
      await enrollStudent(ctx, user._id, grant.trackId, grant.cohortId);
    }
  }
}

import { ConvexError } from "convex/values";
import { Doc, Id } from "../_generated/dataModel";
import { QueryCtx } from "../_generated/server";
import {
  PLATFORM_TO_TRACK_PERMISSIONS,
  PlatformPermission,
  TRACK_PERMISSIONS,
  TrackPermission,
} from "./permissions";

export type TrackAccess = {
  staffRole: "lead_mentor" | "co_mentor" | null;
  permissions: TrackPermission[];
  /** Enrolled in a cohort that hasn't ended. */
  isStudent: boolean;
  /** Enrolled in a cohort that has ended: read access only. */
  isAlumni: boolean;
  cohortId: Id<"cohorts"> | null;
  canView: boolean;
};

/** Learners of a completed or archived cohort become alumni. */
export function isEndedCohort(cohort: Doc<"cohorts">): boolean {
  return cohort.status === "completed" || cohort.status === "archived";
}

export async function getCurrentUser(ctx: QueryCtx): Promise<Doc<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (identity === null) {
    return null;
  }
  return await ctx.db
    .query("users")
    .withIndex("by_tokenIdentifier", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();
}

export async function requireUser(ctx: QueryCtx): Promise<Doc<"users">> {
  const user = await getCurrentUser(ctx);
  if (user === null) {
    throw new ConvexError("Not authenticated");
  }
  if (user.status !== "active") {
    throw new ConvexError("Your account is suspended");
  }
  return user;
}

export function hasPlatformPermission(
  user: Doc<"users">,
  permission: PlatformPermission,
): boolean {
  return user.permissions.includes(permission);
}

export async function requirePlatformPermission(
  ctx: QueryCtx,
  permission: PlatformPermission,
): Promise<Doc<"users">> {
  const user = await requireUser(ctx);
  if (!hasPlatformPermission(user, permission)) {
    throw new ConvexError("Not authorized");
  }
  return user;
}

export async function getTrackMembership(
  ctx: QueryCtx,
  userId: Id<"users">,
  trackId: Id<"tracks">,
): Promise<Doc<"trackMembers"> | null> {
  return await ctx.db
    .query("trackMembers")
    .withIndex("by_trackId_and_userId", (q) =>
      q.eq("trackId", trackId).eq("userId", userId),
    )
    .unique();
}

export async function getTrackAccess(
  ctx: QueryCtx,
  user: Doc<"users">,
  trackId: Id<"tracks">,
): Promise<TrackAccess> {
  const permissions = new Set<TrackPermission>();
  for (const platformPermission of user.permissions) {
    for (const trackPermission of PLATFORM_TO_TRACK_PERMISSIONS[platformPermission]) {
      permissions.add(trackPermission);
    }
  }

  const membership = await getTrackMembership(ctx, user._id, trackId);
  if (membership?.role === "lead_mentor") {
    TRACK_PERMISSIONS.forEach((p) => permissions.add(p));
  } else if (membership?.role === "co_mentor") {
    membership.permissions.forEach((p) => permissions.add(p));
  }

  const enrollment = await ctx.db
    .query("enrollments")
    .withIndex("by_userId_and_trackId", (q) =>
      q.eq("userId", user._id).eq("trackId", trackId),
    )
    .first();
  const cohort = enrollment ? await ctx.db.get("cohorts", enrollment.cohortId) : null;
  const isAlumni = cohort !== null && isEndedCohort(cohort);

  return {
    staffRole: membership?.role ?? null,
    permissions: [...permissions],
    isStudent: enrollment !== null && !isAlumni,
    isAlumni,
    cohortId: enrollment?.cohortId ?? null,
    canView: permissions.size > 0 || membership !== null || enrollment !== null,
  };
}

export async function requireTrackPermission(
  ctx: QueryCtx,
  trackId: Id<"tracks">,
  permission: TrackPermission,
): Promise<{ user: Doc<"users">; access: TrackAccess }> {
  const user = await requireUser(ctx);
  const access = await getTrackAccess(ctx, user, trackId);
  if (!access.permissions.includes(permission)) {
    throw new ConvexError("Not authorized for this track");
  }
  return { user, access };
}

export async function hasAdminAccess(ctx: QueryCtx, user: Doc<"users">): Promise<boolean> {
  if (user.permissions.length > 0) {
    return true;
  }
  const membership = await ctx.db
    .query("trackMembers")
    .withIndex("by_userId", (q) => q.eq("userId", user._id))
    .first();
  return membership !== null;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

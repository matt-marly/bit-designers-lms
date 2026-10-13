import type { FunctionReturnType } from "convex/server";
import type { api } from "@/convex/_generated/api";
import {
  PLATFORM_ROLE_PRESETS,
  type PlatformPermission,
  type TrackPermission,
} from "@/convex/lib/permissions";

export type Me = NonNullable<FunctionReturnType<typeof api.users.me>>;

export function hasPlatformPermission(me: Me, permission: PlatformPermission) {
  return me.user.status === "active" && me.user.permissions.includes(permission);
}

/** True if the user holds the permission on at least one track. */
export function hasAnyTrackPermission(me: Me, permission: TrackPermission) {
  return me.tracks.some((track) => track.permissions.includes(permission));
}

export function isLeadMentorAnywhere(me: Me) {
  return me.tracks.some((track) => track.staffRole === "lead_mentor");
}

export function roleLabel(me: Me) {
  if (me.user.platformRole !== "member") {
    return PLATFORM_ROLE_PRESETS[me.user.platformRole].label;
  }
  if (me.tracks.some((track) => track.staffRole === "lead_mentor")) return "Lead mentor";
  if (me.tracks.some((track) => track.staffRole === "co_mentor")) return "Co-mentor";
  if (me.tracks.some((track) => track.isStudent)) return "Learner";
  if (me.tracks.some((track) => track.isAlumni)) return "Alumni";
  return "Member";
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

/** Mirrors the backend rules for who may send any kind of invitation. */
export function canInvite(me: Me) {
  return (
    hasPlatformPermission(me, "invites.manage") ||
    hasPlatformPermission(me, "tracks.manage") ||
    hasAnyTrackPermission(me, "track.students.invite") ||
    isLeadMentorAnywhere(me)
  );
}

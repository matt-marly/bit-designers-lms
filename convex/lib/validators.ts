import { v } from "convex/values";
import {
  PLATFORM_PERMISSIONS,
  PLATFORM_ROLES,
  TRACK_PERMISSIONS,
  TRACK_ROLES,
} from "./permissions";

export const platformPermissionValidator = v.union(
  ...PLATFORM_PERMISSIONS.map((p) => v.literal(p)),
);
export const trackPermissionValidator = v.union(
  ...TRACK_PERMISSIONS.map((p) => v.literal(p)),
);
export const platformRoleValidator = v.union(
  ...PLATFORM_ROLES.map((r) => v.literal(r)),
);
export const trackRoleValidator = v.union(...TRACK_ROLES.map((r) => v.literal(r)));
export const staffRoleValidator = v.union(
  v.literal("lead_mentor"),
  v.literal("co_mentor"),
);

export const trackGrantValidator = v.object({
  trackId: v.id("tracks"),
  role: trackRoleValidator,
  cohortId: v.optional(v.id("cohorts")),
  permissions: v.array(trackPermissionValidator),
});

export const missionStatusValidator = v.union(
  v.literal("not_started"),
  v.literal("submitted"),
  v.literal("in_review"),
  v.literal("passed"),
  v.literal("needs_revision"),
);

export const invitationStatusValidator = v.union(
  v.literal("pending"),
  v.literal("sending"),
  v.literal("sent"),
  v.literal("accepted"),
  v.literal("revoked"),
  v.literal("failed"),
);

export const roadmapStatusValidator = v.union(v.literal("draft"), v.literal("published"));

export const roadmapNodeKindValidator = v.union(
  v.literal("module"),
  v.literal("lesson"),
  v.literal("mission"),
  v.literal("resource"),
  v.literal("workshop"),
  v.literal("custom"),
);

export const roadmapBadgeValidator = v.union(
  v.literal("required"),
  v.literal("optional"),
  v.literal("alternative"),
);

export const roadmapNodeStateValidator = v.union(
  v.literal("learning"),
  v.literal("done"),
  v.literal("skipped"),
);

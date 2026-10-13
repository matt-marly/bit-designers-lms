export const PLATFORM_PERMISSIONS = [
  "invites.manage",
  "users.manage",
  "tracks.manage",
  "content.manage",
  "reviews.manage",
  "workshops.manage",
  "announcements.global",
  "resources.manage",
] as const;
export type PlatformPermission = (typeof PLATFORM_PERMISSIONS)[number];

export const PLATFORM_PERMISSION_INFO: Record<
  PlatformPermission,
  { label: string; description: string }
> = {
  "invites.manage": {
    label: "Invite people",
    description: "Send and revoke invitations to the platform",
  },
  "users.manage": {
    label: "Manage users",
    description: "Change people's platform permissions and suspend accounts",
  },
  "tracks.manage": {
    label: "Manage tracks",
    description: "Create tracks and cohorts, and assign lead mentors",
  },
  "content.manage": {
    label: "Edit all curriculum",
    description: "Edit units, modules and lessons in every track",
  },
  "reviews.manage": {
    label: "Review all submissions",
    description: "Review mission submissions in every track",
  },
  "workshops.manage": {
    label: "Manage all workshops",
    description: "Schedule and edit live sessions in every track",
  },
  "announcements.global": {
    label: "Global announcements",
    description: "Post announcements to everyone on the platform",
  },
  "resources.manage": {
    label: "Manage resources",
    description: "Add and edit the shared resource library",
  },
};

export const TRACK_PERMISSIONS = [
  "track.content",
  "track.reviews",
  "track.workshops",
  "track.announcements",
  "track.students.invite",
  "track.cohorts",
] as const;
export type TrackPermission = (typeof TRACK_PERMISSIONS)[number];

export const TRACK_PERMISSION_INFO: Record<
  TrackPermission,
  { label: string; description: string }
> = {
  "track.content": {
    label: "Edit curriculum",
    description: "Edit this track's units, modules and lessons",
  },
  "track.reviews": {
    label: "Review submissions",
    description: "Review mission submissions in this track",
  },
  "track.workshops": {
    label: "Manage workshops",
    description: "Schedule and edit this track's live sessions",
  },
  "track.announcements": {
    label: "Post announcements",
    description: "Post announcements to this track's cohorts",
  },
  "track.students.invite": {
    label: "Invite students",
    description: "Invite students into this track's cohorts",
  },
  "track.cohorts": {
    label: "Manage cohorts",
    description: "Create cohorts and set their dates",
  },
};

export const PLATFORM_ROLES = [
  "super_admin",
  "admin",
  "platform_mentor",
  "member",
] as const;
export type PlatformRole = (typeof PLATFORM_ROLES)[number];

export const PLATFORM_ROLE_PRESETS: Record<
  PlatformRole,
  { label: string; description: string; permissions: readonly PlatformPermission[] }
> = {
  super_admin: {
    label: "Super admin",
    description: "Full control of the platform, including other admins",
    permissions: PLATFORM_PERMISSIONS,
  },
  admin: {
    label: "Admin",
    description: "Runs the platform day to day",
    permissions: PLATFORM_PERMISSIONS.filter((p) => p !== "users.manage"),
  },
  platform_mentor: {
    label: "Platform mentor",
    description: "Works across every track's curriculum without owning any",
    permissions: ["content.manage", "reviews.manage", "workshops.manage"],
  },
  member: {
    label: "Member",
    description: "No platform permissions; access comes from track roles",
    permissions: [],
  },
};

export const TRACK_ROLES = ["lead_mentor", "co_mentor", "student"] as const;
export type TrackRole = (typeof TRACK_ROLES)[number];

export const TRACK_ROLE_INFO: Record<TrackRole, { label: string; description: string }> = {
  lead_mentor: {
    label: "Lead mentor",
    description: "Owns the track, with every track permission",
  },
  co_mentor: {
    label: "Co-mentor",
    description: "Helps run the track with the permissions you choose",
  },
  student: {
    label: "Student",
    description: "Learns in one of the track's cohorts",
  },
};

export const CO_MENTOR_DEFAULT_PERMISSIONS: readonly TrackPermission[] = [
  "track.reviews",
  "track.workshops",
];

/** Platform permissions that also grant a track permission on every track. */
export const PLATFORM_TO_TRACK_PERMISSIONS: Record<PlatformPermission, readonly TrackPermission[]> = {
  "invites.manage": ["track.students.invite"],
  "users.manage": [],
  "tracks.manage": ["track.cohorts"],
  "content.manage": ["track.content"],
  "reviews.manage": ["track.reviews"],
  "workshops.manage": ["track.workshops"],
  "announcements.global": ["track.announcements"],
  "resources.manage": [],
};

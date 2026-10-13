import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import {
  invitationStatusValidator,
  platformPermissionValidator,
  platformRoleValidator,
  roadmapBadgeValidator,
  roadmapNodeKindValidator,
  roadmapNodeStateValidator,
  roadmapStatusValidator,
  staffRoleValidator,
  trackGrantValidator,
  trackPermissionValidator,
} from "./lib/validators";

export const cohortStatusValidator = v.union(
  v.literal("draft"),
  v.literal("active"),
  v.literal("completed"),
  v.literal("archived"),
);

export const moduleStatusValidator = v.union(v.literal("draft"), v.literal("published"));

export const missionReviewTypeValidator = v.union(v.literal("completion_only"), v.literal("reviewed"));

export const submissionStatusValidator = v.union(
  v.literal("submitted"),
  v.literal("in_review"),
  v.literal("passed"),
  v.literal("needs_revision"),
);

export const reviewOutcomeValidator = v.union(v.literal("passed"), v.literal("needs_revision"));

export const resourceKindValidator = v.union(v.literal("material"), v.literal("reference"));

export const notificationTypeValidator = v.union(
  v.literal("review"),
  v.literal("workshop"),
  v.literal("announcement"),
  v.literal("certificate"),
);

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    email: v.string(),
    fullName: v.string(),
    platformRole: platformRoleValidator,
    permissions: v.array(platformPermissionValidator),
    status: v.union(v.literal("active"), v.literal("suspended")),
    bio: v.optional(v.string()),
    avatarFileId: v.optional(v.id("_storage")),
    portfolioUrl: v.optional(v.string()),
    /** Set once the person has seen the first-login profile setup, whether they filled it in or skipped. */
    onboardedAt: v.optional(v.number()),
    /** Passed mission work appears in the Community showcase unless this is false. */
    showInShowcase: v.optional(v.boolean()),
    updatedAt: v.optional(v.number()),
  })
    .index("by_tokenIdentifier", ["tokenIdentifier"])
    .index("by_email", ["email"]),

  tracks: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    status: v.union(v.literal("active"), v.literal("archived")),
  }).index("by_slug", ["slug"]),

  trackMembers: defineTable({
    trackId: v.id("tracks"),
    userId: v.id("users"),
    role: staffRoleValidator,
    permissions: v.array(trackPermissionValidator),
  })
    .index("by_trackId_and_role", ["trackId", "role"])
    .index("by_trackId_and_userId", ["trackId", "userId"])
    .index("by_userId", ["userId"]),

  cohorts: defineTable({
    trackId: v.id("tracks"),
    name: v.string(),
    startsAt: v.number(),
    endsAt: v.optional(v.number()),
    status: cohortStatusValidator,
  }).index("by_trackId", ["trackId"]),

  enrollments: defineTable({
    userId: v.id("users"),
    cohortId: v.id("cohorts"),
    trackId: v.id("tracks"),
    status: v.union(v.literal("active"), v.literal("completed")),
  })
    .index("by_userId_and_cohortId", ["userId", "cohortId"])
    .index("by_userId_and_trackId", ["userId", "trackId"])
    .index("by_cohortId", ["cohortId"]),

  invitations: defineTable({
    email: v.string(),
    invitedBy: v.optional(v.id("users")),
    status: invitationStatusValidator,
    platformRole: platformRoleValidator,
    permissions: v.array(platformPermissionValidator),
    trackGrants: v.array(trackGrantValidator),
    clerkInvitationId: v.optional(v.string()),
    error: v.optional(v.string()),
    acceptedBy: v.optional(v.id("users")),
    updatedAt: v.optional(v.number()),
  })
    .index("by_email_and_status", ["email", "status"])
    .index("by_invitedBy", ["invitedBy"]),

  /** Curriculum: track → units → modules → lessons. Learners only see published modules. */
  units: defineTable({
    trackId: v.id("tracks"),
    title: v.string(),
    description: v.optional(v.string()),
    sortOrder: v.number(),
  }).index("by_trackId_and_sortOrder", ["trackId", "sortOrder"]),

  modules: defineTable({
    trackId: v.id("tracks"),
    unitId: v.id("units"),
    title: v.string(),
    description: v.optional(v.string()),
    /** Globally unique so learner URLs can be `/learn/[moduleSlug]`. */
    slug: v.string(),
    sortOrder: v.number(),
    status: moduleStatusValidator,
    objectives: v.array(v.string()),
    /** Kept in sync by the lesson mutations so progress can be shown without reading lessons. */
    lessonCount: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_unitId_and_sortOrder", ["unitId", "sortOrder"])
    .index("by_trackId", ["trackId"]),

  lessons: defineTable({
    moduleId: v.id("modules"),
    trackId: v.id("tracks"),
    title: v.string(),
    slug: v.string(),
    /** Markdown. */
    body: v.string(),
    videoUrl: v.optional(v.string()),
    transcript: v.optional(v.string()),
    summary: v.optional(v.string()),
    sortOrder: v.number(),
  })
    .index("by_moduleId_and_slug", ["moduleId", "slug"])
    .index("by_moduleId_and_sortOrder", ["moduleId", "sortOrder"]),

  lessonCompletions: defineTable({
    userId: v.id("users"),
    lessonId: v.id("lessons"),
    moduleId: v.id("modules"),
    trackId: v.id("tracks"),
  })
    .index("by_userId_and_lessonId", ["userId", "lessonId"])
    .index("by_userId_and_moduleId", ["userId", "moduleId"])
    .index("by_userId_and_trackId", ["userId", "trackId"])
    .index("by_lessonId", ["lessonId"]),

  /** Practical work attached to a module. Learners see missions of published modules only. */
  missions: defineTable({
    trackId: v.id("tracks"),
    moduleId: v.id("modules"),
    title: v.string(),
    /** Globally unique so learner URLs can be `/missions/[slug]`. */
    slug: v.string(),
    /** Markdown. */
    brief: v.string(),
    rubric: v.array(v.string()),
    reviewType: missionReviewTypeValidator,
    sortOrder: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_moduleId_and_sortOrder", ["moduleId", "sortOrder"])
    .index("by_trackId", ["trackId"]),

  missionDeadlines: defineTable({
    missionId: v.id("missions"),
    cohortId: v.id("cohorts"),
    dueAt: v.number(),
  })
    .index("by_missionId_and_cohortId", ["missionId", "cohortId"])
    .index("by_cohortId", ["cohortId"]),

  moduleCompletions: defineTable({
    userId: v.id("users"),
    moduleId: v.id("modules"),
    trackId: v.id("tracks"),
  })
    .index("by_userId_and_moduleId", ["userId", "moduleId"])
    .index("by_userId_and_trackId", ["userId", "trackId"])
    .index("by_moduleId", ["moduleId"]),

  /**
   * One row per attempt. `version` counts up from 1 per learner and mission.
   * Completion-only work is stored as `passed` straight away, so `submitted`
   * and `in_review` only ever hold work waiting on a reviewer.
   */
  submissions: defineTable({
    userId: v.id("users"),
    missionId: v.id("missions"),
    trackId: v.id("tracks"),
    cohortId: v.id("cohorts"),
    linkUrl: v.string(),
    fileId: v.optional(v.id("_storage")),
    fileName: v.optional(v.string()),
    note: v.optional(v.string()),
    status: submissionStatusValidator,
    isLate: v.boolean(),
    version: v.number(),
    /** Set when someone starts reviewing. */
    reviewerId: v.optional(v.id("users")),
    reviewedAt: v.optional(v.number()),
  })
    .index("by_userId_and_missionId", ["userId", "missionId"])
    .index("by_missionId", ["missionId"])
    .index("by_trackId_and_status", ["trackId", "status"])
    .index("by_trackId_and_reviewedAt", ["trackId", "reviewedAt"])
    .index("by_cohortId_and_status", ["cohortId", "status"]),

  reviews: defineTable({
    submissionId: v.id("submissions"),
    reviewerId: v.id("users"),
    outcome: reviewOutcomeValidator,
    comment: v.string(),
    /** One entry per rubric criterion, in the mission's rubric order at review time. */
    rubricChecks: v.optional(v.array(v.boolean())),
  }).index("by_submissionId", ["submissionId"]),

  /** Live sessions for one cohort. `scheduledAt` is UTC ms; `timezone` is the creator's IANA zone, for display. */
  workshops: defineTable({
    trackId: v.id("tracks"),
    cohortId: v.id("cohorts"),
    title: v.string(),
    description: v.optional(v.string()),
    scheduledAt: v.number(),
    durationMinutes: v.number(),
    timezone: v.string(),
    meetingUrl: v.string(),
    hostName: v.optional(v.string()),
    moduleId: v.optional(v.id("modules")),
    recordingUrl: v.optional(v.string()),
    createdBy: v.optional(v.id("users")),
  })
    .index("by_cohortId_and_scheduledAt", ["cohortId", "scheduledAt"])
    .index("by_trackId_and_scheduledAt", ["trackId", "scheduledAt"]),

  /** Materials (readings, PDFs) and Reference (videos). Without `trackId` a resource is shown in every track. */
  resources: defineTable({
    kind: resourceKindValidator,
    category: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    resourceType: v.union(v.literal("link"), v.literal("file")),
    url: v.optional(v.string()),
    fileId: v.optional(v.id("_storage")),
    fileName: v.optional(v.string()),
    /** Read time or duration, e.g. "10 min". */
    meta: v.optional(v.string()),
    source: v.optional(v.string()),
    trackId: v.optional(v.id("tracks")),
    sortOrder: v.number(),
    createdBy: v.optional(v.id("users")),
  }).index("by_kind_and_sortOrder", ["kind", "sortOrder"]),

  /** Global announcements reach everyone; cohort announcements reach one cohort. */
  announcements: defineTable({
    title: v.string(),
    /** Markdown. */
    body: v.string(),
    scope: v.union(v.literal("global"), v.literal("cohort")),
    cohortId: v.optional(v.id("cohorts")),
    trackId: v.optional(v.id("tracks")),
    createdBy: v.optional(v.id("users")),
  })
    .index("by_scope", ["scope"])
    .index("by_cohortId", ["cohortId"]),

  notifications: defineTable({
    userId: v.id("users"),
    type: notificationTypeValidator,
    title: v.string(),
    body: v.optional(v.string()),
    /** In-app path to open when the notification is clicked. */
    link: v.optional(v.string()),
    read: v.boolean(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_read", ["userId", "read"]),

  /** Issued once per learner and track, when every published module is complete. `code` is the public id. */
  certificates: defineTable({
    userId: v.id("users"),
    trackId: v.id("tracks"),
    cohortId: v.id("cohorts"),
    code: v.string(),
    issuedAt: v.number(),
  })
    .index("by_code", ["code"])
    .index("by_userId_and_trackId", ["userId", "trackId"])
    .index("by_userId", ["userId"]),

  /**
   * Roadmaps: roadmap.sh-style modular paths. `trackId` null = global
   * library guide; otherwise auto-generated from that track's outline.
   * Order is lane + sortOrder (vertical spine); no stored x/y until a
   * visual editor lands.
   */
  roadmaps: defineTable({
    title: v.string(),
    /** Globally unique so learner URLs can be `/roadmaps/[slug]`. */
    slug: v.string(),
    description: v.optional(v.string()),
    trackId: v.optional(v.id("tracks")),
    status: roadmapStatusValidator,
    showInLibrary: v.boolean(),
    sortOrder: v.number(),
    createdBy: v.optional(v.id("users")),
    updatedAt: v.optional(v.number()),
  })
    .index("by_slug", ["slug"])
    .index("by_trackId", ["trackId"]),

  roadmapNodes: defineTable({
    roadmapId: v.id("roadmaps"),
    kind: roadmapNodeKindValidator,
    /** Stringified id of the linked module/lesson/mission/resource/workshop. Empty for custom nodes. */
    refId: v.optional(v.string()),
    /** Override title, or the title itself for custom nodes. */
    title: v.string(),
    description: v.optional(v.string()),
    /** Link for custom nodes. */
    url: v.optional(v.string()),
    /** Lane/group header, defaults to the unit title for generated nodes. */
    lane: v.string(),
    sortOrder: v.number(),
    badge: roadmapBadgeValidator,
  }).index("by_roadmapId_and_sortOrder", ["roadmapId", "sortOrder"]),

  /**
   * Explicit per-learner state for roadmap nodes. Overrides derived
   * progress: `done` counts as complete without touching lesson/mission
   * records, and `skipped` is excluded from completion totals.
   */
  roadmapNodeStates: defineTable({
    userId: v.id("users"),
    roadmapId: v.id("roadmaps"),
    nodeId: v.id("roadmapNodes"),
    state: roadmapNodeStateValidator,
    updatedAt: v.number(),
  })
    .index("by_userId_and_nodeId", ["userId", "nodeId"])
    .index("by_userId_and_roadmapId", ["userId", "roadmapId"]),
});

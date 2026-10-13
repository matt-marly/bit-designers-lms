import { ConvexError, v } from "convex/values";
import { paginationOptsValidator, paginationResultValidator } from "convex/server";
import { mutation, query, type QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import schema, { cohortStatusValidator } from "./schema";
import {
  getTrackAccess,
  getTrackMembership,
  hasPlatformPermission,
  requirePlatformPermission,
  requireTrackPermission,
  requireUser,
  type TrackAccess,
} from "./lib/auth";
import { setCoMentor, setLeadMentor } from "./lib/grants";
import { TRACK_PERMISSIONS, type TrackPermission } from "./lib/permissions";
import { staffRoleValidator, trackPermissionValidator } from "./lib/validators";

const MAX_TRACKS = 200;
const MAX_COHORTS_PER_TRACK = 100;
const MAX_STAFF_PER_TRACK = 50;
const STUDENT_COUNT_CAP = 200;

const trackCapabilitiesValidator = v.object({
  canEditTrack: v.boolean(),
  canAssignLead: v.boolean(),
  canManageCoMentors: v.boolean(),
  canManageCohorts: v.boolean(),
  canAddStudents: v.boolean(),
  grantablePermissions: v.array(trackPermissionValidator),
});

type TrackCapabilities = {
  canEditTrack: boolean;
  canAssignLead: boolean;
  canManageCoMentors: boolean;
  canManageCohorts: boolean;
  canAddStudents: boolean;
  grantablePermissions: TrackPermission[];
};

function capabilitiesFor(user: Doc<"users">, access: TrackAccess): TrackCapabilities {
  const canManageTracks = hasPlatformPermission(user, "tracks.manage");
  return {
    canEditTrack: canManageTracks,
    canAssignLead: canManageTracks,
    canManageCoMentors: canManageTracks || access.staffRole === "lead_mentor",
    canManageCohorts: access.permissions.includes("track.cohorts"),
    canAddStudents: access.permissions.includes("track.students.invite"),
    grantablePermissions: canManageTracks ? [...TRACK_PERMISSIONS] : access.permissions,
  };
}

/** Whether the track shows up on the admin Tracks page for this user. */
function canAdministerTrack(user: Doc<"users">, track: Doc<"tracks">, access: TrackAccess) {
  if (hasPlatformPermission(user, "tracks.manage")) return true;
  if (track.status !== "active") return false;
  return access.staffRole !== null || access.permissions.includes("track.cohorts");
}

async function requireTrackAdmin(ctx: QueryCtx, trackId: Id<"tracks">) {
  const user = await requireUser(ctx);
  const track = await ctx.db.get("tracks", trackId);
  if (track === null) {
    throw new ConvexError("Track not found");
  }
  const access = await getTrackAccess(ctx, user, trackId);
  if (!canAdministerTrack(user, track, access)) {
    throw new ConvexError("Not authorized for this track");
  }
  return { user, track, access, capabilities: capabilitiesFor(user, access) };
}

async function requireCohortManager(ctx: QueryCtx, cohortId: Id<"cohorts">) {
  const cohort = await ctx.db.get("cohorts", cohortId);
  if (cohort === null) {
    throw new ConvexError("Cohort not found");
  }
  const { user } = await requireTrackPermission(ctx, cohort.trackId, "track.cohorts");
  return { user, cohort };
}

function validateCohortDates(startsAt: number, endsAt: number | undefined) {
  if (endsAt !== undefined && endsAt < startsAt) {
    throw new ConvexError("The end date must be after the start date");
  }
}

async function assertTrackNameAvailable(
  ctx: QueryCtx,
  name: string,
  exceptTrackId?: Id<"tracks">,
) {
  const slug = slugify(name);
  if (!slug) {
    throw new ConvexError("Track name is required");
  }
  const existing = await ctx.db
    .query("tracks")
    .withIndex("by_slug", (q) => q.eq("slug", slug))
    .unique();
  if (existing !== null && existing._id !== exceptTrackId) {
    throw new ConvexError(`A track called "${existing.name}" already exists`);
  }
  return slug;
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export const listForInviting = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("tracks"),
      name: v.string(),
      canAssignLead: v.boolean(),
      canAddCoMentor: v.boolean(),
      canInviteStudents: v.boolean(),
      grantablePermissions: v.array(trackPermissionValidator),
      cohorts: v.array(
        v.object({ _id: v.id("cohorts"), name: v.string(), status: cohortStatusValidator }),
      ),
    }),
  ),
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const canManageTracks = hasPlatformPermission(user, "tracks.manage");
    const tracks = await ctx.db.query("tracks").take(MAX_TRACKS);

    const result = [];
    for (const track of tracks) {
      if (track.status !== "active") continue;
      const access = await getTrackAccess(ctx, user, track._id);
      const canAddCoMentor = canManageTracks || access.staffRole === "lead_mentor";
      const canInviteStudents = access.permissions.includes("track.students.invite");
      if (!canManageTracks && !canAddCoMentor && !canInviteStudents) continue;

      const cohorts = await ctx.db
        .query("cohorts")
        .withIndex("by_trackId", (q) => q.eq("trackId", track._id))
        .take(MAX_COHORTS_PER_TRACK);
      result.push({
        _id: track._id,
        name: track.name,
        canAssignLead: canManageTracks,
        canAddCoMentor,
        canInviteStudents,
        grantablePermissions: canManageTracks ? [...TRACK_PERMISSIONS] : access.permissions,
        cohorts: cohorts
          .filter((c) => c.status === "draft" || c.status === "active")
          .map((c) => ({ _id: c._id, name: c.name, status: c.status })),
      });
    }
    return result;
  },
});

export const listForAdmin = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("tracks"),
      name: v.string(),
      description: v.union(v.string(), v.null()),
      status: v.union(v.literal("active"), v.literal("archived")),
      leadName: v.union(v.string(), v.null()),
      coMentorCount: v.number(),
      cohortCount: v.number(),
      activeCohortCount: v.number(),
    }),
  ),
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const tracks = await ctx.db.query("tracks").take(MAX_TRACKS);

    const result = [];
    for (const track of tracks) {
      const access = await getTrackAccess(ctx, user, track._id);
      if (!canAdministerTrack(user, track, access)) continue;

      const [lead, coMentors, cohorts] = await Promise.all([
        ctx.db
          .query("trackMembers")
          .withIndex("by_trackId_and_role", (q) => q.eq("trackId", track._id).eq("role", "lead_mentor"))
          .unique(),
        ctx.db
          .query("trackMembers")
          .withIndex("by_trackId_and_role", (q) => q.eq("trackId", track._id).eq("role", "co_mentor"))
          .take(MAX_STAFF_PER_TRACK),
        ctx.db
          .query("cohorts")
          .withIndex("by_trackId", (q) => q.eq("trackId", track._id))
          .take(MAX_COHORTS_PER_TRACK),
      ]);
      const leadUser = lead ? await ctx.db.get("users", lead.userId) : null;

      result.push({
        _id: track._id,
        name: track.name,
        description: track.description ?? null,
        status: track.status,
        leadName: leadUser?.fullName ?? null,
        coMentorCount: coMentors.length,
        cohortCount: cohorts.length,
        activeCohortCount: cohorts.filter((c) => c.status === "active").length,
      });
    }
    result.sort((a, b) =>
      a.status === b.status ? a.name.localeCompare(b.name) : a.status === "active" ? -1 : 1,
    );
    return result;
  },
});

export const getForAdmin = query({
  args: { trackId: v.id("tracks") },
  returns: v.object({
    track: schema.doc("tracks"),
    capabilities: trackCapabilitiesValidator,
    staff: v.array(
      v.object({
        userId: v.id("users"),
        fullName: v.string(),
        email: v.string(),
        userStatus: v.union(v.literal("active"), v.literal("suspended")),
        role: staffRoleValidator,
        permissions: v.array(trackPermissionValidator),
        isSelf: v.boolean(),
      }),
    ),
    cohorts: v.array(
      v.object({
        cohort: schema.doc("cohorts"),
        studentCount: v.number(),
        studentCountCapped: v.boolean(),
      }),
    ),
  }),
  handler: async (ctx, args) => {
    const { user, track, capabilities } = await requireTrackAdmin(ctx, args.trackId);

    const memberships = await ctx.db
      .query("trackMembers")
      .withIndex("by_trackId_and_role", (q) => q.eq("trackId", track._id))
      .take(MAX_STAFF_PER_TRACK);
    const staff = [];
    for (const membership of memberships) {
      const member = await ctx.db.get("users", membership.userId);
      if (member === null) continue;
      staff.push({
        userId: member._id,
        fullName: member.fullName,
        email: member.email,
        userStatus: member.status,
        role: membership.role,
        permissions: membership.role === "lead_mentor" ? [...TRACK_PERMISSIONS] : membership.permissions,
        isSelf: member._id === user._id,
      });
    }
    staff.sort((a, b) =>
      a.role === b.role ? a.fullName.localeCompare(b.fullName) : a.role === "lead_mentor" ? -1 : 1,
    );

    const cohortDocs = await ctx.db
      .query("cohorts")
      .withIndex("by_trackId", (q) => q.eq("trackId", track._id))
      .take(MAX_COHORTS_PER_TRACK);
    const cohorts = await Promise.all(
      cohortDocs.map(async (cohort) => {
        const enrollments = await ctx.db
          .query("enrollments")
          .withIndex("by_cohortId", (q) => q.eq("cohortId", cohort._id))
          .take(STUDENT_COUNT_CAP + 1);
        return {
          cohort,
          studentCount: Math.min(enrollments.length, STUDENT_COUNT_CAP),
          studentCountCapped: enrollments.length > STUDENT_COUNT_CAP,
        };
      }),
    );
    cohorts.sort((a, b) => b.cohort.startsAt - a.cohort.startsAt);

    return { track, capabilities, staff, cohorts };
  },
});

export const listCohortStudents = query({
  args: { cohortId: v.id("cohorts"), paginationOpts: paginationOptsValidator },
  returns: paginationResultValidator(
    v.object({
      enrollmentId: v.id("enrollments"),
      userId: v.id("users"),
      fullName: v.string(),
      email: v.string(),
      userStatus: v.union(v.literal("active"), v.literal("suspended")),
      enrollmentStatus: v.union(v.literal("active"), v.literal("completed")),
    }),
  ),
  handler: async (ctx, args) => {
    const cohort = await ctx.db.get("cohorts", args.cohortId);
    if (cohort === null) {
      throw new ConvexError("Cohort not found");
    }
    await requireTrackAdmin(ctx, cohort.trackId);

    const results = await ctx.db
      .query("enrollments")
      .withIndex("by_cohortId", (q) => q.eq("cohortId", cohort._id))
      .paginate(args.paginationOpts);
    const page = [];
    for (const enrollment of results.page) {
      const student = await ctx.db.get("users", enrollment.userId);
      if (student === null) continue;
      page.push({
        enrollmentId: enrollment._id,
        userId: student._id,
        fullName: student.fullName,
        email: student.email,
        userStatus: student.status,
        enrollmentStatus: enrollment.status,
      });
    }
    return { ...results, page };
  },
});

export const create = mutation({
  args: { name: v.string(), description: v.optional(v.string()) },
  returns: v.id("tracks"),
  handler: async (ctx, args) => {
    await requirePlatformPermission(ctx, "tracks.manage");
    const name = args.name.trim();
    const slug = await assertTrackNameAvailable(ctx, name);
    const description = args.description?.trim();
    return await ctx.db.insert("tracks", {
      name,
      slug,
      description: description || undefined,
      status: "active",
    });
  },
});

export const update = mutation({
  args: {
    trackId: v.id("tracks"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.union(v.literal("active"), v.literal("archived"))),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requirePlatformPermission(ctx, "tracks.manage");
    const track = await ctx.db.get("tracks", args.trackId);
    if (track === null) {
      throw new ConvexError("Track not found");
    }
    const name = args.name?.trim();
    if (name !== undefined) {
      await assertTrackNameAvailable(ctx, name, track._id);
    }
    const description = args.description?.trim();
    await ctx.db.patch("tracks", track._id, {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description: description || undefined }),
      ...(args.status !== undefined && { status: args.status }),
    });
    return null;
  },
});

export const setLead = mutation({
  args: { trackId: v.id("tracks"), userId: v.id("users") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requirePlatformPermission(ctx, "tracks.manage");
    const track = await ctx.db.get("tracks", args.trackId);
    if (track === null || track.status !== "active") {
      throw new ConvexError("Restore this track before changing its staff");
    }
    if ((await ctx.db.get("users", args.userId)) === null) {
      throw new ConvexError("User not found");
    }
    await setLeadMentor(ctx, args.trackId, args.userId);
    return null;
  },
});

export const setCoMentorPermissions = mutation({
  args: {
    trackId: v.id("tracks"),
    userId: v.id("users"),
    permissions: v.array(trackPermissionValidator),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const actor = await requireUser(ctx);
    const canManageTracks = hasPlatformPermission(actor, "tracks.manage");
    const actorAccess = await getTrackAccess(ctx, actor, args.trackId);
    if (!canManageTracks && actorAccess.staffRole !== "lead_mentor") {
      throw new ConvexError("Only the lead mentor can manage co-mentors");
    }
    const target = await getTrackMembership(ctx, args.userId, args.trackId);
    if (target?.role === "lead_mentor") {
      throw new ConvexError("The lead mentor already has every track permission");
    }
    if ((await ctx.db.get("users", args.userId)) === null) {
      throw new ConvexError("User not found");
    }
    await setCoMentor(ctx, args.trackId, args.userId, [...new Set(args.permissions)]);
    return null;
  },
});

export const removeMember = mutation({
  args: { trackId: v.id("tracks"), userId: v.id("users") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const actor = await requireUser(ctx);
    const canManageTracks = hasPlatformPermission(actor, "tracks.manage");
    const membership = await getTrackMembership(ctx, args.userId, args.trackId);
    if (membership === null) {
      return null;
    }
    if (membership.role === "lead_mentor" && !canManageTracks) {
      throw new ConvexError("Only people who manage tracks can remove a lead mentor");
    }
    if (membership.role === "co_mentor" && !canManageTracks) {
      const actorAccess = await getTrackAccess(ctx, actor, args.trackId);
      if (actorAccess.staffRole !== "lead_mentor") {
        throw new ConvexError("Only the lead mentor can remove co-mentors");
      }
    }
    await ctx.db.delete("trackMembers", membership._id);
    return null;
  },
});

export const listCohorts = query({
  args: { trackId: v.id("tracks") },
  returns: v.array(schema.doc("cohorts")),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const access = await getTrackAccess(ctx, user, args.trackId);
    if (!access.canView) {
      throw new ConvexError("Not authorized for this track");
    }
    return await ctx.db
      .query("cohorts")
      .withIndex("by_trackId", (q) => q.eq("trackId", args.trackId))
      .take(MAX_COHORTS_PER_TRACK);
  },
});

export const createCohort = mutation({
  args: {
    trackId: v.id("tracks"),
    name: v.string(),
    startsAt: v.number(),
    endsAt: v.optional(v.number()),
    status: v.optional(cohortStatusValidator),
  },
  returns: v.id("cohorts"),
  handler: async (ctx, args) => {
    await requireTrackPermission(ctx, args.trackId, "track.cohorts");
    const track = await ctx.db.get("tracks", args.trackId);
    if (track === null || track.status !== "active") {
      throw new ConvexError("Restore this track before adding cohorts");
    }
    const name = args.name.trim();
    if (!name) {
      throw new ConvexError("Cohort name is required");
    }
    validateCohortDates(args.startsAt, args.endsAt);
    return await ctx.db.insert("cohorts", {
      trackId: args.trackId,
      name,
      startsAt: args.startsAt,
      endsAt: args.endsAt,
      status: args.status ?? "draft",
    });
  },
});

export const updateCohort = mutation({
  args: {
    cohortId: v.id("cohorts"),
    name: v.optional(v.string()),
    startsAt: v.optional(v.number()),
    endsAt: v.optional(v.union(v.number(), v.null())),
    status: v.optional(cohortStatusValidator),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { cohort } = await requireCohortManager(ctx, args.cohortId);
    const name = args.name?.trim();
    if (name !== undefined && !name) {
      throw new ConvexError("Cohort name is required");
    }
    const startsAt = args.startsAt ?? cohort.startsAt;
    const endsAt = args.endsAt === undefined ? cohort.endsAt : (args.endsAt ?? undefined);
    validateCohortDates(startsAt, endsAt);
    await ctx.db.patch("cohorts", cohort._id, {
      ...(name !== undefined && { name }),
      startsAt,
      endsAt,
      ...(args.status !== undefined && { status: args.status }),
    });
    return null;
  },
});

export const moveStudent = mutation({
  args: { enrollmentId: v.id("enrollments"), cohortId: v.id("cohorts") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const enrollment = await ctx.db.get("enrollments", args.enrollmentId);
    if (enrollment === null) {
      throw new ConvexError("This student is no longer enrolled");
    }
    const { cohort: target } = await requireCohortManager(ctx, args.cohortId);
    if (target.trackId !== enrollment.trackId) {
      throw new ConvexError("Students can only move between cohorts in the same track");
    }
    if (target._id === enrollment.cohortId) {
      return null;
    }
    const existing = await ctx.db
      .query("enrollments")
      .withIndex("by_userId_and_cohortId", (q) =>
        q.eq("userId", enrollment.userId).eq("cohortId", target._id),
      )
      .unique();
    if (existing === null) {
      await ctx.db.patch("enrollments", enrollment._id, { cohortId: target._id });
    } else {
      await ctx.db.delete("enrollments", enrollment._id);
    }
    return null;
  },
});

export const unenroll = mutation({
  args: { enrollmentId: v.id("enrollments") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const enrollment = await ctx.db.get("enrollments", args.enrollmentId);
    if (enrollment === null) {
      return null;
    }
    await requireCohortManager(ctx, enrollment.cohortId);
    await ctx.db.delete("enrollments", enrollment._id);
    return null;
  },
});

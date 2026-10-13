import { ConvexError, v } from "convex/values";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { cohortStatusValidator } from "./schema";
import { getTrackAccess, isEndedCohort, requireTrackPermission, requireUser } from "./lib/auth";
import { getTrackViewer, loadOutline } from "./lib/curriculum";
import { cleanHttpUrl, cleanText, cleanVideoLink, requireText } from "./lib/urls";
import { WORKSHOP_LIMITS } from "./lib/workshops";

const MAX_TRACKS = 200;
const MAX_COHORTS_PER_TRACK = 100;
const MAX_SESSIONS = 200;
const MAX_ADMIN_SESSIONS_PER_TRACK = 100;
const MAX_DURATION_MS = WORKSHOP_LIMITS.maxDuration * 60 * 1000;

const sessionValidator = v.object({
  _id: v.id("workshops"),
  trackId: v.id("tracks"),
  cohortId: v.id("cohorts"),
  cohortName: v.string(),
  title: v.string(),
  description: v.union(v.string(), v.null()),
  scheduledAt: v.number(),
  endsAt: v.number(),
  durationMinutes: v.number(),
  timezone: v.string(),
  meetingUrl: v.string(),
  hostName: v.union(v.string(), v.null()),
  module: v.union(v.object({ _id: v.id("modules"), slug: v.string(), title: v.string() }), v.null()),
  recordingUrl: v.union(v.string(), v.null()),
});

const sessionFields = {
  title: v.string(),
  description: v.optional(v.string()),
  scheduledAt: v.number(),
  durationMinutes: v.number(),
  timezone: v.string(),
  meetingUrl: v.string(),
  hostName: v.optional(v.string()),
  moduleId: v.optional(v.id("modules")),
};

type SessionInput = {
  title: string;
  description?: string;
  scheduledAt: number;
  durationMinutes: number;
  timezone: string;
  meetingUrl: string;
  hostName?: string;
  moduleId?: Id<"modules">;
};

async function toSession(
  ctx: QueryCtx,
  workshop: Doc<"workshops">,
  options: { includeDraftModules: boolean; cohortName?: string },
) {
  const [cohort, mod] = await Promise.all([
    options.cohortName === undefined ? ctx.db.get("cohorts", workshop.cohortId) : Promise.resolve(null),
    workshop.moduleId ? ctx.db.get("modules", workshop.moduleId) : Promise.resolve(null),
  ]);
  const visibleModule = mod !== null && (options.includeDraftModules || mod.status === "published") ? mod : null;
  return {
    _id: workshop._id,
    trackId: workshop.trackId,
    cohortId: workshop.cohortId,
    cohortName: options.cohortName ?? cohort?.name ?? "",
    title: workshop.title,
    description: workshop.description ?? null,
    scheduledAt: workshop.scheduledAt,
    endsAt: workshop.scheduledAt + workshop.durationMinutes * 60 * 1000,
    durationMinutes: workshop.durationMinutes,
    timezone: workshop.timezone,
    meetingUrl: workshop.meetingUrl,
    hostName: workshop.hostName ?? null,
    module: visibleModule ? { _id: visibleModule._id, slug: visibleModule.slug, title: visibleModule.title } : null,
    recordingUrl: workshop.recordingUrl ?? null,
  };
}

function isValidTimezone(timezone: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

async function cleanSession(ctx: MutationCtx, trackId: Id<"tracks">, input: SessionInput) {
  if (!Number.isFinite(input.scheduledAt) || input.scheduledAt <= 0) {
    throw new ConvexError("Pick a date and time");
  }
  if (
    !Number.isInteger(input.durationMinutes) ||
    input.durationMinutes < WORKSHOP_LIMITS.minDuration ||
    input.durationMinutes > WORKSHOP_LIMITS.maxDuration
  ) {
    throw new ConvexError(
      `Sessions must last between ${WORKSHOP_LIMITS.minDuration} minutes and ${WORKSHOP_LIMITS.maxDuration / 60} hours`,
    );
  }
  const timezone = input.timezone.trim();
  if (!timezone || timezone.length > WORKSHOP_LIMITS.timezone || !isValidTimezone(timezone)) {
    throw new ConvexError("Pick a valid timezone");
  }
  if (input.moduleId !== undefined) {
    const mod = await ctx.db.get("modules", input.moduleId);
    if (mod === null || mod.trackId !== trackId) {
      throw new ConvexError("That module isn't in this track");
    }
  }
  return {
    title: requireText(input.title, WORKSHOP_LIMITS.title, "Title"),
    description: cleanText(input.description, WORKSHOP_LIMITS.description, "Description"),
    scheduledAt: Math.round(input.scheduledAt),
    durationMinutes: input.durationMinutes,
    timezone,
    meetingUrl: cleanHttpUrl(input.meetingUrl, "meeting link"),
    hostName: cleanText(input.hostName, WORKSHOP_LIMITS.hostName, "Host name"),
    moduleId: input.moduleId,
  };
}

/** The cohort must be in a track the caller can schedule for, and still running. */
async function requireSchedulableCohort(ctx: MutationCtx, cohortId: Id<"cohorts">) {
  const cohort = await ctx.db.get("cohorts", cohortId);
  if (cohort === null) {
    throw new ConvexError("Cohort not found");
  }
  const { user } = await requireTrackPermission(ctx, cohort.trackId, "track.workshops");
  if (isEndedCohort(cohort)) {
    throw new ConvexError("This cohort has ended");
  }
  return { user, cohort };
}

async function requireManageableWorkshop(ctx: MutationCtx, workshopId: Id<"workshops">) {
  const workshop = await ctx.db.get("workshops", workshopId);
  if (workshop === null) {
    throw new ConvexError("Session not found");
  }
  const { user } = await requireTrackPermission(ctx, workshop.trackId, "track.workshops");
  return { user, workshop };
}

/** Learners see their cohort's sessions; staff without a cohort see the whole track. */
async function sessionsForViewer(
  ctx: QueryCtx,
  trackId: Id<"tracks">,
  cohortId: Id<"cohorts"> | null,
  options: { from?: number; limit: number },
) {
  if (cohortId !== null) {
    return await ctx.db
      .query("workshops")
      .withIndex("by_cohortId_and_scheduledAt", (q) =>
        options.from === undefined ? q.eq("cohortId", cohortId) : q.eq("cohortId", cohortId).gt("scheduledAt", options.from),
      )
      .take(options.limit);
  }
  return await ctx.db
    .query("workshops")
    .withIndex("by_trackId_and_scheduledAt", (q) =>
      options.from === undefined ? q.eq("trackId", trackId) : q.eq("trackId", trackId).gt("scheduledAt", options.from),
    )
    .take(options.limit);
}

export const listForLearner = query({
  args: { trackId: v.id("tracks") },
  returns: v.union(
    v.null(),
    v.object({
      cohort: v.union(v.object({ name: v.string() }), v.null()),
      canManage: v.boolean(),
      sessions: v.array(sessionValidator),
    }),
  ),
  handler: async (ctx, args) => {
    const viewer = await getTrackViewer(ctx, args.trackId);
    if (viewer === null) return null;
    const { access, canEdit } = viewer;
    const cohort = access.cohortId ? await ctx.db.get("cohorts", access.cohortId) : null;
    const workshops = await sessionsForViewer(ctx, args.trackId, cohort?._id ?? null, { limit: MAX_SESSIONS });
    const sessions = await Promise.all(
      workshops.map((w) => toSession(ctx, w, { includeDraftModules: canEdit, cohortName: cohort?.name })),
    );
    return {
      cohort: cohort ? { name: cohort.name } : null,
      canManage: access.permissions.includes("track.workshops"),
      sessions,
    };
  },
});

/** The session that is live now or starts next. `now` comes from the client because queries can't read the clock. */
export const next = query({
  args: { trackId: v.id("tracks"), now: v.number() },
  returns: v.union(sessionValidator, v.null()),
  handler: async (ctx, args) => {
    const viewer = await getTrackViewer(ctx, args.trackId);
    if (viewer === null) return null;
    const { access, canEdit } = viewer;
    const candidates = await sessionsForViewer(ctx, args.trackId, access.cohortId, {
      from: args.now - MAX_DURATION_MS,
      limit: 20,
    });
    const upcoming = candidates.find((w) => w.scheduledAt + w.durationMinutes * 60 * 1000 > args.now);
    return upcoming ? await toSession(ctx, upcoming, { includeDraftModules: canEdit }) : null;
  },
});

export const listForAdmin = query({
  args: { trackId: v.optional(v.id("tracks")) },
  returns: v.object({
    tracks: v.array(
      v.object({
        _id: v.id("tracks"),
        name: v.string(),
        cohorts: v.array(v.object({ _id: v.id("cohorts"), name: v.string(), status: cohortStatusValidator })),
        modules: v.array(v.object({ _id: v.id("modules"), title: v.string() })),
      }),
    ),
    sessions: v.array(sessionValidator.extend({ trackName: v.string() })),
  }),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const allTracks = args.trackId
      ? [await ctx.db.get("tracks", args.trackId)].filter((t) => t !== null)
      : await ctx.db.query("tracks").take(MAX_TRACKS);

    const tracks = [];
    const sessions = [];
    for (const track of allTracks) {
      if (track.status !== "active") continue;
      const access = await getTrackAccess(ctx, user, track._id);
      if (!access.permissions.includes("track.workshops")) continue;

      const [cohorts, outline, workshops] = await Promise.all([
        ctx.db
          .query("cohorts")
          .withIndex("by_trackId", (q) => q.eq("trackId", track._id))
          .take(MAX_COHORTS_PER_TRACK),
        loadOutline(ctx, track._id, true),
        ctx.db
          .query("workshops")
          .withIndex("by_trackId_and_scheduledAt", (q) => q.eq("trackId", track._id))
          .order("desc")
          .take(MAX_ADMIN_SESSIONS_PER_TRACK),
      ]);
      const cohortNames = new Map(cohorts.map((c) => [c._id, c.name]));
      tracks.push({
        _id: track._id,
        name: track.name,
        cohorts: cohorts.map((c) => ({ _id: c._id, name: c.name, status: c.status })),
        modules: outline.flatMap((u) => u.modules.map(({ module: m }) => ({ _id: m._id, title: m.title }))),
      });
      for (const workshop of workshops) {
        const session = await toSession(ctx, workshop, {
          includeDraftModules: true,
          cohortName: cohortNames.get(workshop.cohortId) ?? "",
        });
        sessions.push({ ...session, trackName: track.name });
      }
    }
    sessions.sort((a, b) => b.scheduledAt - a.scheduledAt);
    return { tracks, sessions };
  },
});

export const create = mutation({
  args: { cohortId: v.id("cohorts"), ...sessionFields },
  returns: v.id("workshops"),
  handler: async (ctx, args) => {
    const { cohortId, ...input } = args;
    const { user, cohort } = await requireSchedulableCohort(ctx, cohortId);
    const fields = await cleanSession(ctx, cohort.trackId, input);
    const workshopId = await ctx.db.insert("workshops", {
      ...fields,
      trackId: cohort.trackId,
      cohortId: cohort._id,
      createdBy: user._id,
    });
    await ctx.scheduler.runAfter(0, internal.notifications.fanOutToCohort, {
      cohortId: cohort._id,
      type: "workshop",
      title: `New live session: ${fields.title}`,
      body: fields.description,
      link: "/live",
      excludeUserId: user._id,
    });
    return workshopId;
  },
});

export const update = mutation({
  args: { workshopId: v.id("workshops"), cohortId: v.id("cohorts"), ...sessionFields },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { workshopId, cohortId, ...input } = args;
    const { workshop } = await requireManageableWorkshop(ctx, workshopId);
    let trackId = workshop.trackId;
    if (cohortId !== workshop.cohortId) {
      const { cohort } = await requireSchedulableCohort(ctx, cohortId);
      trackId = cohort.trackId;
    }
    const fields = await cleanSession(ctx, trackId, input);
    await ctx.db.patch("workshops", workshop._id, { ...fields, trackId, cohortId });
    return null;
  },
});

export const cancel = mutation({
  args: { workshopId: v.id("workshops") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { workshop } = await requireManageableWorkshop(ctx, args.workshopId);
    await ctx.db.delete("workshops", workshop._id);
    return null;
  },
});

export const setRecording = mutation({
  args: { workshopId: v.id("workshops"), recordingUrl: v.union(v.string(), v.null()) },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { workshop } = await requireManageableWorkshop(ctx, args.workshopId);
    const recordingUrl =
      args.recordingUrl === null || !args.recordingUrl.trim() ? undefined : cleanVideoLink(args.recordingUrl);
    await ctx.db.patch("workshops", workshop._id, { recordingUrl });
    return null;
  },
});

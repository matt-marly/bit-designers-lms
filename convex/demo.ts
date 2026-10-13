import { ConvexError, v } from "convex/values";
import { internalMutation, type MutationCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { flattenOutline, loadLessons, loadOutline, uniqueLessonSlug, uniqueModuleSlug } from "./lib/curriculum";
import { recomputeModuleCompletion, uniqueMissionSlug } from "./lib/missions";
import { plainPreview } from "./lib/notifications";
import { TRACK_PERMISSIONS } from "./lib/permissions";
import { DESIGN_LAB_MISSIONS } from "./lib/sampleCurriculum";
import {
  COHORT_01_LEARNERS,
  DEMO_ANNOUNCEMENTS,
  DEMO_EMAIL_DOMAIN,
  DEMO_MEETING_URL,
  DEMO_RECORDING_URL,
  DEMO_SESSIONS,
  DEMO_TOKEN_PREFIX,
  DESIGN_LAB_STAFF,
  MISSION_TITLES,
  OSS_CURRICULUM,
  OSS_LEARNERS,
  OSS_STAFF,
  PILOT_LEARNERS,
  REVIEW_COMMENTS,
  SUBMISSION_NOTES,
  type DemoCohortKey,
  type DemoLearner,
  type DemoStaff,
  type MissionKey,
  type WorkState,
} from "./lib/demoData";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
/** Monday 09:00 UTC → Thursday 16:00 UTC (17:00 in Lagos). */
const SESSION_OFFSET = 3 * DAY + 7 * HOUR;
const PILOT_COHORT = "Pilot Cohort";
const OSS_COHORT = "OSS Cohort 01";
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

function hash(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function token(seed: string, length: number) {
  let out = "";
  for (let i = 0; i < length; i++) out += ALPHABET[hash(`${seed}:${i}`) % ALPHABET.length];
  return out;
}

function pick<T>(items: T[], seed: string): T {
  return items[hash(seed) % items.length];
}

function emailFor(name: string) {
  const local = name
    .normalize("NFD")
    .toLowerCase()
    .replace(/[^a-z ]/g, "")
    .trim()
    .replace(/\s+/g, ".");
  return `${local}@${DEMO_EMAIL_DOMAIN}`;
}

function slugTitle(title: string) {
  return title.replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function linkFor(key: MissionKey, name: string, version: number) {
  const id = token(`${name}:${key}:${version}`, 22);
  if (key === "explain") return `https://docs.google.com/document/d/${id}/edit`;
  if (key === "triage") return `https://www.notion.so/${slugTitle(name).toLowerCase()}/Issue-triage-${id.slice(0, 12)}`;
  return `https://www.figma.com/design/${id}/${slugTitle(MISSION_TITLES[key])}${version > 1 ? `-v${version}` : ""}`;
}

/** Monday 09:00 UTC of the current week. */
function thisMonday(now: number) {
  const d = new Date(now);
  const daysSinceMonday = (d.getUTCDay() + 6) % 7;
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - daysSinceMonday, 9);
}

function versionsFor(state: WorkState): Array<Doc<"submissions">["status"]> {
  switch (state) {
    case "submitted":
      return ["submitted"];
    case "in_review":
      return ["in_review"];
    case "needs_revision":
      return ["needs_revision"];
    case "revised_waiting":
      return ["needs_revision", "submitted"];
    case "passed":
      return ["passed"];
    case "passed_after_revision":
      return ["needs_revision", "passed"];
  }
}

type CohortContext = {
  key: DemoCohortKey;
  cohort: Doc<"cohorts">;
  start: number;
  learners: DemoLearner[];
  reviewers: Id<"users">[];
  modules: Doc<"modules">[];
  lessons: Doc<"lessons">[];
  missions: Map<MissionKey, { mission: Doc<"missions">; dueWeek: number }>;
  enrollmentStatus: "active" | "completed";
  learnerIds: Id<"users">[];
};

async function trackBySlug(ctx: MutationCtx, slug: string) {
  const track = await ctx.db
    .query("tracks")
    .withIndex("by_slug", (q) => q.eq("slug", slug))
    .unique();
  if (track === null) throw new ConvexError(`No track with slug ${slug}. Run seed:tracks first.`);
  return track;
}

async function publishedContent(ctx: MutationCtx, trackId: Id<"tracks">) {
  const modules = flattenOutline(await loadOutline(ctx, trackId, false)).map((e) => e.module);
  const lessons = (await Promise.all(modules.map((m) => loadLessons(ctx, m._id)))).flat();
  return { modules, lessons };
}

async function insertPerson(
  ctx: MutationCtx,
  person: { name: string; bio: string; portfolio?: string; showInShowcase?: boolean },
  onboardedAt: number,
) {
  const email = emailFor(person.name);
  return await ctx.db.insert("users", {
    tokenIdentifier: `${DEMO_TOKEN_PREFIX}${email}`,
    email,
    fullName: person.name,
    platformRole: "member",
    permissions: [],
    status: "active",
    bio: person.bio,
    portfolioUrl: person.portfolio,
    showInShowcase: person.showInShowcase,
    onboardedAt,
  });
}

async function insertStaff(ctx: MutationCtx, trackId: Id<"tracks">, staff: DemoStaff, onboardedAt: number) {
  const userId = await insertPerson(ctx, staff, onboardedAt);
  await ctx.db.insert("trackMembers", {
    trackId,
    userId,
    role: staff.role,
    permissions: staff.role === "lead_mentor" ? [...TRACK_PERMISSIONS] : (staff.permissions ?? []),
  });
  return userId;
}

async function upsertDeadline(ctx: MutationCtx, missionId: Id<"missions">, cohortId: Id<"cohorts">, dueAt: number) {
  const existing = await ctx.db
    .query("missionDeadlines")
    .withIndex("by_missionId_and_cohortId", (q) => q.eq("missionId", missionId).eq("cohortId", cohortId))
    .first();
  if (existing) {
    await ctx.db.patch("missionDeadlines", existing._id, { dueAt });
  } else {
    await ctx.db.insert("missionDeadlines", { missionId, cohortId, dueAt });
  }
}

/** Adds a small published Open Source Lab curriculum if the track has none. */
async function ensureOssCurriculum(ctx: MutationCtx, trackId: Id<"tracks">) {
  const existing = await ctx.db
    .query("units")
    .withIndex("by_trackId_and_sortOrder", (q) => q.eq("trackId", trackId))
    .first();
  if (existing !== null) return;
  const unitId = await ctx.db.insert("units", { trackId, ...OSS_CURRICULUM.unit, sortOrder: 0 });
  for (const [index, mod] of OSS_CURRICULUM.modules.entries()) {
    const moduleId = await ctx.db.insert("modules", {
      trackId,
      unitId,
      title: mod.title,
      description: mod.description,
      slug: await uniqueModuleSlug(ctx, mod.title),
      sortOrder: index,
      status: "published",
      objectives: mod.objectives,
      lessonCount: mod.lessons.length,
    });
    for (const [lessonIndex, lesson] of mod.lessons.entries()) {
      await ctx.db.insert("lessons", {
        moduleId,
        trackId,
        title: lesson.title,
        slug: await uniqueLessonSlug(ctx, moduleId, lesson.title),
        body: lesson.body,
        summary: lesson.summary,
        sortOrder: lessonIndex,
      });
    }
    if (mod.title === OSS_CURRICULUM.mission.moduleTitle) {
      const mission = OSS_CURRICULUM.mission;
      await ctx.db.insert("missions", {
        trackId,
        moduleId,
        title: mission.title,
        brief: mission.brief,
        rubric: mission.rubric,
        slug: await uniqueMissionSlug(ctx, mission.title),
        reviewType: "reviewed",
        sortOrder: 0,
      });
    }
  }
}

async function missionsByKey(ctx: MutationCtx, trackId: Id<"tracks">) {
  const missions = await ctx.db
    .query("missions")
    .withIndex("by_trackId", (q) => q.eq("trackId", trackId))
    .take(300);
  const dueWeeks = new Map<string, number>([
    ...DESIGN_LAB_MISSIONS.map((m) => [m.title, m.dueWeek] as const),
    [OSS_CURRICULUM.mission.title, OSS_CURRICULUM.mission.dueWeek] as const,
  ]);
  const result = new Map<MissionKey, { mission: Doc<"missions">; dueWeek: number }>();
  for (const [key, title] of Object.entries(MISSION_TITLES) as [MissionKey, string][]) {
    const mission = missions.find((m) => m.title === title);
    const dueWeek = dueWeeks.get(title);
    if (mission && dueWeek !== undefined) result.set(key, { mission, dueWeek });
  }
  return result;
}

async function seedWork(
  ctx: MutationCtx,
  c: CohortContext,
  learner: DemoLearner,
  userId: Id<"users">,
  key: MissionKey,
  state: WorkState,
  now: number,
) {
  const entry = c.missions.get(key);
  if (!entry) return;
  const { mission, dueWeek } = entry;
  const dueAt = c.start + dueWeek * WEEK - 1;
  const late = learner.late?.includes(key) ?? false;
  const base = {
    userId,
    missionId: mission._id,
    trackId: c.cohort.trackId,
    cohortId: c.cohort._id,
  };

  if (mission.reviewType === "completion_only") {
    await ctx.db.insert("submissions", {
      ...base,
      linkUrl: linkFor(key, learner.name, 1),
      note: pick(SUBMISSION_NOTES[key], learner.name),
      status: "passed",
      isLate: late,
      version: 1,
    });
    return;
  }

  const spread = hash(learner.name) % 30;
  for (const [i, status] of versionsFor(state).entries()) {
    const version = i + 1;
    const seed = `${learner.name}:${key}:${version}`;
    const reviewerId = pick(c.reviewers, seed);
    const reviewed = status === "passed" || status === "needs_revision";
    const reviewedAt = Math.min(dueAt + (version === 1 ? 2 : 6) * DAY + spread * HOUR, now - (spread + 2) * HOUR);
    const submissionId = await ctx.db.insert("submissions", {
      ...base,
      linkUrl: linkFor(key, learner.name, version),
      note: version === 1 ? pick(SUBMISSION_NOTES[key], learner.name) : "Updated based on the review. Changes are listed on the first page.",
      status,
      isLate: late && version === 1,
      version,
      reviewerId: status === "submitted" ? undefined : reviewerId,
      reviewedAt: reviewed ? reviewedAt : undefined,
    });
    if (!reviewed) continue;

    const comments = REVIEW_COMMENTS[key][status === "passed" ? "passed" : "revision"];
    const comment = pick(comments, seed);
    const failIndex = hash(seed) % Math.max(1, mission.rubric.length);
    await ctx.db.insert("reviews", {
      submissionId,
      reviewerId,
      outcome: status,
      comment,
      rubricChecks: mission.rubric.map((_, j) => status === "passed" || j !== failIndex),
    });
    await ctx.db.insert("notifications", {
      userId,
      type: "review",
      title: status === "passed" ? `Your work passed: ${mission.title}` : `Needs revision: ${mission.title}`,
      body: comment.slice(0, 280),
      link: `/missions/${mission.slug}`,
      read: reviewedAt < now - 2 * DAY,
    });
  }
}

async function seedLearner(ctx: MutationCtx, c: CohortContext, learner: DemoLearner, now: number) {
  const userId = await insertPerson(ctx, learner, c.start + DAY);
  await ctx.db.insert("enrollments", {
    userId,
    cohortId: c.cohort._id,
    trackId: c.cohort.trackId,
    status: c.enrollmentStatus,
  });
  for (const lesson of c.lessons.slice(0, learner.lessons)) {
    await ctx.db.insert("lessonCompletions", {
      userId,
      lessonId: lesson._id,
      moduleId: lesson.moduleId,
      trackId: c.cohort.trackId,
    });
  }
  for (const [key, state] of Object.entries(learner.work) as [MissionKey, WorkState][]) {
    await seedWork(ctx, c, learner, userId, key, state, now);
  }
  for (const mod of c.modules) {
    await recomputeModuleCompletion(ctx, userId, mod);
  }
  return userId;
}

/**
 * Fills the dev deployment with a believable picture of the program: staff,
 * a finished pilot cohort with certificates, Cohort 01 in week 6, an Open
 * Source Lab cohort, sessions, announcements, reviews and notifications.
 *
 * Needs `seed:tracks`, `seed:curriculum` and `seed:missions` first. Moves
 * Design Lab's "Cohort 01" to start five weeks ago. Does nothing if the demo
 * data is already there; remove it with `demo:clear`.
 */
export const seed = internalMutation({
  args: {},
  returns: v.object({
    skipped: v.boolean(),
    users: v.number(),
    submissions: v.number(),
    sessions: v.number(),
    announcements: v.number(),
    certificates: v.number(),
  }),
  handler: async (ctx) => {
    const marker = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", emailFor(DESIGN_LAB_STAFF[0].name)))
      .first();
    if (marker !== null) {
      return { skipped: true, users: 0, submissions: 0, sessions: 0, announcements: 0, certificates: 0 };
    }

    const now = Date.now();
    const design = await trackBySlug(ctx, "design_lab");
    const oss = await trackBySlug(ctx, "oss_lab");
    const designContent = await publishedContent(ctx, design._id);
    const designMissions = await missionsByKey(ctx, design._id);
    if (designContent.modules.length === 0 || designMissions.size === 0) {
      throw new ConvexError("Design Lab has no published curriculum or missions. Run seed:curriculum and seed:missions first.");
    }
    await ensureOssCurriculum(ctx, oss._id);
    const ossContent = await publishedContent(ctx, oss._id);
    const ossMissions = await missionsByKey(ctx, oss._id);

    const c01Start = thisMonday(now) - 5 * WEEK;
    const pilotStart = c01Start - 26 * WEEK;
    const ossStart = c01Start + 2 * WEEK;

    const designCohorts = await ctx.db
      .query("cohorts")
      .withIndex("by_trackId", (q) => q.eq("trackId", design._id))
      .take(100);
    const existing01 = designCohorts.find((c) => c.name === "Cohort 01");
    const cohort01Id =
      existing01?._id ??
      (await ctx.db.insert("cohorts", { trackId: design._id, name: "Cohort 01", startsAt: c01Start, status: "active" }));
    await ctx.db.patch("cohorts", cohort01Id, { startsAt: c01Start, endsAt: c01Start + 12 * WEEK - DAY, status: "active" });
    const pilotId = await ctx.db.insert("cohorts", {
      trackId: design._id,
      name: PILOT_COHORT,
      startsAt: pilotStart,
      endsAt: pilotStart + 12 * WEEK - DAY,
      status: "completed",
    });
    const ossCohortId = await ctx.db.insert("cohorts", {
      trackId: oss._id,
      name: OSS_COHORT,
      startsAt: ossStart,
      endsAt: ossStart + 10 * WEEK - DAY,
      status: "active",
    });

    for (const { mission, dueWeek } of designMissions.values()) {
      await upsertDeadline(ctx, mission._id, cohort01Id, c01Start + dueWeek * WEEK - 1);
      await upsertDeadline(ctx, mission._id, pilotId, pilotStart + dueWeek * WEEK - 1);
    }
    for (const { mission, dueWeek } of ossMissions.values()) {
      await upsertDeadline(ctx, mission._id, ossCohortId, ossStart + dueWeek * WEEK - 1);
    }

    const staffIds = new Map<string, Id<"users">>();
    for (const staff of DESIGN_LAB_STAFF) {
      staffIds.set(staff.name, await insertStaff(ctx, design._id, staff, pilotStart - WEEK));
    }
    for (const staff of OSS_STAFF) {
      staffIds.set(staff.name, await insertStaff(ctx, oss._id, staff, ossStart - WEEK));
    }
    const reviewersOf = (staff: DemoStaff[]) =>
      staff.filter((s) => s.role === "lead_mentor" || s.permissions?.includes("track.reviews")).map((s) => staffIds.get(s.name)!);

    const cohorts: Record<DemoCohortKey, CohortContext> = {
      pilot: {
        key: "pilot",
        cohort: (await ctx.db.get("cohorts", pilotId))!,
        start: pilotStart,
        learners: PILOT_LEARNERS,
        reviewers: reviewersOf(DESIGN_LAB_STAFF),
        ...designContent,
        missions: designMissions,
        enrollmentStatus: "completed",
        learnerIds: [],
      },
      cohort01: {
        key: "cohort01",
        cohort: (await ctx.db.get("cohorts", cohort01Id))!,
        start: c01Start,
        learners: COHORT_01_LEARNERS,
        reviewers: reviewersOf(DESIGN_LAB_STAFF),
        ...designContent,
        missions: designMissions,
        enrollmentStatus: "active",
        learnerIds: [],
      },
      oss: {
        key: "oss",
        cohort: (await ctx.db.get("cohorts", ossCohortId))!,
        start: ossStart,
        learners: OSS_LEARNERS,
        reviewers: reviewersOf(OSS_STAFF),
        ...ossContent,
        missions: ossMissions,
        enrollmentStatus: "active",
        learnerIds: [],
      },
    };

    for (const c of Object.values(cohorts)) {
      for (const learner of c.learners) {
        c.learnerIds.push(await seedLearner(ctx, c, learner, now));
      }
    }

    // Certificates are issued "now" by the completion logic; date them to the end of the pilot.
    let certificates = 0;
    for (const userId of cohorts.pilot.learnerIds) {
      const certificate = await ctx.db
        .query("certificates")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .first();
      if (certificate === null) continue;
      certificates += 1;
      await ctx.db.patch("certificates", certificate._id, { issuedAt: pilotStart + 12 * WEEK - 2 * DAY });
      const notes = await ctx.db
        .query("notifications")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .take(50);
      for (const note of notes) {
        if (note.type === "certificate") await ctx.db.patch("notifications", note._id, { read: true });
      }
    }

    for (const session of DEMO_SESSIONS) {
      const c = cohorts[session.cohort];
      const scheduledAt = c.start + (session.week - 1) * WEEK + SESSION_OFFSET;
      const mod = session.moduleTitle ? c.modules.find((m) => m.title === session.moduleTitle) : undefined;
      await ctx.db.insert("workshops", {
        trackId: c.cohort.trackId,
        cohortId: c.cohort._id,
        title: session.title,
        description: session.description,
        scheduledAt,
        durationMinutes: session.title === "Demo day" ? 120 : 60,
        timezone: "Africa/Lagos",
        meetingUrl: DEMO_MEETING_URL,
        hostName: session.host,
        moduleId: mod?._id,
        recordingUrl: session.recorded ? DEMO_RECORDING_URL : undefined,
        createdBy: staffIds.get(session.host),
      });
      if (session.cohort === "pilot") continue;
      for (const userId of c.learnerIds) {
        await ctx.db.insert("notifications", {
          userId,
          type: "workshop",
          title: `New live session: ${session.title}`,
          body: session.description.slice(0, 280),
          link: "/live",
          read: scheduledAt < now,
        });
      }
    }

    const admin = (await ctx.db.query("users").take(500)).find(
      (u) => u.platformRole === "super_admin" && !u.tokenIdentifier.startsWith(DEMO_TOKEN_PREFIX),
    );
    const everyone = [...staffIds.values(), ...Object.values(cohorts).flatMap((c) => c.learnerIds)];
    for (const a of DEMO_ANNOUNCEMENTS) {
      const authorId = a.author === "admin" ? admin?._id : staffIds.get(a.author);
      const cohort = a.audience === "global" ? null : cohorts[a.audience].cohort;
      await ctx.db.insert("announcements", {
        title: a.title,
        body: a.body,
        scope: cohort ? "cohort" : "global",
        cohortId: cohort?._id,
        trackId: cohort?.trackId,
        createdBy: authorId,
      });
      const recipients = cohort ? cohorts[a.audience as DemoCohortKey].learnerIds : everyone;
      const postedAt = c01Start + a.day * DAY;
      for (const userId of recipients) {
        if (userId === authorId) continue;
        await ctx.db.insert("notifications", {
          userId,
          type: "announcement",
          title: a.title,
          body: plainPreview(a.body),
          link: "/home",
          read: postedAt < now - 4 * DAY,
        });
      }
    }

    const submissions = (
      await Promise.all(
        Object.values(cohorts).map((c) =>
          ctx.db
            .query("submissions")
            .withIndex("by_cohortId_and_status", (q) => q.eq("cohortId", c.cohort._id))
            .take(1000),
        ),
      )
    ).flat().length;

    return {
      skipped: false,
      users: everyone.length,
      submissions,
      sessions: DEMO_SESSIONS.length,
      announcements: DEMO_ANNOUNCEMENTS.length,
      certificates,
    };
  },
});

/**
 * Removes everything `demo:seed` created: demo accounts and their activity,
 * their sessions and announcements, and the pilot and OSS cohorts. Curriculum
 * and resources stay.
 */
export const clear = internalMutation({
  args: {},
  returns: v.object({ users: v.number(), cohorts: v.number() }),
  handler: async (ctx) => {
    const demoUsers = (await ctx.db.query("users").take(1000)).filter((u) => u.tokenIdentifier.startsWith(DEMO_TOKEN_PREFIX));
    const demoIds = new Set(demoUsers.map((u) => u._id));

    for (const user of demoUsers) {
      const [enrollments, memberships, lessonDone, moduleDone, submissions, notifications, certificates] = await Promise.all([
        ctx.db.query("enrollments").withIndex("by_userId_and_trackId", (q) => q.eq("userId", user._id)).take(100),
        ctx.db.query("trackMembers").withIndex("by_userId", (q) => q.eq("userId", user._id)).take(100),
        ctx.db.query("lessonCompletions").withIndex("by_userId_and_trackId", (q) => q.eq("userId", user._id)).take(1000),
        ctx.db.query("moduleCompletions").withIndex("by_userId_and_trackId", (q) => q.eq("userId", user._id)).take(1000),
        ctx.db.query("submissions").withIndex("by_userId_and_missionId", (q) => q.eq("userId", user._id)).take(1000),
        ctx.db.query("notifications").withIndex("by_userId", (q) => q.eq("userId", user._id)).take(1000),
        ctx.db.query("certificates").withIndex("by_userId", (q) => q.eq("userId", user._id)).take(100),
      ]);
      for (const submission of submissions) {
        const reviews = await ctx.db
          .query("reviews")
          .withIndex("by_submissionId", (q) => q.eq("submissionId", submission._id))
          .take(100);
        for (const review of reviews) await ctx.db.delete("reviews", review._id);
        await ctx.db.delete("submissions", submission._id);
      }
      for (const row of enrollments) await ctx.db.delete("enrollments", row._id);
      for (const row of memberships) await ctx.db.delete("trackMembers", row._id);
      for (const row of lessonDone) await ctx.db.delete("lessonCompletions", row._id);
      for (const row of moduleDone) await ctx.db.delete("moduleCompletions", row._id);
      for (const row of notifications) await ctx.db.delete("notifications", row._id);
      for (const row of certificates) await ctx.db.delete("certificates", row._id);
      await ctx.db.delete("users", user._id);
    }

    const demoTitles = new Set(DEMO_ANNOUNCEMENTS.map((a) => a.title));
    for (const announcement of await ctx.db.query("announcements").take(1000)) {
      if ((announcement.createdBy && demoIds.has(announcement.createdBy)) || demoTitles.has(announcement.title)) {
        await ctx.db.delete("announcements", announcement._id);
      }
    }

    const sessionTitles = new Set(DEMO_SESSIONS.map((s) => s.title));
    let cohortsRemoved = 0;
    for (const track of await ctx.db.query("tracks").take(100)) {
      const workshops = await ctx.db
        .query("workshops")
        .withIndex("by_trackId_and_scheduledAt", (q) => q.eq("trackId", track._id))
        .take(1000);
      for (const w of workshops) {
        if ((w.createdBy && demoIds.has(w.createdBy)) || (w.createdBy === undefined && sessionTitles.has(w.title))) {
          await ctx.db.delete("workshops", w._id);
        }
      }
      const cohorts = await ctx.db
        .query("cohorts")
        .withIndex("by_trackId", (q) => q.eq("trackId", track._id))
        .take(100);
      for (const cohort of cohorts) {
        if (cohort.name !== PILOT_COHORT && cohort.name !== OSS_COHORT) continue;
        const enrolled = await ctx.db
          .query("enrollments")
          .withIndex("by_cohortId", (q) => q.eq("cohortId", cohort._id))
          .first();
        if (enrolled !== null) continue;
        const deadlines = await ctx.db
          .query("missionDeadlines")
          .withIndex("by_cohortId", (q) => q.eq("cohortId", cohort._id))
          .take(500);
        for (const d of deadlines) await ctx.db.delete("missionDeadlines", d._id);
        await ctx.db.delete("cohorts", cohort._id);
        cohortsRemoved += 1;
      }
    }

    // Real accounts only received global announcement notifications.
    for (const user of (await ctx.db.query("users").take(1000)).filter((u) => !demoIds.has(u._id))) {
      const notes = await ctx.db
        .query("notifications")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .take(1000);
      for (const note of notes) {
        if (note.type === "announcement" && demoTitles.has(note.title)) await ctx.db.delete("notifications", note._id);
      }
    }

    return { users: demoUsers.length, cohorts: cohortsRemoved };
  },
});

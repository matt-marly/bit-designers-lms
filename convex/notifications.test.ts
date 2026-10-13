import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { createCohort, createUser, enroll, seedTrack, setup, type TestConvex } from "./test.setup";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(Date.UTC(2027, 0, 10));
});

afterEach(() => {
  vi.useRealTimers();
});

async function addNotifications(t: TestConvex, userId: Id<"users">, count: number) {
  await t.run(async (ctx) => {
    for (let i = 0; i < count; i++) {
      await ctx.db.insert("notifications", { userId, type: "announcement", title: `Note ${i}`, read: false });
    }
  });
}

describe("notifications", () => {
  test("lists newest first and counts unread", async () => {
    const t = setup();
    const { student } = await seedTrack(t);
    await addNotifications(t, student.userId, 3);

    const page = await student.as.query(api.notifications.list, { paginationOpts: { numItems: 2, cursor: null } });
    expect(page.page.map((n) => n.title)).toEqual(["Note 2", "Note 1"]);
    expect(page.isDone).toBe(false);
    expect(await student.as.query(api.notifications.unreadCount, {})).toBe(3);
  });

  test("people can only mark their own notifications read", async () => {
    const t = setup();
    const { student, coMentor } = await seedTrack(t);
    await addNotifications(t, student.userId, 1);
    const [note] = (await student.as.query(api.notifications.list, { paginationOpts: { numItems: 5, cursor: null } })).page;

    await expect(coMentor.as.mutation(api.notifications.markRead, { notificationId: note._id })).rejects.toThrow(/not found/);
    await student.as.mutation(api.notifications.markRead, { notificationId: note._id });
    expect(await student.as.query(api.notifications.unreadCount, {})).toBe(0);
  });

  test("mark all read works across batches", async () => {
    const t = setup();
    const { student } = await seedTrack(t);
    await addNotifications(t, student.userId, 450);

    await student.as.mutation(api.notifications.markAllRead, {});
    await t.finishAllScheduledFunctions(vi.runAllTimers);

    const unread = await t.run((ctx) =>
      ctx.db
        .query("notifications")
        .withIndex("by_userId_and_read", (q) => q.eq("userId", student.userId).eq("read", false))
        .collect(),
    );
    expect(unread).toHaveLength(0);
  });

  test("cohort fan-out reaches every member across pages and skips suspended users", async () => {
    const t = setup();
    const { trackId, lead } = await seedTrack(t);
    const cohortId = await createCohort(t, trackId, "Big cohort");
    const members: Id<"users">[] = [];
    for (let i = 0; i < 230; i++) {
      const u = await createUser(t, { email: `m${i}@test.dev` });
      await enroll(t, u.userId, trackId, cohortId);
      members.push(u.userId);
    }
    const suspended = await createUser(t, { email: "gone@test.dev", status: "suspended" });
    await enroll(t, suspended.userId, trackId, cohortId);

    await t.mutation(internal.notifications.fanOutToCohort, {
      cohortId,
      type: "announcement",
      title: "Hello",
      excludeUserId: lead.userId,
    });
    await t.finishAllScheduledFunctions(vi.runAllTimers);

    const all = await t.run((ctx) => ctx.db.query("notifications").collect());
    expect(all).toHaveLength(230);
    expect(all.some((n) => n.userId === suspended.userId)).toBe(false);
  });

  test("reviews notify the learner", async () => {
    const t = setup();
    const { lead, student, trackId } = await seedTrack(t);
    const unitId = await lead.as.mutation(api.curriculumEditor.createUnit, { trackId, title: "Foundations" });
    const { moduleId } = await lead.as.mutation(api.curriculumEditor.createModule, { unitId, title: "UX" });
    await lead.as.mutation(api.curriculumEditor.createLesson, { moduleId, title: "Trust" });
    await lead.as.mutation(api.curriculumEditor.setModuleStatus, { moduleId, status: "published" });
    const missionId = await lead.as.mutation(api.missionsEditor.createMission, { moduleId, title: "Wallet audit" });
    const result = await student.as.mutation(api.missions.submit, { missionId, linkUrl: "https://figma.com/file/x" });
    if (!result.ok) throw new Error(result.error);

    await lead.as.mutation(api.reviews.review, { submissionId: result.submissionId, outcome: "passed", comment: "Great work" });

    const [note] = (await student.as.query(api.notifications.list, { paginationOpts: { numItems: 5, cursor: null } })).page;
    expect(note).toMatchObject({ type: "review", title: "Your work passed: Wallet audit", body: "Great work" });
    expect(note.link).toMatch(/^\/missions\//);
  });
});

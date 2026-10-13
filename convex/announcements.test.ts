import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { api } from "./_generated/api";
import { createCohort, createUser, enroll, seedTrack, setup } from "./test.setup";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(Date.UTC(2027, 0, 10));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("announcements", () => {
  test("cohort announcements need track.announcements and reach only that cohort", async () => {
    const t = setup();
    const { lead, coMentor, student, trackId, cohortId } = await seedTrack(t);
    const cohort2 = await createCohort(t, trackId, "Cohort 02");
    const other = await createUser(t, { email: "other@test.dev" });
    await enroll(t, other.userId, trackId, cohort2);

    await expect(
      coMentor.as.mutation(api.announcements.create, { title: "Hi", body: "Hello", scope: "cohort", cohortId }),
    ).rejects.toThrow(/Not authorized/);
    await expect(
      student.as.mutation(api.announcements.create, { title: "Hi", body: "Hello", scope: "cohort", cohortId }),
    ).rejects.toThrow(/Not authorized/);

    await lead.as.mutation(api.announcements.create, {
      title: "Week 2 kicks off",
      body: "Read **module 3** before Thursday.",
      scope: "cohort",
      cohortId,
    });
    await t.finishAllScheduledFunctions(vi.runAllTimers);

    expect((await student.as.query(api.announcements.feed, { trackId })).map((a) => a.title)).toEqual(["Week 2 kicks off"]);
    expect(await other.as.query(api.announcements.feed, { trackId })).toEqual([]);

    const notes = await t.run((ctx) => ctx.db.query("notifications").collect());
    expect(notes.map((n) => n.userId)).toEqual([student.userId]);
    expect(notes[0].body).toBe("Read module 3 before Thursday.");
  });

  test("global announcements need announcements.global and reach every active user", async () => {
    const t = setup();
    const { admin, lead, student, trackId, otherTrackId } = await seedTrack(t);
    const otherCohort = await createCohort(t, otherTrackId);
    const elsewhere = await createUser(t, { email: "elsewhere@test.dev" });
    await enroll(t, elsewhere.userId, otherTrackId, otherCohort);

    await expect(
      lead.as.mutation(api.announcements.create, { title: "Hi all", body: "Hello", scope: "global" }),
    ).rejects.toThrow(/Not authorized/);

    await admin.as.mutation(api.announcements.create, { title: "Platform update", body: "New features.", scope: "global" });
    await t.finishAllScheduledFunctions(vi.runAllTimers);

    expect((await student.as.query(api.announcements.feed, { trackId })).map((a) => a.title)).toEqual(["Platform update"]);
    expect((await elsewhere.as.query(api.announcements.feed, { trackId: otherTrackId })).map((a) => a.title)).toEqual([
      "Platform update",
    ]);

    const notified = new Set((await t.run((ctx) => ctx.db.query("notifications").collect())).map((n) => n.userId));
    expect(notified.has(student.userId)).toBe(true);
    expect(notified.has(elsewhere.userId)).toBe(true);
    expect(notified.has(admin.userId)).toBe(false);
  });

  test("people outside a track see nothing, and only authors or managers can delete", async () => {
    const t = setup();
    const { lead, coMentor, student, trackId, cohortId } = await seedTrack(t);
    const announcementId = await lead.as.mutation(api.announcements.create, {
      title: "Heads up",
      body: "Body",
      scope: "cohort",
      cohortId,
    });

    const outsider = await createUser(t, { email: "outsider@test.dev" });
    expect(await outsider.as.query(api.announcements.feed, { trackId })).toEqual([]);

    await expect(coMentor.as.mutation(api.announcements.remove, { announcementId })).rejects.toThrow();
    await expect(student.as.mutation(api.announcements.remove, { announcementId })).rejects.toThrow();
    await lead.as.mutation(api.announcements.remove, { announcementId });
    expect(await student.as.query(api.announcements.feed, { trackId })).toEqual([]);
  });

  test("rejects empty and oversized messages", async () => {
    const t = setup();
    const { lead, cohortId } = await seedTrack(t);
    await expect(
      lead.as.mutation(api.announcements.create, { title: " ", body: "Body", scope: "cohort", cohortId }),
    ).rejects.toThrow();
    await expect(
      lead.as.mutation(api.announcements.create, { title: "Hi", body: "x".repeat(5001), scope: "cohort", cohortId }),
    ).rejects.toThrow();
  });
});

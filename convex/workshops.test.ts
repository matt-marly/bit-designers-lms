import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { createCohort, createUser, enroll, seedTrack, setup, type TestConvex } from "./test.setup";

const NOW = Date.UTC(2027, 0, 10, 12);
const HOUR = 60 * 60 * 1000;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

function session(cohortId: Id<"cohorts">, overrides: Partial<{ title: string; scheduledAt: number }> = {}) {
  return {
    cohortId,
    title: overrides.title ?? "Wallet onboarding critique",
    scheduledAt: overrides.scheduledAt ?? NOW + 24 * HOUR,
    durationMinutes: 60,
    timezone: "Africa/Lagos",
    meetingUrl: "https://meet.google.com/abc-defg-hij",
    hostName: "Kemi",
  };
}

async function notificationsFor(t: TestConvex, userId: Id<"users">) {
  return await t.run((ctx) =>
    ctx.db
      .query("notifications")
      .withIndex("by_userId_and_read", (q) => q.eq("userId", userId))
      .collect(),
  );
}

describe("workshops", () => {
  test("only people with track.workshops can schedule", async () => {
    const t = setup();
    const { lead, coMentor, student, cohortId } = await seedTrack(t);

    await expect(student.as.mutation(api.workshops.create, session(cohortId))).rejects.toThrow(/Not authorized/);
    await expect(coMentor.as.mutation(api.workshops.create, session(cohortId))).rejects.toThrow(/Not authorized/);
    await lead.as.mutation(api.workshops.create, session(cohortId));
  });

  test("learners see their own cohort's sessions; staff see the whole track", async () => {
    const t = setup();
    const { lead, student, trackId, cohortId } = await seedTrack(t);
    const cohort2 = await createCohort(t, trackId, "Cohort 02");
    const other = await createUser(t, { email: "other@test.dev" });
    await enroll(t, other.userId, trackId, cohort2);

    await lead.as.mutation(api.workshops.create, session(cohortId, { title: "For cohort 01" }));
    await lead.as.mutation(api.workshops.create, session(cohort2, { title: "For cohort 02" }));

    const mine = await student.as.query(api.workshops.listForLearner, { trackId });
    expect(mine?.sessions.map((s) => s.title)).toEqual(["For cohort 01"]);
    expect(mine?.canManage).toBe(false);

    const staff = await lead.as.query(api.workshops.listForLearner, { trackId });
    expect(staff?.sessions.map((s) => s.title).sort()).toEqual(["For cohort 01", "For cohort 02"]);

    const outsider = await createUser(t, { email: "outsider@test.dev" });
    expect(await outsider.as.query(api.workshops.listForLearner, { trackId })).toBeNull();
  });

  test("next returns the soonest session that hasn't ended", async () => {
    const t = setup();
    const { lead, student, trackId, cohortId } = await seedTrack(t);
    await lead.as.mutation(api.workshops.create, session(cohortId, { title: "Later", scheduledAt: NOW + 48 * HOUR }));
    await lead.as.mutation(api.workshops.create, session(cohortId, { title: "Sooner", scheduledAt: NOW + 2 * HOUR }));

    expect((await student.as.query(api.workshops.next, { trackId, now: NOW }))?.title).toBe("Sooner");
    expect((await student.as.query(api.workshops.next, { trackId, now: NOW + 3 * HOUR + 1 }))?.title).toBe("Later");
  });

  test("scheduling notifies the cohort but not the person who scheduled it", async () => {
    const t = setup();
    const { lead, student, cohortId } = await seedTrack(t);
    await enroll(t, lead.userId, (await t.run((ctx) => ctx.db.get("cohorts", cohortId)))!.trackId, cohortId);

    await lead.as.mutation(api.workshops.create, session(cohortId));
    await t.finishAllScheduledFunctions(vi.runAllTimers);

    const studentNotes = await notificationsFor(t, student.userId);
    expect(studentNotes).toHaveLength(1);
    expect(studentNotes[0]).toMatchObject({ type: "workshop", link: "/live", read: false });
    expect(await notificationsFor(t, lead.userId)).toHaveLength(0);
  });

  test("rejects ended cohorts, bad links and non-video recordings", async () => {
    const t = setup();
    const { lead, cohortId } = await seedTrack(t);

    await expect(
      lead.as.mutation(api.workshops.create, { ...session(cohortId), meetingUrl: "javascript:alert(1)" }),
    ).rejects.toThrow();
    await expect(lead.as.mutation(api.workshops.create, { ...session(cohortId), durationMinutes: 5 })).rejects.toThrow();

    const workshopId = await lead.as.mutation(api.workshops.create, session(cohortId));
    await expect(
      lead.as.mutation(api.workshops.setRecording, { workshopId, recordingUrl: "https://example.com/video" }),
    ).rejects.toThrow();
    await lead.as.mutation(api.workshops.setRecording, { workshopId, recordingUrl: "https://youtu.be/dQw4w9WgXcQ" });

    await t.run((ctx) => ctx.db.patch("cohorts", cohortId, { status: "completed" }));
    await expect(lead.as.mutation(api.workshops.create, session(cohortId))).rejects.toThrow(/ended/);
  });

  test("cancelling removes the session", async () => {
    const t = setup();
    const { lead, student, trackId, cohortId } = await seedTrack(t);
    const workshopId = await lead.as.mutation(api.workshops.create, session(cohortId));

    await expect(student.as.mutation(api.workshops.cancel, { workshopId })).rejects.toThrow();
    await lead.as.mutation(api.workshops.cancel, { workshopId });
    expect((await student.as.query(api.workshops.listForLearner, { trackId }))?.sessions).toEqual([]);
  });
});

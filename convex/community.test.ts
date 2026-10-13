import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { createCohort, createUser, enroll, seedTrack, setup } from "./test.setup";

type Actor = Awaited<ReturnType<typeof createUser>>["as"];

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(Date.UTC(2027, 0, 10));
});

afterEach(() => {
  vi.useRealTimers();
});

async function publishedMission(editor: Actor, trackId: Id<"tracks">, reviewType: "reviewed" | "completion_only" = "reviewed") {
  const unitId = await editor.mutation(api.curriculumEditor.createUnit, { trackId, title: "Foundations" });
  const { moduleId } = await editor.mutation(api.curriculumEditor.createModule, { unitId, title: "UX" });
  await editor.mutation(api.curriculumEditor.createLesson, { moduleId, title: "Trust" });
  await editor.mutation(api.curriculumEditor.setModuleStatus, { moduleId, status: "published" });
  const missionId = await editor.mutation(api.missionsEditor.createMission, { moduleId, title: "Wallet audit" });
  if (reviewType !== "reviewed") {
    await editor.mutation(api.missionsEditor.updateMission, { missionId, reviewType });
  }
  return missionId;
}

describe("community directory", () => {
  test("learners see their own cohort and the mentors, without emails", async () => {
    const t = setup();
    const { lead, coMentor, student, trackId, cohortId } = await seedTrack(t);
    const cohort2 = await createCohort(t, trackId, "Cohort 02");
    const other = await createUser(t, { email: "other@test.dev" });
    await enroll(t, other.userId, trackId, cohort2);

    const directory = await student.as.query(api.community.directory, { trackId });
    expect(directory?.cohorts.map((c) => [c._id, c.isOwn])).toEqual([[cohortId, true]]);
    expect(directory?.cohorts[0].members.map((m) => m._id)).toEqual([student.userId]);
    expect(directory?.mentors.map((m) => [m._id, m.role])).toEqual([
      [lead.userId, "lead_mentor"],
      [coMentor.userId, "co_mentor"],
    ]);
    expect(JSON.stringify(directory)).not.toContain("@test.dev");
  });

  test("staff see every cohort; outsiders see nothing", async () => {
    const t = setup();
    const { lead, trackId } = await seedTrack(t);
    await createCohort(t, trackId, "Cohort 02");

    const directory = await lead.as.query(api.community.directory, { trackId });
    expect(directory?.cohorts.map((c) => c.name).sort()).toEqual(["Cohort 01", "Cohort 02"]);

    const outsider = await createUser(t, { email: "outsider@test.dev" });
    expect(await outsider.as.query(api.community.directory, { trackId })).toBeNull();
  });

  test("suspended members are hidden", async () => {
    const t = setup();
    const { student, trackId, cohortId } = await seedTrack(t);
    const gone = await createUser(t, { email: "gone@test.dev", status: "suspended" });
    await enroll(t, gone.userId, trackId, cohortId);

    const directory = await student.as.query(api.community.directory, { trackId });
    expect(directory?.cohorts[0].members.map((m) => m._id)).toEqual([student.userId]);
  });
});

describe("showcase", () => {
  test("shows passed reviewed work and respects the opt-out", async () => {
    const t = setup();
    const { lead, student, trackId, cohortId } = await seedTrack(t);
    const peer = await createUser(t, { email: "peer@test.dev", fullName: "Peer" });
    await enroll(t, peer.userId, trackId, cohortId);
    const missionId = await publishedMission(lead.as, trackId);

    for (const actor of [student, peer]) {
      const result = await actor.as.mutation(api.missions.submit, { missionId, linkUrl: `https://figma.com/${actor.email}` });
      if (!result.ok) throw new Error(result.error);
      await lead.as.mutation(api.reviews.review, { submissionId: result.submissionId, outcome: "passed", comment: "Nice" });
    }

    let items = await student.as.query(api.community.showcase, { trackId });
    expect(items.map((i) => i.learner._id).sort()).toEqual([student.userId, peer.userId].sort());

    await peer.as.mutation(api.users.updateProfile, { showInShowcase: false });
    items = await student.as.query(api.community.showcase, { trackId });
    expect(items.map((i) => i.learner._id)).toEqual([student.userId]);

    const outsider = await createUser(t, { email: "outsider@test.dev" });
    expect(await outsider.as.query(api.community.showcase, { trackId })).toEqual([]);
  });

  test("leaves out work still waiting or sent back", async () => {
    const t = setup();
    const { lead, student, trackId } = await seedTrack(t);
    const missionId = await publishedMission(lead.as, trackId);
    const result = await student.as.mutation(api.missions.submit, { missionId, linkUrl: "https://figma.com/x" });
    if (!result.ok) throw new Error(result.error);
    expect(await student.as.query(api.community.showcase, { trackId })).toEqual([]);

    await lead.as.mutation(api.reviews.review, { submissionId: result.submissionId, outcome: "needs_revision", comment: "More" });
    expect(await student.as.query(api.community.showcase, { trackId })).toEqual([]);
  });
});

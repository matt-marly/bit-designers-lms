import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { addStaff, createUser, enroll, seedTrack, setup, type TestConvex } from "./test.setup";

type Actor = Awaited<ReturnType<typeof createUser>>["as"];

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(Date.UTC(2027, 0, 10));
});

afterEach(() => {
  vi.useRealTimers();
});

const LINK = "https://figma.com/file/abc";

/** A published module with one lesson and a reviewed mission, plus a draft module with its own mission. */
async function seedMissions(t: TestConvex, editor: Actor, trackId: Id<"tracks">) {
  const unitId = await editor.mutation(api.curriculumEditor.createUnit, { trackId, title: "Foundations" });
  const published = await editor.mutation(api.curriculumEditor.createModule, { unitId, title: "UX Principles" });
  const lessonId = await editor.mutation(api.curriculumEditor.createLesson, { moduleId: published.moduleId, title: "Trust" });
  await editor.mutation(api.curriculumEditor.setModuleStatus, { moduleId: published.moduleId, status: "published" });
  const missionId = await editor.mutation(api.missionsEditor.createMission, {
    moduleId: published.moduleId,
    title: "Wallet audit",
  });
  await editor.mutation(api.missionsEditor.updateMission, {
    missionId,
    brief: "Audit a wallet.",
    rubric: ["Covers the send flow", "Proposes fixes"],
  });

  const draft = await editor.mutation(api.curriculumEditor.createModule, { unitId, title: "Errors (WIP)" });
  const draftLessonId = await editor.mutation(api.curriculumEditor.createLesson, { moduleId: draft.moduleId, title: "Anatomy" });
  const draftMissionId = await editor.mutation(api.missionsEditor.createMission, {
    moduleId: draft.moduleId,
    title: "Error audit",
  });

  await t.finishAllScheduledFunctions(vi.runAllTimers);
  return { unitId, published, draft, lessonId, draftLessonId, missionId, draftMissionId };
}

async function slugOf(t: TestConvex, missionId: Id<"missions">) {
  const mission = await t.run((ctx) => ctx.db.get("missions", missionId));
  return mission!.slug;
}

/** convex-test doesn't record content types on stored files, so this sets it the way an upload URL would. */
async function storeFile(t: TestConvex, contentType: string, bytes = 16) {
  const fileId = await t.run((ctx) => ctx.storage.store(new Blob([new Uint8Array(bytes)])));
  await t.run(async (ctx) => {
    const db = ctx.db as unknown as { patch: (id: Id<"_storage">, value: { contentType: string }) => Promise<void> };
    await db.patch(fileId, { contentType });
  });
  return fileId;
}

async function submissionsFor(t: TestConvex, missionId: Id<"missions">) {
  return await t.run((ctx) =>
    ctx.db
      .query("submissions")
      .withIndex("by_missionId", (q) => q.eq("missionId", missionId))
      .collect(),
  );
}

describe("editing missions", () => {
  test("only people with track.content can create and edit missions", async () => {
    const t = setup();
    const { lead, coMentor, student, trackId } = await seedTrack(t);
    const { published, missionId } = await seedMissions(t, lead.as, trackId);

    await expect(
      coMentor.as.mutation(api.missionsEditor.createMission, { moduleId: published.moduleId, title: "Nope" }),
    ).rejects.toThrow(/Not authorized/);
    await expect(
      student.as.mutation(api.missionsEditor.updateMission, { missionId, title: "Mine now" }),
    ).rejects.toThrow(/Not authorized/);
    expect(await student.as.query(api.missionsEditor.getMission, { missionId })).toBeNull();
    expect(await coMentor.as.query(api.missionsEditor.getMission, { missionId })).toBeNull();
    expect(await lead.as.query(api.missionsEditor.getMission, { missionId })).toMatchObject({ title: "Wallet audit" });
  });

  test("missions of draft modules are hidden from learners but visible to editors", async () => {
    const t = setup();
    const { lead, student, trackId } = await seedTrack(t);
    const { draftMissionId } = await seedMissions(t, lead.as, trackId);
    const slug = await slugOf(t, draftMissionId);

    const list = await student.as.query(api.missions.list, { trackId });
    expect(list.missions.map((m) => m.title)).toEqual(["Wallet audit"]);
    expect(await student.as.query(api.missions.get, { slug })).toBeNull();
    expect(await lead.as.query(api.missions.get, { slug })).toMatchObject({ canEdit: true, isStudent: false });
  });

  test("deadlines are per cohort and must belong to the mission's track", async () => {
    const t = setup();
    const { admin, lead, student, trackId, otherTrackId, cohortId } = await seedTrack(t);
    const { missionId } = await seedMissions(t, lead.as, trackId);
    const dueAt = Date.UTC(2027, 0, 20);

    await lead.as.mutation(api.missionsEditor.setDeadline, { missionId, cohortId, dueAt });
    expect((await student.as.query(api.missions.list, { trackId })).missions[0].dueAt).toBe(dueAt);

    const otherCohort = await t.run((ctx) =>
      ctx.db.insert("cohorts", { trackId: otherTrackId, name: "OSS 01", startsAt: Date.UTC(2027, 0, 4), status: "active" }),
    );
    await expect(
      admin.as.mutation(api.missionsEditor.setDeadline, { missionId, cohortId: otherCohort, dueAt }),
    ).rejects.toThrow();

    await lead.as.mutation(api.missionsEditor.setDeadline, { missionId, cohortId, dueAt: null });
    expect((await student.as.query(api.missions.list, { trackId })).missions[0].dueAt).toBeNull();
  });

  test("a mission with submissions can't be deleted", async () => {
    const t = setup();
    const { lead, student, trackId } = await seedTrack(t);
    const { missionId } = await seedMissions(t, lead.as, trackId);
    await student.as.mutation(api.missions.submit, { missionId, linkUrl: LINK });

    await expect(lead.as.mutation(api.missionsEditor.deleteMission, { missionId })).rejects.toThrow();
  });

  test("a module with missions can't be deleted", async () => {
    const t = setup();
    const { lead, trackId } = await seedTrack(t);
    const { draft, draftLessonId } = await seedMissions(t, lead.as, trackId);
    await lead.as.mutation(api.curriculumEditor.deleteLesson, { lessonId: draftLessonId });

    await expect(
      lead.as.mutation(api.curriculumEditor.deleteModule, { moduleId: draft.moduleId }),
    ).rejects.toThrow(/missions first/);
  });
});

describe("submitting work", () => {
  test("only enrolled students can submit", async () => {
    const t = setup();
    const { lead, coMentor, trackId } = await seedTrack(t);
    const { missionId } = await seedMissions(t, lead.as, trackId);

    await expect(lead.as.mutation(api.missions.submit, { missionId, linkUrl: LINK })).rejects.toThrow(
      /Only students/,
    );
    await expect(coMentor.as.mutation(api.missions.generateUploadUrl, { missionId })).rejects.toThrow(
      /Only students/,
    );
    const outsider = await createUser(t, { email: "outsider@test.dev" });
    await expect(outsider.as.mutation(api.missions.submit, { missionId, linkUrl: LINK })).rejects.toThrow();
  });

  test("alumni keep their work but can't submit new versions", async () => {
    const t = setup();
    const { lead, student, trackId, cohortId } = await seedTrack(t);
    const { missionId } = await seedMissions(t, lead.as, trackId);
    const first = await student.as.mutation(api.missions.submit, { missionId, linkUrl: LINK });
    expect(first.ok).toBe(true);

    for (const status of ["completed", "archived"] as const) {
      await t.run((ctx) => ctx.db.patch("cohorts", cohortId, { status }));
      await expect(student.as.mutation(api.missions.submit, { missionId, linkUrl: LINK })).rejects.toThrow(
        /cohort has ended/,
      );
      await expect(student.as.mutation(api.missions.generateUploadUrl, { missionId })).rejects.toThrow(
        /cohort has ended/,
      );

      const list = await student.as.query(api.missions.list, { trackId });
      expect(list?.isAlumni).toBe(true);
      expect(list?.missions.find((m) => m._id === missionId)?.status).toBe("submitted");
      const detail = await student.as.query(api.missions.get, { slug: await slugOf(t, missionId) });
      expect(detail?.isAlumni).toBe(true);
    }
  });

  test("missions in draft modules can't be submitted", async () => {
    const t = setup();
    const { lead, student, trackId } = await seedTrack(t);
    const { draftMissionId } = await seedMissions(t, lead.as, trackId);

    await expect(
      student.as.mutation(api.missions.submit, { missionId: draftMissionId, linkUrl: LINK }),
    ).rejects.toThrow(/not found/);
  });

  test("bad links come back as errors without saving anything", async () => {
    const t = setup();
    const { lead, student, trackId } = await seedTrack(t);
    const { missionId } = await seedMissions(t, lead.as, trackId);

    for (const linkUrl of ["", "not a link", "ftp://files.example.com/x", "javascript:alert(1)"]) {
      const result = await student.as.mutation(api.missions.submit, { missionId, linkUrl });
      expect(result.ok).toBe(false);
    }
    expect(await submissionsFor(t, missionId)).toEqual([]);
  });

  test("a rejected file is deleted from storage", async () => {
    const t = setup();
    const { lead, student, trackId } = await seedTrack(t);
    const { missionId } = await seedMissions(t, lead.as, trackId);
    const fileId = await storeFile(t, "application/zip");

    const result = await student.as.mutation(api.missions.submit, { missionId, linkUrl: LINK, fileId, fileName: "work.zip" });
    expect(result).toEqual({ ok: false, error: "Attach a PDF, PNG, JPG or WebP file" });
    expect(await t.run((ctx) => ctx.db.system.get("_storage", fileId))).toBeNull();
    expect(await submissionsFor(t, missionId)).toEqual([]);
  });

  test("files over 10 MB are rejected", async () => {
    const t = setup();
    const { lead, student, trackId } = await seedTrack(t);
    const { missionId } = await seedMissions(t, lead.as, trackId);
    const fileId = await storeFile(t, "application/pdf", 10 * 1024 * 1024 + 1);

    const result = await student.as.mutation(api.missions.submit, { missionId, linkUrl: LINK, fileId, fileName: "big.pdf" });
    expect(result).toEqual({ ok: false, error: "Files must be 10 MB or smaller" });
  });

  test("an accepted file is kept and shows up in the history with a link", async () => {
    const t = setup();
    const { lead, student, trackId } = await seedTrack(t);
    const { missionId } = await seedMissions(t, lead.as, trackId);
    const fileId = await storeFile(t, "application/pdf");

    const result = await student.as.mutation(api.missions.submit, {
      missionId,
      linkUrl: LINK,
      fileId,
      fileName: "audit.pdf",
      note: "  First pass  ",
    });
    expect(result.ok).toBe(true);

    const view = await student.as.query(api.missions.get, { slug: await slugOf(t, missionId) });
    expect(view?.status).toBe("submitted");
    expect(view?.canSubmit).toBe(false);
    expect(view?.submissions[0]).toMatchObject({ version: 1, fileName: "audit.pdf", note: "First pass", isLate: false });
    expect(view?.submissions[0].fileUrl).toEqual(expect.any(String));
  });

  test("work after the cohort deadline is flagged late", async () => {
    const t = setup();
    const { lead, student, trackId, cohortId } = await seedTrack(t);
    const { missionId } = await seedMissions(t, lead.as, trackId);
    await lead.as.mutation(api.missionsEditor.setDeadline, { missionId, cohortId, dueAt: Date.UTC(2027, 0, 8) });

    const before = await student.as.query(api.missions.list, { trackId });
    expect(before.missions[0]).toMatchObject({ status: "not_started", isLate: true });

    await student.as.mutation(api.missions.submit, { missionId, linkUrl: LINK });
    const [submission] = await submissionsFor(t, missionId);
    expect(submission.isLate).toBe(true);
  });

  test("reviewed missions can only be resubmitted after a revision request", async () => {
    const t = setup();
    const { lead, coMentor, student, trackId } = await seedTrack(t);
    const { missionId } = await seedMissions(t, lead.as, trackId);

    const first = await student.as.mutation(api.missions.submit, { missionId, linkUrl: LINK });
    if (!first.ok) throw new Error(first.error);
    expect(await student.as.mutation(api.missions.submit, { missionId, linkUrl: LINK })).toEqual({
      ok: false,
      error: "Your last submission is still waiting for review",
    });

    await coMentor.as.mutation(api.reviews.review, {
      submissionId: first.submissionId,
      outcome: "needs_revision",
      comment: "Add the receive flow too.",
    });
    const second = await student.as.mutation(api.missions.submit, { missionId, linkUrl: `${LINK}?v=2` });
    if (!second.ok) throw new Error(second.error);

    await coMentor.as.mutation(api.reviews.review, {
      submissionId: second.submissionId,
      outcome: "passed",
      comment: "Great work.",
    });
    expect(await student.as.mutation(api.missions.submit, { missionId, linkUrl: LINK })).toEqual({
      ok: false,
      error: "This mission has already passed",
    });

    const versions = (await submissionsFor(t, missionId)).map((s) => [s.version, s.status]);
    expect(versions).toEqual([
      [1, "needs_revision"],
      [2, "passed"],
    ]);
  });

  test("completion-only missions pass on submit and can be updated", async () => {
    const t = setup();
    const { lead, student, trackId } = await seedTrack(t);
    const { missionId } = await seedMissions(t, lead.as, trackId);
    await lead.as.mutation(api.missionsEditor.updateMission, { missionId, reviewType: "completion_only" });

    await student.as.mutation(api.missions.submit, { missionId, linkUrl: LINK });
    await student.as.mutation(api.missions.submit, { missionId, linkUrl: `${LINK}?v=2` });

    const list = await student.as.query(api.missions.list, { trackId });
    expect(list.missions[0]).toMatchObject({ status: "passed", satisfied: true, version: 2 });
    expect(await lead.as.query(api.reviews.queue, { trackId, tab: "to_review" })).toEqual([]);
  });
});

describe("reviewing", () => {
  async function seedSubmission(t: TestConvex) {
    const seeded = await seedTrack(t);
    const { missionId, lessonId, published } = await seedMissions(t, seeded.lead.as, seeded.trackId);
    const result = await seeded.student.as.mutation(api.missions.submit, { missionId, linkUrl: LINK });
    if (!result.ok) throw new Error(result.error);
    return { ...seeded, missionId, lessonId, published, submissionId: result.submissionId };
  }

  test("co-mentors with track.reviews can review; without it they can't", async () => {
    const t = setup();
    const { trackId, coMentor, submissionId } = await seedSubmission(t);
    const quietMentor = await createUser(t, { email: "quiet@test.dev" });
    await addStaff(t, trackId, quietMentor.userId, "co_mentor", ["track.cohorts"]);

    const queue = await coMentor.as.query(api.reviews.queue, { trackId, tab: "to_review" });
    expect(queue.map((e) => e._id)).toEqual([submissionId]);
    expect(await coMentor.as.query(api.reviews.waitingCount, {})).toBe(1);

    await expect(quietMentor.as.query(api.reviews.queue, { trackId, tab: "to_review" })).rejects.toThrow(
      /Not authorized/,
    );
    await expect(
      quietMentor.as.mutation(api.reviews.review, { submissionId, outcome: "passed", comment: "Looks good" }),
    ).rejects.toThrow(/Not authorized/);
    expect(await quietMentor.as.query(api.reviews.reviewableTracks, {})).toEqual([]);
  });

  test("platform reviewers can review any track; students can't review", async () => {
    const t = setup();
    const { student, submissionId } = await seedSubmission(t);
    const platformMentor = await createUser(t, { email: "pm@test.dev", platformRole: "platform_mentor" });

    await expect(
      student.as.mutation(api.reviews.review, { submissionId, outcome: "passed", comment: "Me!" }),
    ).rejects.toThrow(/Not authorized/);
    await platformMentor.as.mutation(api.reviews.review, { submissionId, outcome: "passed", comment: "Nice" });

    const reviewed = await platformMentor.as.query(api.reviews.queue, { tab: "reviewed" });
    expect(reviewed[0]).toMatchObject({ status: "passed", review: { outcome: "passed", comment: "Nice" } });
  });

  test("a review needs a comment and a rubric that matches", async () => {
    const t = setup();
    const { coMentor, submissionId } = await seedSubmission(t);

    await expect(
      coMentor.as.mutation(api.reviews.review, { submissionId, outcome: "passed", comment: "   " }),
    ).rejects.toThrow(/Write a comment/);
    await expect(
      coMentor.as.mutation(api.reviews.review, {
        submissionId,
        outcome: "passed",
        comment: "Good",
        rubricChecks: [true],
      }),
    ).rejects.toThrow(/rubric changed/);

    await coMentor.as.mutation(api.reviews.review, {
      submissionId,
      outcome: "passed",
      comment: "Good",
      rubricChecks: [true, false],
    });
    await expect(
      coMentor.as.mutation(api.reviews.review, { submissionId, outcome: "needs_revision", comment: "Wait" }),
    ).rejects.toThrow(/already been reviewed/);
  });

  test("starting a review claims it; others can't start it too", async () => {
    const t = setup();
    const { lead, coMentor, trackId, submissionId } = await seedSubmission(t);

    await coMentor.as.mutation(api.reviews.startReview, { submissionId });
    await expect(lead.as.mutation(api.reviews.startReview, { submissionId })).rejects.toThrow(/Someone else/);

    const inReview = await lead.as.query(api.reviews.queue, { trackId, tab: "in_review" });
    expect(inReview[0]).toMatchObject({ status: "in_review", reviewer: { isMe: false } });
    expect(await lead.as.query(api.reviews.queue, { trackId, tab: "to_review" })).toEqual([]);
  });

  test("nobody can review their own work", async () => {
    const t = setup();
    const { lead, trackId, cohortId, missionId } = await seedSubmission(t);
    await enroll(t, lead.userId, trackId, cohortId);
    const own = await lead.as.mutation(api.missions.submit, { missionId, linkUrl: LINK });
    if (!own.ok) throw new Error(own.error);

    const queue = await lead.as.query(api.reviews.queue, { trackId, tab: "to_review" });
    expect(queue.find((e) => e._id === own.submissionId)?.isOwn).toBe(true);
    await expect(
      lead.as.mutation(api.reviews.review, { submissionId: own.submissionId, outcome: "passed", comment: "Me" }),
    ).rejects.toThrow(/your own work/);
  });
});

describe("module completion", () => {
  test("a module completes only once its lessons are done and its missions pass", async () => {
    const t = setup();
    const { lead, coMentor, student, trackId } = await seedTrack(t);
    const { lessonId, missionId, published } = await seedMissions(t, lead.as, trackId);

    const afterLesson = await student.as.mutation(api.curriculum.setLessonComplete, { lessonId, complete: true });
    expect(afterLesson.moduleComplete).toBe(false);
    const home = await student.as.query(api.curriculum.home, { trackId });
    expect(home.next?.mission).toEqual({ slug: await slugOf(t, missionId), title: "Wallet audit" });

    const submitted = await student.as.mutation(api.missions.submit, { missionId, linkUrl: LINK });
    if (!submitted.ok) throw new Error(submitted.error);
    expect(submitted.moduleComplete).toBe(false);

    const reviewed = await coMentor.as.mutation(api.reviews.review, {
      submissionId: submitted.submissionId,
      outcome: "passed",
      comment: "Ship it",
    });
    expect(reviewed.moduleComplete).toBe(true);
    const mod = await student.as.query(api.curriculum.getModule, { slug: published.slug });
    expect(mod).toMatchObject({ isComplete: true, missions: [{ status: "passed", satisfied: true }] });
  });

  test("completion-only missions count as soon as they're submitted", async () => {
    const t = setup();
    const { lead, student, trackId } = await seedTrack(t);
    const { lessonId, missionId } = await seedMissions(t, lead.as, trackId);
    await lead.as.mutation(api.missionsEditor.updateMission, { missionId, reviewType: "completion_only" });

    await student.as.mutation(api.curriculum.setLessonComplete, { lessonId, complete: true });
    const result = await student.as.mutation(api.missions.submit, { missionId, linkUrl: LINK });
    expect(result).toMatchObject({ ok: true, moduleComplete: true });
  });

  test("adding a mission reopens modules learners had already finished", async () => {
    const t = setup();
    const { lead, student, trackId } = await seedTrack(t);
    const { lessonId, missionId, published } = await seedMissions(t, lead.as, trackId);
    await lead.as.mutation(api.missionsEditor.updateMission, { missionId, reviewType: "completion_only" });
    await student.as.mutation(api.curriculum.setLessonComplete, { lessonId, complete: true });
    await student.as.mutation(api.missions.submit, { missionId, linkUrl: LINK });
    expect((await student.as.query(api.curriculum.getModule, { slug: published.slug }))?.isComplete).toBe(true);

    await lead.as.mutation(api.missionsEditor.createMission, { moduleId: published.moduleId, title: "Follow-up" });
    await t.finishAllScheduledFunctions(vi.runAllTimers);

    expect((await student.as.query(api.curriculum.getModule, { slug: published.slug }))?.isComplete).toBe(false);
  });
});

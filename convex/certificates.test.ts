import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { createUser, seedTrack, setup, type TestConvex } from "./test.setup";

type Actor = Awaited<ReturnType<typeof createUser>>["as"];

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(Date.UTC(2027, 0, 10));
});

afterEach(() => {
  vi.useRealTimers();
});

/** Two published modules (one with a reviewed mission) and a draft module that shouldn't count. */
async function seedCourse(t: TestConvex, editor: Actor, trackId: Id<"tracks">) {
  const unitId = await editor.mutation(api.curriculumEditor.createUnit, { trackId, title: "Foundations" });

  const first = await editor.mutation(api.curriculumEditor.createModule, { unitId, title: "UX" });
  const lessonA = await editor.mutation(api.curriculumEditor.createLesson, { moduleId: first.moduleId, title: "Trust" });
  await editor.mutation(api.curriculumEditor.setModuleStatus, { moduleId: first.moduleId, status: "published" });
  const missionId = await editor.mutation(api.missionsEditor.createMission, { moduleId: first.moduleId, title: "Wallet audit" });

  const second = await editor.mutation(api.curriculumEditor.createModule, { unitId, title: "Errors" });
  const lessonB = await editor.mutation(api.curriculumEditor.createLesson, { moduleId: second.moduleId, title: "Anatomy" });
  await editor.mutation(api.curriculumEditor.setModuleStatus, { moduleId: second.moduleId, status: "published" });

  const draft = await editor.mutation(api.curriculumEditor.createModule, { unitId, title: "WIP" });
  await editor.mutation(api.curriculumEditor.createLesson, { moduleId: draft.moduleId, title: "Draft lesson" });

  await t.finishAllScheduledFunctions(vi.runAllTimers);
  return { lessonA, lessonB, missionId, firstModuleId: first.moduleId };
}

async function certificatesIn(t: TestConvex) {
  return await t.run((ctx) => ctx.db.query("certificates").collect());
}

describe("certificates", () => {
  test("issued once, when every published module is complete", async () => {
    const t = setup();
    const { lead, student, trackId, cohortId } = await seedTrack(t);
    const { lessonA, lessonB, missionId } = await seedCourse(t, lead.as, trackId);

    await student.as.mutation(api.curriculum.setLessonComplete, { lessonId: lessonA, complete: true });
    await student.as.mutation(api.curriculum.setLessonComplete, { lessonId: lessonB, complete: true });
    const result = await student.as.mutation(api.missions.submit, { missionId, linkUrl: "https://figma.com/x" });
    if (!result.ok) throw new Error(result.error);
    expect(await certificatesIn(t)).toHaveLength(0);

    await lead.as.mutation(api.reviews.review, { submissionId: result.submissionId, outcome: "passed", comment: "Great" });
    const [certificate, ...rest] = await certificatesIn(t);
    expect(rest).toHaveLength(0);
    expect(certificate).toMatchObject({ userId: student.userId, trackId, cohortId });
    expect(certificate.code).toMatch(/^BD-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);

    const notes = await t.run((ctx) => ctx.db.query("notifications").collect());
    expect(notes.find((n) => n.type === "certificate")).toMatchObject({
      userId: student.userId,
      link: `/certificates/${certificate.code}`,
    });

    await student.as.mutation(api.curriculum.setLessonComplete, { lessonId: lessonB, complete: false });
    await student.as.mutation(api.curriculum.setLessonComplete, { lessonId: lessonB, complete: true });
    expect(await certificatesIn(t)).toHaveLength(1);

    expect(await student.as.query(api.certificates.mine, {})).toEqual([
      expect.objectContaining({ code: certificate.code, trackName: "Design Lab", cohortName: "Cohort 01" }),
    ]);
  });

  test("staff working through the course don't get certificates", async () => {
    const t = setup();
    const { lead, trackId } = await seedTrack(t);
    const { lessonB, firstModuleId } = await seedCourse(t, lead.as, trackId);
    await t.run((ctx) => ctx.db.insert("moduleCompletions", { userId: lead.userId, moduleId: firstModuleId, trackId }));
    await lead.as.mutation(api.curriculum.setLessonComplete, { lessonId: lessonB, complete: true });
    expect(await certificatesIn(t)).toHaveLength(0);
  });

  test("anyone can verify a certificate by code, without seeing the email", async () => {
    const t = setup();
    const { student, trackId, cohortId } = await seedTrack(t);
    await t.run((ctx) =>
      ctx.db.insert("certificates", {
        userId: student.userId,
        trackId,
        cohortId,
        code: "BD-ABCD-EFGH-JKLM",
        issuedAt: Date.UTC(2027, 2, 1),
      }),
    );

    const found = await t.query(api.certificates.getByCode, { code: "bd-abcd-efgh-jklm" });
    expect(found).toEqual({
      code: "BD-ABCD-EFGH-JKLM",
      fullName: "student",
      trackName: "Design Lab",
      cohortName: "Cohort 01",
      issuedAt: Date.UTC(2027, 2, 1),
    });
    expect(await t.query(api.certificates.getByCode, { code: "BD-ZZZZ-ZZZZ-ZZZZ" })).toBeNull();
    expect(await t.query(api.certificates.getByCode, { code: "not a code" })).toBeNull();
    expect(await t.query(api.certificates.mine, {})).toEqual([]);
  });
});

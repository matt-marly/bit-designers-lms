import { describe, expect, test, vi } from "vitest";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { createUser, seedTrack, setup, type TestConvex } from "./test.setup";

type Actor = Awaited<ReturnType<typeof createUser>>["as"];

/** One unit with two published modules (two lessons, then one) and a draft module. */
async function seedCurriculum(t: TestConvex, editor: Actor, trackId: Id<"tracks">) {
  const unitId = await editor.mutation(api.curriculumEditor.createUnit, { trackId, title: "Foundations" });

  const first = await editor.mutation(api.curriculumEditor.createModule, { unitId, title: "Visual Hierarchy" });
  const lessonA = await editor.mutation(api.curriculumEditor.createLesson, { moduleId: first.moduleId, title: "Scale" });
  const lessonB = await editor.mutation(api.curriculumEditor.createLesson, { moduleId: first.moduleId, title: "Contrast" });
  await editor.mutation(api.curriculumEditor.setModuleStatus, { moduleId: first.moduleId, status: "published" });

  const second = await editor.mutation(api.curriculumEditor.createModule, { unitId, title: "Typography" });
  const lessonC = await editor.mutation(api.curriculumEditor.createLesson, { moduleId: second.moduleId, title: "Type Scale" });
  await editor.mutation(api.curriculumEditor.setModuleStatus, { moduleId: second.moduleId, status: "published" });

  const draft = await editor.mutation(api.curriculumEditor.createModule, { unitId, title: "Color (WIP)" });
  await editor.mutation(api.curriculumEditor.createLesson, { moduleId: draft.moduleId, title: "Palettes" });

  return { unitId, first, second, draft, lessonA, lessonB, lessonC };
}

describe("who can edit curriculum", () => {
  test("the lead and platform content managers can edit; co-mentors without track.content and students can't", async () => {
    const t = setup();
    const { lead, coMentor, student, trackId } = await seedTrack(t);
    const platformMentor = await createUser(t, { email: "pm@test.dev", platformRole: "platform_mentor" });

    await lead.as.mutation(api.curriculumEditor.createUnit, { trackId, title: "From the lead" });
    await platformMentor.as.mutation(api.curriculumEditor.createUnit, { trackId, title: "From a platform mentor" });

    await expect(coMentor.as.mutation(api.curriculumEditor.createUnit, { trackId, title: "Nope" })).rejects.toThrow(
      /Not authorized/,
    );
    await expect(student.as.mutation(api.curriculumEditor.createUnit, { trackId, title: "Nope" })).rejects.toThrow(
      /Not authorized/,
    );
    await expect(student.as.query(api.curriculumEditor.outline, { trackId })).rejects.toThrow(/Not authorized/);
  });

  test("a lead can't edit another track's curriculum", async () => {
    const t = setup();
    const { lead, admin, otherTrackId } = await seedTrack(t);
    const unitId = await admin.as.mutation(api.curriculumEditor.createUnit, { trackId: otherTrackId, title: "OSS" });

    await expect(
      lead.as.mutation(api.curriculumEditor.createModule, { unitId, title: "Sneaky" }),
    ).rejects.toThrow(/Not authorized/);
  });

  test("listEditableTracks only lists tracks the caller can edit", async () => {
    const t = setup();
    const { lead, coMentor, admin } = await seedTrack(t);

    expect((await lead.as.query(api.curriculumEditor.listEditableTracks, {})).map((tr) => tr.name)).toEqual([
      "Design Lab",
    ]);
    expect(await coMentor.as.query(api.curriculumEditor.listEditableTracks, {})).toEqual([]);
    expect((await admin.as.query(api.curriculumEditor.listEditableTracks, {})).map((tr) => tr.name)).toEqual([
      "Design Lab",
      "Open Source Lab",
    ]);
  });

  test("archived tracks can't get new units", async () => {
    const t = setup();
    const { admin, trackId } = await seedTrack(t);
    await t.run((ctx) => ctx.db.patch("tracks", trackId, { status: "archived" }));

    await expect(admin.as.mutation(api.curriculumEditor.createUnit, { trackId, title: "Late" })).rejects.toThrow(
      /Restore this track/,
    );
  });
});

describe("editing rules", () => {
  test("a module needs a lesson before it can be published", async () => {
    const t = setup();
    const { lead, trackId } = await seedTrack(t);
    const unitId = await lead.as.mutation(api.curriculumEditor.createUnit, { trackId, title: "Unit" });
    const { moduleId } = await lead.as.mutation(api.curriculumEditor.createModule, { unitId, title: "Empty" });

    await expect(
      lead.as.mutation(api.curriculumEditor.setModuleStatus, { moduleId, status: "published" }),
    ).rejects.toThrow(/at least one lesson/);
  });

  test("deleting a module's last lesson puts it back in draft", async () => {
    const t = setup();
    const { lead, trackId } = await seedTrack(t);
    const { second, lessonC } = await seedCurriculum(t, lead.as, trackId);

    await lead.as.mutation(api.curriculumEditor.deleteLesson, { lessonId: lessonC });
    const mod = await t.run((ctx) => ctx.db.get("modules", second.moduleId));
    expect(mod).toMatchObject({ lessonCount: 0, status: "draft" });
  });

  test("units and modules must be empty before they can be deleted", async () => {
    const t = setup();
    const { lead, trackId } = await seedTrack(t);
    const { unitId, first } = await seedCurriculum(t, lead.as, trackId);

    await expect(lead.as.mutation(api.curriculumEditor.deleteUnit, { unitId })).rejects.toThrow(/modules first/);
    await expect(
      lead.as.mutation(api.curriculumEditor.deleteModule, { moduleId: first.moduleId }),
    ).rejects.toThrow(/lessons first/);
  });

  test("module slugs are unique across tracks; lesson slugs are unique within a module", async () => {
    const t = setup();
    const { admin, trackId, otherTrackId } = await seedTrack(t);
    const unitA = await admin.as.mutation(api.curriculumEditor.createUnit, { trackId, title: "A" });
    const unitB = await admin.as.mutation(api.curriculumEditor.createUnit, { trackId: otherTrackId, title: "B" });

    const one = await admin.as.mutation(api.curriculumEditor.createModule, { unitId: unitA, title: "Getting Started" });
    const two = await admin.as.mutation(api.curriculumEditor.createModule, { unitId: unitB, title: "Getting started!" });
    expect(one.slug).toBe("getting-started");
    expect(two.slug).toBe("getting-started-2");

    await admin.as.mutation(api.curriculumEditor.createLesson, { moduleId: one.moduleId, title: "Intro" });
    await admin.as.mutation(api.curriculumEditor.createLesson, { moduleId: one.moduleId, title: "Intro" });
    await admin.as.mutation(api.curriculumEditor.createLesson, { moduleId: two.moduleId, title: "Intro" });
    const slugsOne = (await admin.as.query(api.curriculumEditor.listLessons, { moduleId: one.moduleId })).map(
      (l) => l.slug,
    );
    const slugsTwo = (await admin.as.query(api.curriculumEditor.listLessons, { moduleId: two.moduleId })).map(
      (l) => l.slug,
    );
    expect(slugsOne).toEqual(["intro", "intro-2"]);
    expect(slugsTwo).toEqual(["intro"]);
  });

  test("moving swaps neighbours and stops at the ends", async () => {
    const t = setup();
    const { lead, trackId } = await seedTrack(t);
    const { unitId, first, second } = await seedCurriculum(t, lead.as, trackId);

    await lead.as.mutation(api.curriculumEditor.moveModule, { moduleId: second.moduleId, direction: "up" });
    await lead.as.mutation(api.curriculumEditor.moveModule, { moduleId: second.moduleId, direction: "up" });
    const outline = await lead.as.query(api.curriculumEditor.outline, { trackId });
    const unit = outline.find((u) => u._id === unitId);
    expect(unit?.modules.map((m) => m._id).slice(0, 2)).toEqual([second.moduleId, first.moduleId]);
  });

  test("video links must be full http(s) URLs", async () => {
    const t = setup();
    const { lead, trackId } = await seedTrack(t);
    const { lessonA } = await seedCurriculum(t, lead.as, trackId);

    await expect(
      lead.as.mutation(api.curriculumEditor.updateLesson, { lessonId: lessonA, videoUrl: "javascript:alert(1)" }),
    ).rejects.toThrow(/full video link/);
    await lead.as.mutation(api.curriculumEditor.updateLesson, {
      lessonId: lessonA,
      videoUrl: "https://youtu.be/abc123",
      body: "# Scale\n\nBigger things read first.",
    });
    const lesson = await lead.as.query(api.curriculumEditor.getLesson, { lessonId: lessonA });
    expect(lesson).toMatchObject({ videoUrl: "https://youtu.be/abc123", body: "# Scale\n\nBigger things read first." });
  });
});

describe("what learners see", () => {
  test("students see only published modules, numbered without gaps", async () => {
    const t = setup();
    const { lead, student, trackId } = await seedTrack(t);
    await seedCurriculum(t, lead.as, trackId);

    const asStudent = await student.as.query(api.curriculum.overview, { trackId });
    expect(asStudent.canEdit).toBe(false);
    expect(asStudent.units[0].modules.map((m) => [m.number, m.title])).toEqual([
      ["01", "Visual Hierarchy"],
      ["02", "Typography"],
    ]);
    expect(asStudent.totals).toEqual({ modules: 2, completedModules: 0 });

    const asLead = await lead.as.query(api.curriculum.overview, { trackId });
    expect(asLead.canEdit).toBe(true);
    expect(asLead.units[0].modules.map((m) => m.status)).toEqual(["published", "published", "draft"]);
    expect(asLead.totals.modules).toBe(2);
  });

  test("drafts can't be opened by slug or completed by students", async () => {
    const t = setup();
    const { lead, student, trackId } = await seedTrack(t);
    const { draft } = await seedCurriculum(t, lead.as, trackId);
    const draftLessons = await lead.as.query(api.curriculumEditor.listLessons, { moduleId: draft.moduleId });

    expect(await student.as.query(api.curriculum.getModule, { slug: draft.slug })).toBeNull();
    expect(
      await student.as.query(api.curriculum.getLesson, { moduleSlug: draft.slug, lessonSlug: draftLessons[0].slug }),
    ).toBeNull();
    await expect(
      student.as.mutation(api.curriculum.setLessonComplete, { lessonId: draftLessons[0]._id, complete: true }),
    ).rejects.toThrow(/Lesson not found/);

    const preview = await lead.as.query(api.curriculum.getModule, { slug: draft.slug });
    expect(preview?.module.status).toBe("draft");
  });

  test("people outside the track can't read it; archived tracks are closed to learners", async () => {
    const t = setup();
    const { lead, student, trackId } = await seedTrack(t);
    const { first } = await seedCurriculum(t, lead.as, trackId);
    const outsider = await createUser(t, { email: "outsider@test.dev" });

    await expect(outsider.as.query(api.curriculum.overview, { trackId })).rejects.toThrow(/Not authorized/);
    expect(await outsider.as.query(api.curriculum.getModule, { slug: first.slug })).toBeNull();
    await expect(
      outsider.as.mutation(api.curriculum.setLessonComplete, {
        lessonId: (await lead.as.query(api.curriculumEditor.listLessons, { moduleId: first.moduleId }))[0]._id,
        complete: true,
      }),
    ).rejects.toThrow(/Not authorized/);

    await t.run((ctx) => ctx.db.patch("tracks", trackId, { status: "archived" }));
    await expect(student.as.query(api.curriculum.overview, { trackId })).rejects.toThrow(/archived/);
    expect(await student.as.query(api.curriculum.getModule, { slug: first.slug })).toBeNull();
    expect((await lead.as.query(api.curriculum.overview, { trackId })).units).toHaveLength(1);
  });

  test("lesson pages link to neighbours and to the next module after the last lesson", async () => {
    const t = setup();
    const { lead, student, trackId } = await seedTrack(t);
    const { first, second } = await seedCurriculum(t, lead.as, trackId);

    const firstLesson = await student.as.query(api.curriculum.getLesson, { moduleSlug: first.slug, lessonSlug: "scale" });
    expect(firstLesson).toMatchObject({
      prev: null,
      next: { slug: "contrast", title: "Contrast" },
      nextModule: null,
    });

    const lastLesson = await student.as.query(api.curriculum.getLesson, { moduleSlug: first.slug, lessonSlug: "contrast" });
    expect(lastLesson).toMatchObject({ next: null, nextModule: { slug: second.slug, title: "Typography" } });

    const typography = await student.as.query(api.curriculum.getLesson, {
      moduleSlug: second.slug,
      lessonSlug: "type-scale",
    });
    expect(typography?.nextModule).toBeNull();
    expect(await student.as.query(api.curriculum.getLesson, { moduleSlug: first.slug, lessonSlug: "nope" })).toBeNull();
  });

  test("the editor's lesson query hides lessons from people who can't edit them", async () => {
    const t = setup();
    const { lead, coMentor, trackId } = await seedTrack(t);
    const { lessonA } = await seedCurriculum(t, lead.as, trackId);

    expect(await coMentor.as.query(api.curriculumEditor.getLesson, { lessonId: lessonA })).toBeNull();
    expect((await lead.as.query(api.curriculumEditor.getLesson, { lessonId: lessonA }))?.title).toBe("Scale");
  });
});

describe("progress", () => {
  test("finishing every lesson completes the module; un-marking one reopens it", async () => {
    const t = setup();
    const { lead, student, trackId } = await seedTrack(t);
    const { first, lessonA, lessonB } = await seedCurriculum(t, lead.as, trackId);

    expect(
      await student.as.mutation(api.curriculum.setLessonComplete, { lessonId: lessonA, complete: true }),
    ).toEqual({ moduleComplete: false });
    let overview = await student.as.query(api.curriculum.overview, { trackId });
    expect(overview.units[0].modules[0]).toMatchObject({ progress: "in_progress", completedLessons: 1 });

    expect(
      await student.as.mutation(api.curriculum.setLessonComplete, { lessonId: lessonB, complete: true }),
    ).toEqual({ moduleComplete: true });
    overview = await student.as.query(api.curriculum.overview, { trackId });
    expect(overview.units[0].modules[0]).toMatchObject({ progress: "complete", completedLessons: 2 });
    expect(overview.totals).toEqual({ modules: 2, completedModules: 1 });

    const mod = await student.as.query(api.curriculum.getModule, { slug: first.slug });
    expect(mod?.isComplete).toBe(true);

    await student.as.mutation(api.curriculum.setLessonComplete, { lessonId: lessonA, complete: false });
    overview = await student.as.query(api.curriculum.overview, { trackId });
    expect(overview.units[0].modules[0]).toMatchObject({ progress: "in_progress", completedLessons: 1 });
  });

  test("marking the same lesson twice doesn't double count", async () => {
    const t = setup();
    const { lead, student, trackId } = await seedTrack(t);
    const { lessonA } = await seedCurriculum(t, lead.as, trackId);

    await student.as.mutation(api.curriculum.setLessonComplete, { lessonId: lessonA, complete: true });
    await student.as.mutation(api.curriculum.setLessonComplete, { lessonId: lessonA, complete: true });
    const completions = await t.run((ctx) =>
      ctx.db
        .query("lessonCompletions")
        .withIndex("by_lessonId", (q) => q.eq("lessonId", lessonA))
        .collect(),
    );
    expect(completions).toHaveLength(1);
  });

  test("each learner's progress is their own", async () => {
    const t = setup();
    const { lead, student, trackId, cohortId } = await seedTrack(t);
    const { lessonA } = await seedCurriculum(t, lead.as, trackId);
    const classmate = await createUser(t, { email: "classmate@test.dev" });
    await t.run((ctx) =>
      ctx.db.insert("enrollments", { userId: classmate.userId, trackId, cohortId, status: "active" }),
    );

    await student.as.mutation(api.curriculum.setLessonComplete, { lessonId: lessonA, complete: true });
    const theirs = await classmate.as.query(api.curriculum.overview, { trackId });
    expect(theirs.units[0].modules[0]).toMatchObject({ progress: "not_started", completedLessons: 0 });
  });

  test("getModule points at the first unfinished lesson and flags an unfinished previous module", async () => {
    const t = setup();
    const { lead, student, trackId } = await seedTrack(t);
    const { first, second, lessonA } = await seedCurriculum(t, lead.as, trackId);

    let mod = await student.as.query(api.curriculum.getModule, { slug: first.slug });
    expect(mod).toMatchObject({ continueLessonSlug: "scale", previousIncomplete: null });

    await student.as.mutation(api.curriculum.setLessonComplete, { lessonId: lessonA, complete: true });
    mod = await student.as.query(api.curriculum.getModule, { slug: first.slug });
    expect(mod?.continueLessonSlug).toBe("contrast");

    const next = await student.as.query(api.curriculum.getModule, { slug: second.slug });
    expect(next?.previousIncomplete).toEqual({ slug: first.slug, title: "Visual Hierarchy" });
  });

  test("home shows the cohort and the next lesson to do", async () => {
    const t = setup();
    const { lead, student, trackId } = await seedTrack(t);
    const { lessonA, lessonB, second } = await seedCurriculum(t, lead.as, trackId);

    let home = await student.as.query(api.curriculum.home, { trackId });
    expect(home.cohort?.name).toBe("Cohort 01");
    expect(home.modules).toEqual({ total: 2, completed: 0 });
    expect(home.next).toMatchObject({ moduleTitle: "Visual Hierarchy", lessonSlug: "scale", completedLessons: 0 });

    await student.as.mutation(api.curriculum.setLessonComplete, { lessonId: lessonA, complete: true });
    await student.as.mutation(api.curriculum.setLessonComplete, { lessonId: lessonB, complete: true });
    home = await student.as.query(api.curriculum.home, { trackId });
    expect(home.modules).toEqual({ total: 2, completed: 1 });
    expect(home.next).toMatchObject({ moduleSlug: second.slug, lessonSlug: "type-scale" });
  });

  test("deleting a lesson cleans up everyone's completions for it", async () => {
    vi.useFakeTimers();
    try {
      const t = setup();
      const { lead, student, trackId } = await seedTrack(t);
      const { lessonC } = await seedCurriculum(t, lead.as, trackId);
      await student.as.mutation(api.curriculum.setLessonComplete, { lessonId: lessonC, complete: true });

      await lead.as.mutation(api.curriculumEditor.deleteLesson, { lessonId: lessonC });
      await t.finishAllScheduledFunctions(vi.runAllTimers);

      const leftovers = await t.run((ctx) =>
        ctx.db
          .query("lessonCompletions")
          .withIndex("by_lessonId", (q) => q.eq("lessonId", lessonC))
          .collect(),
      );
      expect(leftovers).toEqual([]);
    } finally {
      vi.useRealTimers();
    }
  });
});

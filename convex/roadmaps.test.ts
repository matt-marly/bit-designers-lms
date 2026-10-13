import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { createUser, seedTrack, setup, type TestConvex } from "./test.setup";

type Actor = Awaited<ReturnType<typeof createUser>>["as"];

async function seedPublishedCurriculum(t: TestConvex, editor: Actor, trackId: Id<"tracks">) {
  const unitId = await editor.mutation(api.curriculumEditor.createUnit, { trackId, title: "Foundations" });
  const first = await editor.mutation(api.curriculumEditor.createModule, { unitId, title: "Visual Hierarchy" });
  await editor.mutation(api.curriculumEditor.createLesson, { moduleId: first.moduleId, title: "Scale" });
  await editor.mutation(api.curriculumEditor.setModuleStatus, { moduleId: first.moduleId, status: "published" });
  const second = await editor.mutation(api.curriculumEditor.createModule, { unitId, title: "Typography" });
  await editor.mutation(api.curriculumEditor.createLesson, { moduleId: second.moduleId, title: "Type Scale" });
  await editor.mutation(api.curriculumEditor.setModuleStatus, { moduleId: second.moduleId, status: "published" });
  return { unitId, first, second };
}

describe("track roadmaps", () => {
  test("generate builds nodes from published modules; drafts stay hidden until published", async () => {
    const t = setup();
    const { lead, student, trackId } = await seedTrack(t);
    await seedPublishedCurriculum(t, lead.as, trackId);

    const { roadmapId, slug } = await lead.as.mutation(api.roadmapEditor.createRoadmap, {
      title: "Design Path",
      trackId,
    });
    const generated = await lead.as.mutation(api.roadmapEditor.generateFromTrack, { roadmapId });
    expect(generated.nodes).toBe(2);

    // Draft: student sees nothing, lead sees it.
    expect(await student.as.query(api.roadmaps.list, {})).toEqual([]);
    expect(await student.as.query(api.roadmaps.getBySlug, { slug })).toBeNull();
    const draftView = await lead.as.query(api.roadmaps.getBySlug, { slug });
    expect(draftView?.lanes[0]?.nodes).toHaveLength(2);

    await lead.as.mutation(api.roadmapEditor.setStatus, { roadmapId, status: "published" });
    const list = await student.as.query(api.roadmaps.list, {});
    expect(list.map((r) => r.slug)).toContain(slug);
    const view = await student.as.query(api.roadmaps.getBySlug, { slug });
    expect(view?.totals.nodes).toBe(2);
    expect(view?.lanes[0]?.name).toBe("Foundations");
  });

  test("students and unauthorized co-mentors can't edit roadmaps", async () => {
    const t = setup();
    const { lead, coMentor, student, trackId } = await seedTrack(t);

    await expect(
      student.as.mutation(api.roadmapEditor.createRoadmap, { title: "Nope", trackId }),
    ).rejects.toThrow(/Not authorized/);
    await expect(
      coMentor.as.mutation(api.roadmapEditor.createRoadmap, { title: "Nope", trackId }),
    ).rejects.toThrow(/Not authorized/);

    const { roadmapId } = await lead.as.mutation(api.roadmapEditor.createRoadmap, {
      title: "Design Path",
      trackId,
    });
    await expect(
      student.as.mutation(api.roadmapEditor.setStatus, { roadmapId, status: "published" }),
    ).rejects.toThrow(/Not authorized/);
  });

  test("sync keeps custom nodes and drops deleted modules", async () => {
    const t = setup();
    const { lead, trackId } = await seedTrack(t);
    const { first } = await seedPublishedCurriculum(t, lead.as, trackId);

    const { roadmapId, slug } = await lead.as.mutation(api.roadmapEditor.createRoadmap, {
      title: "Design Path",
      trackId,
    });
    await lead.as.mutation(api.roadmapEditor.generateFromTrack, { roadmapId });
    await lead.as.mutation(api.roadmapEditor.addCustomNode, {
      roadmapId,
      title: "Read the whitepaper",
      lane: "Foundations",
    });
    await lead.as.mutation(api.roadmapEditor.setStatus, { roadmapId, status: "published" });

    // Deleting a module requires removing its lesson first (editor rule).
    const lessons = await t.run((ctx) =>
      ctx.db
        .query("lessons")
        .withIndex("by_moduleId_and_sortOrder", (q) => q.eq("moduleId", first.moduleId))
        .collect(),
    );
    for (const lesson of lessons) {
      await lead.as.mutation(api.curriculumEditor.deleteLesson, { lessonId: lesson._id });
    }
    await lead.as.mutation(api.curriculumEditor.deleteModule, { moduleId: first.moduleId });

    const synced = await lead.as.mutation(api.roadmapEditor.syncFromTrack, { roadmapId });
    expect(synced.removed).toBe(1);
    expect(synced.added).toBe(0);

    const view = await lead.as.query(api.roadmaps.getBySlug, { slug });
    const titles = view?.lanes.flatMap((l) => l.nodes.map((n) => n.title)) ?? [];
    expect(titles).toContain("Read the whitepaper");
    expect(titles).not.toContain("Visual Hierarchy");
  });
});

describe("global guides", () => {
  test("platform content managers can publish guides; students see them once published", async () => {
    const t = setup();
    const { admin, student } = await seedTrack(t);

    const { slug, roadmapId } = await admin.as.mutation(api.roadmapEditor.createRoadmap, {
      title: "Bitcoin Basics",
    });
    await admin.as.mutation(api.roadmapEditor.addCustomNode, {
      roadmapId,
      title: "What is money?",
      url: "https://example.com/money",
    });
    expect(await student.as.query(api.roadmaps.getBySlug, { slug })).toBeNull();

    await admin.as.mutation(api.roadmapEditor.setStatus, { roadmapId, status: "published" });
    const view = await student.as.query(api.roadmaps.getBySlug, { slug });
    expect(view?.lanes[0]?.nodes[0]?.href).toBe("https://example.com/money");
  });

  test("a plain member can't create guides", async () => {
    const t = setup();
    const { student } = await seedTrack(t);
    await expect(
      student.as.mutation(api.roadmapEditor.createRoadmap, { title: "Nope" }),
    ).rejects.toThrow(/Not authorized/);
  });
});

describe("node management", () => {
  test("badges update and nodes reorder within a lane", async () => {
    const t = setup();
    const { admin } = await seedTrack(t);
    const { roadmapId, slug } = await admin.as.mutation(api.roadmapEditor.createRoadmap, {
      title: "Guide",
    });
    const first = await admin.as.mutation(api.roadmapEditor.addCustomNode, {
      roadmapId,
      title: "First",
      lane: "Start",
    });
    await admin.as.mutation(api.roadmapEditor.addCustomNode, {
      roadmapId,
      title: "Second",
      lane: "Start",
    });
    await admin.as.mutation(api.roadmapEditor.updateNode, { nodeId: first, badge: "optional" });
    await admin.as.mutation(api.roadmapEditor.setStatus, { roadmapId, status: "published" });

    const before = await admin.as.query(api.roadmaps.getBySlug, { slug });
    expect(before?.lanes[0]?.nodes.map((n) => n.title)).toEqual(["First", "Second"]);

    await admin.as.mutation(api.roadmapEditor.moveNode, { nodeId: first, direction: "down" });
    const after = await admin.as.query(api.roadmaps.getBySlug, { slug });
    expect(after?.lanes[0]?.nodes.map((n) => n.title)).toEqual(["Second", "First"]);
    expect(after?.lanes[0]?.nodes[1]?.badge).toBe("optional");
  });
});

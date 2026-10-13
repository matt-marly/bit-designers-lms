import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { createUser, seedTrack, setup, type TestConvex } from "./test.setup";

type Actor = Awaited<ReturnType<typeof createUser>>["as"];

async function seedRoadmap(t: TestConvex, editor: Actor, trackId: Id<"tracks">) {
  const unitId = await editor.mutation(api.curriculumEditor.createUnit, { trackId, title: "Foundations" });
  const first = await editor.mutation(api.curriculumEditor.createModule, { unitId, title: "Visual Hierarchy" });
  const lessonA = await editor.mutation(api.curriculumEditor.createLesson, { moduleId: first.moduleId, title: "Scale" });
  await editor.mutation(api.curriculumEditor.setModuleStatus, { moduleId: first.moduleId, status: "published" });
  const { roadmapId, slug } = await editor.mutation(api.roadmapEditor.createRoadmap, {
    title: "Design Path",
    trackId,
  });
  await editor.mutation(api.roadmapEditor.generateFromTrack, { roadmapId });
  await editor.mutation(api.roadmapEditor.setStatus, { roadmapId, status: "published" });
  return { roadmapId, slug, moduleId: first.moduleId, lessonA };
}

describe("explicit node states", () => {
  test("marking done counts as complete without touching lesson records", async () => {
    const t = setup();
    const { lead, student, trackId } = await seedTrack(t);
    const { slug } = await seedRoadmap(t, lead.as, trackId);

    const before = await student.as.query(api.roadmaps.getBySlug, { slug });
    expect(before?.totals.completedNodes).toBe(0);

    const nodeId = before?.lanes[0]?.nodes[0]?._id;
    expect(nodeId).toBeDefined();
    await student.as.mutation(api.roadmapProgress.setNodeState, { nodeId: nodeId!, state: "done" });

    const after = await student.as.query(api.roadmaps.getBySlug, { slug });
    expect(after?.totals.completedNodes).toBe(1);
    expect(after?.lanes[0]?.nodes[0]?.state).toBe("done");
    // No lesson completion row was created.
    expect(
      await t.run((ctx) => ctx.db.query("lessonCompletions").collect()),
    ).toHaveLength(0);
  });

  test("skipped nodes are excluded from totals even when derived complete", async () => {
    const t = setup();
    const { lead, student, trackId } = await seedTrack(t);
    const { slug, lessonA } = await seedRoadmap(t, lead.as, trackId);

    // Complete the only lesson so the module is derived complete.
    await student.as.mutation(api.curriculum.setLessonComplete, { lessonId: lessonA, complete: true });
    const derived = await student.as.query(api.roadmaps.getBySlug, { slug });
    expect(derived?.totals.completedNodes).toBe(1);

    const nodeId = derived?.lanes[0]?.nodes[0]?._id;
    await student.as.mutation(api.roadmapProgress.setNodeState, { nodeId: nodeId!, state: "skipped" });
    const skipped = await student.as.query(api.roadmaps.getBySlug, { slug });
    expect(skipped?.totals.completedNodes).toBe(0);
    expect(skipped?.lanes[0]?.nodes[0]?.state).toBe("skipped");
  });

  test("resetting to learning removes the override", async () => {
    const t = setup();
    const { lead, student, trackId } = await seedTrack(t);
    const { slug } = await seedRoadmap(t, lead.as, trackId);
    const nodeId = (await student.as.query(api.roadmaps.getBySlug, { slug }))?.lanes[0]?.nodes[0]?._id;

    await student.as.mutation(api.roadmapProgress.setNodeState, { nodeId: nodeId!, state: "done" });
    await student.as.mutation(api.roadmapProgress.setNodeState, { nodeId: nodeId!, state: "learning" });
    const view = await student.as.query(api.roadmaps.getBySlug, { slug });
    expect(view?.lanes[0]?.nodes[0]?.state).toBe("learning");
    expect(view?.totals.completedNodes).toBe(0);
    expect(await t.run((ctx) => ctx.db.query("roadmapNodeStates").collect())).toHaveLength(0);
  });

  test("non-viewers and signed-out callers can't set states", async () => {
    const t = setup();
    const { lead, trackId } = await seedTrack(t);
    const outsider = await createUser(t, { email: "outsider@test.dev" });
    const { slug } = await seedRoadmap(t, lead.as, trackId);
    const nodeId = (await lead.as.query(api.roadmaps.getBySlug, { slug }))?.lanes[0]?.nodes[0]?._id;

    await expect(
      outsider.as.mutation(api.roadmapProgress.setNodeState, { nodeId: nodeId!, state: "done" }),
    ).rejects.toThrow(/Not authorized/);
    await expect(
      t.mutation(api.roadmapProgress.setNodeState, { nodeId: nodeId!, state: "done" }),
    ).rejects.toThrow(/Not authenticated/);
  });
});

describe("getNodeDetail", () => {
  test("module nodes resolve lessons, objectives, and a start link", async () => {
    const t = setup();
    const { lead, student, trackId } = await seedTrack(t);
    const { slug } = await seedRoadmap(t, lead.as, trackId);
    const nodeId = (await student.as.query(api.roadmaps.getBySlug, { slug }))?.lanes[0]?.nodes[0]?._id;

    const detail = await student.as.query(api.roadmapProgress.getNodeDetail, {
      roadmapSlug: slug,
      nodeId: nodeId!,
    });
    expect(detail?.detail?.kind).toBe("module");
    expect(detail?.detail?.href).toMatch(/^\/learn\//);
    expect(detail?.detail?.lessons).toHaveLength(1);
    expect(detail?.detail?.lessons[0]?.completed).toBe(false);
    expect(detail?.node.state).toBe("learning");
  });

  test("returns null for unknown roadmaps, foreign nodes, and signed-out callers", async () => {
    const t = setup();
    const { admin, lead, trackId } = await seedTrack(t);
    const { slug, roadmapId } = await seedRoadmap(t, lead.as, trackId);
    const nodeId = (await lead.as.query(api.roadmaps.getBySlug, { slug }))?.lanes[0]?.nodes[0]?._id;

    expect(await lead.as.query(api.roadmapProgress.getNodeDetail, { roadmapSlug: "nope", nodeId: nodeId! })).toBeNull();
    const other = await admin.as.mutation(api.roadmapEditor.createRoadmap, { title: "Other" });
    const foreign = await admin.as.mutation(api.roadmapEditor.addCustomNode, { roadmapId: other.roadmapId, title: "X" });
    expect(
      await lead.as.query(api.roadmapProgress.getNodeDetail, { roadmapSlug: slug, nodeId: foreign }),
    ).toBeNull();
    expect(
      await t.query(api.roadmapProgress.getNodeDetail, { roadmapSlug: slug, nodeId: nodeId! }),
    ).toBeNull();
    void roadmapId;
  });
});

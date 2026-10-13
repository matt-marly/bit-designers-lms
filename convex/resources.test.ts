import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import { createCohort, createUser, enroll, seedTrack, setup, storeFile } from "./test.setup";

const link = {
  category: "core",
  title: "Bitcoin Design Guide",
  resourceType: "link" as const,
  url: "https://bitcoin.design/guide",
  meta: "20 min",
};

describe("resources", () => {
  test("only resources.manage can add, edit or remove", async () => {
    const t = setup();
    const { admin, lead, student } = await seedTrack(t);

    await expect(lead.as.mutation(api.resources.create, { kind: "material", ...link })).rejects.toThrow(/Not authorized/);
    await expect(student.as.mutation(api.resources.create, { kind: "material", ...link })).rejects.toThrow(/Not authorized/);
    const result = await admin.as.mutation(api.resources.create, { kind: "material", ...link });
    if (!result.ok) throw new Error(result.error);

    await expect(lead.as.mutation(api.resources.remove, { resourceId: result.resourceId })).rejects.toThrow(/Not authorized/);
    await admin.as.mutation(api.resources.remove, { resourceId: result.resourceId });
  });

  test("track-specific resources are visible only to that track", async () => {
    const t = setup();
    const { admin, student, trackId, otherTrackId } = await seedTrack(t);
    const otherCohort = await createCohort(t, otherTrackId);
    const elsewhere = await createUser(t, { email: "elsewhere@test.dev" });
    await enroll(t, elsewhere.userId, otherTrackId, otherCohort);

    await admin.as.mutation(api.resources.create, { kind: "material", ...link, title: "For everyone" });
    await admin.as.mutation(api.resources.create, { kind: "material", ...link, title: "Design Lab only", trackId });

    const mine = await student.as.query(api.resources.list, { kind: "material", trackId });
    expect(mine.map((r) => r.title).sort()).toEqual(["Design Lab only", "For everyone"]);

    const theirs = await elsewhere.as.query(api.resources.list, { kind: "material", trackId: otherTrackId });
    expect(theirs.map((r) => r.title)).toEqual(["For everyone"]);

    const snooping = await elsewhere.as.query(api.resources.list, { kind: "material", trackId });
    expect(snooping.map((r) => r.title)).toEqual(["For everyone"]);
  });

  test("validates sections, links and kinds", async () => {
    const t = setup();
    const { admin } = await seedTrack(t);

    await expect(admin.as.mutation(api.resources.create, { kind: "material", ...link, category: "nope" })).rejects.toThrow(
      /section/,
    );
    await expect(
      admin.as.mutation(api.resources.create, { kind: "material", ...link, url: "javascript:alert(1)" }),
    ).rejects.toThrow();
    await expect(
      admin.as.mutation(api.resources.create, {
        kind: "reference",
        category: "foundations",
        title: "A PDF",
        resourceType: "file",
        fileId: await storeFile(t, "application/pdf"),
      }),
    ).resolves.toMatchObject({ ok: false, error: "References must be links" });
  });

  test("PDF uploads are checked, and files are deleted with their resource", async () => {
    const t = setup();
    const { admin, student, trackId } = await seedTrack(t);

    const png = await storeFile(t, "image/png");
    expect(
      await admin.as.mutation(api.resources.create, {
        kind: "material",
        category: "core",
        title: "Not a PDF",
        resourceType: "file",
        fileId: png,
      }),
    ).toEqual({ ok: false, error: "Upload a PDF" });
    expect(await t.run((ctx) => ctx.storage.getUrl(png))).toBeNull();

    const pdf = await storeFile(t, "application/pdf");
    const result = await admin.as.mutation(api.resources.create, {
      kind: "material",
      category: "core",
      title: "Field guide",
      resourceType: "file",
      fileId: pdf,
      fileName: "guide.pdf",
    });
    if (!result.ok) throw new Error(result.error);
    const [item] = await student.as.query(api.resources.list, { kind: "material", trackId });
    expect(item).toMatchObject({ resourceType: "file", fileName: "guide.pdf" });
    expect(item.url).not.toBeNull();

    await admin.as.mutation(api.resources.remove, { resourceId: result.resourceId });
    expect(await t.run((ctx) => ctx.storage.getUrl(pdf))).toBeNull();
  });

  test("move reorders within a section", async () => {
    const t = setup();
    const { admin, student, trackId } = await seedTrack(t);
    await admin.as.mutation(api.resources.create, { kind: "material", ...link, title: "First" });
    const second = await admin.as.mutation(api.resources.create, { kind: "material", ...link, title: "Second" });
    if (!second.ok) throw new Error(second.error);

    await admin.as.mutation(api.resources.move, { resourceId: second.resourceId, direction: "up" });
    const items = await student.as.query(api.resources.list, { kind: "material", trackId });
    expect(items.map((r) => r.title)).toEqual(["Second", "First"]);
  });
});

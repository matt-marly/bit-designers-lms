import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { api } from "./_generated/api";
import { seedTrack, setup, storeFile } from "./test.setup";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(Date.UTC(2027, 0, 10));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("profile", () => {
  test("updates name, bio, portfolio and showcase preference", async () => {
    const t = setup();
    const { student } = await seedTrack(t);

    await student.as.mutation(api.users.updateProfile, {
      fullName: "  Ada Obi ",
      bio: "Designing for Lightning.",
      portfolioUrl: "https://ada.design",
      showInShowcase: false,
    });
    const me = await student.as.query(api.users.me, {});
    expect(me?.user).toMatchObject({
      fullName: "Ada Obi",
      bio: "Designing for Lightning.",
      portfolioUrl: "https://ada.design",
      showInShowcase: false,
    });

    await student.as.mutation(api.users.updateProfile, { bio: "", portfolioUrl: "" });
    const cleared = await student.as.query(api.users.me, {});
    expect(cleared?.user.bio).toBeUndefined();
    expect(cleared?.user.portfolioUrl).toBeUndefined();
  });

  test("rejects unsafe or oversized values", async () => {
    const t = setup();
    const { student } = await seedTrack(t);

    await expect(student.as.mutation(api.users.updateProfile, { portfolioUrl: "javascript:alert(1)" })).rejects.toThrow();
    await expect(student.as.mutation(api.users.updateProfile, { fullName: "   " })).rejects.toThrow();
    await expect(student.as.mutation(api.users.updateProfile, { bio: "x".repeat(601) })).rejects.toThrow();
  });

  test("avatar uploads are validated and replaced files are deleted", async () => {
    const t = setup();
    const { student } = await seedTrack(t);

    const gif = await storeFile(t, "image/gif");
    expect(await student.as.mutation(api.users.setAvatar, { fileId: gif })).toEqual({
      ok: false,
      error: "Use a PNG, JPG or WebP image",
    });
    expect(await t.run((ctx) => ctx.storage.getUrl(gif))).toBeNull();

    const huge = await storeFile(t, "image/png", 2 * 1024 * 1024 + 1);
    expect(await student.as.mutation(api.users.setAvatar, { fileId: huge })).toMatchObject({ ok: false });

    const first = await storeFile(t, "image/png");
    expect(await student.as.mutation(api.users.setAvatar, { fileId: first })).toEqual({ ok: true });
    expect((await student.as.query(api.users.me, {}))?.avatarUrl).not.toBeNull();

    const second = await storeFile(t, "image/webp");
    await student.as.mutation(api.users.setAvatar, { fileId: second });
    expect(await t.run((ctx) => ctx.storage.getUrl(first))).toBeNull();

    await student.as.mutation(api.users.setAvatar, { fileId: null });
    expect(await t.run((ctx) => ctx.storage.getUrl(second))).toBeNull();
    expect((await student.as.query(api.users.me, {}))?.avatarUrl).toBeNull();
  });

  test("onboarding is recorded once", async () => {
    const t = setup();
    const { student } = await seedTrack(t);

    expect((await student.as.query(api.users.me, {}))?.user.onboardedAt).toBeUndefined();
    await student.as.mutation(api.users.completeOnboarding, {});
    const first = (await student.as.query(api.users.me, {}))?.user.onboardedAt;
    expect(first).toBe(Date.UTC(2027, 0, 10));

    vi.setSystemTime(Date.UTC(2027, 0, 11));
    await student.as.mutation(api.users.completeOnboarding, {});
    expect((await student.as.query(api.users.me, {}))?.user.onboardedAt).toBe(first);
  });

  test("me reports alumni once the cohort has ended", async () => {
    const t = setup();
    const { student, cohortId, trackId } = await seedTrack(t);
    await t.run((ctx) => ctx.db.patch("cohorts", cohortId, { status: "completed" }));

    const me = await student.as.query(api.users.me, {});
    expect(me?.tracks.find((tr) => tr.trackId === trackId)).toMatchObject({ isStudent: false, isAlumni: true });
  });
});

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { api, internal } from "./_generated/api";
import { createUser, setup, type TestConvex } from "./test.setup";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(Date.UTC(2026, 9, 6, 22));
});

afterEach(() => {
  vi.useRealTimers();
});

async function seedBase(t: TestConvex) {
  await t.mutation(internal.seed.tracks, {});
  await t.mutation(internal.seed.cohort, { trackSlug: "design_lab", name: "Cohort 01" });
  await t.mutation(internal.seed.curriculum, {});
  await t.mutation(internal.seed.missions, {});
  await t.finishAllScheduledFunctions(vi.runAllTimers);
}

describe("demo data", () => {
  test("seeds a believable program once, and clears it again", async () => {
    const t = setup();
    const admin = await createUser(t, { email: "admin@real.dev", platformRole: "super_admin" });
    await seedBase(t);

    const result = await t.mutation(internal.demo.seed, {});
    expect(result).toMatchObject({ skipped: false, certificates: 4 });
    expect(result.users).toBe(5 + 14 + 6 + 6);
    expect(await t.mutation(internal.demo.seed, {})).toMatchObject({ skipped: true });

    const tracks = await t.run((ctx) => ctx.db.query("tracks").collect());
    const design = tracks.find((tr) => tr.slug === "design_lab")!;
    const oss = tracks.find((tr) => tr.slug === "oss_lab")!;

    const overview = await admin.as.query(api.adminOverview.overview, { now: Date.now() });
    expect(overview?.learners.value).toBe(14 + 6);
    expect(overview?.waiting.value).toBeGreaterThan(3);
    expect(overview?.nextSession?.title).toBe("Personas for Bitcoin products");

    const directory = await admin.as.query(api.community.directory, { trackId: design._id });
    expect(directory?.cohorts.map((c) => [c.name, c.members.length])).toEqual(
      expect.arrayContaining([
        ["Cohort 01", 14],
        ["Pilot Cohort", 6],
      ]),
    );
    expect(directory?.mentors).toHaveLength(3);

    const showcase = await admin.as.query(api.community.showcase, { trackId: design._id });
    expect(showcase.length).toBeGreaterThan(10);
    expect(showcase.some((s) => s.learner.fullName === "Halima Yusuf")).toBe(false);

    const sessions = await admin.as.query(api.workshops.listForLearner, { trackId: oss._id });
    expect(sessions?.sessions).toHaveLength(2);

    const certificate = await t.run((ctx) => ctx.db.query("certificates").first());
    const verified = await t.query(api.certificates.getByCode, { code: certificate!.code });
    expect(verified?.cohortName).toBe("Pilot Cohort");
    expect(verified!.issuedAt).toBeLessThan(Date.now() - 60 * 24 * 60 * 60 * 1000);

    const cleared = await t.mutation(internal.demo.clear, {});
    expect(cleared).toEqual({ users: 31, cohorts: 2 });
    const left = await t.run(async (ctx) => ({
      users: await ctx.db.query("users").collect(),
      submissions: await ctx.db.query("submissions").collect(),
      workshops: await ctx.db.query("workshops").collect(),
      announcements: await ctx.db.query("announcements").collect(),
      notifications: await ctx.db.query("notifications").collect(),
      certificates: await ctx.db.query("certificates").collect(),
      cohorts: await ctx.db.query("cohorts").collect(),
    }));
    expect(left.users.map((u) => u.email)).toEqual(["admin@real.dev"]);
    expect(left.submissions).toEqual([]);
    expect(left.workshops).toEqual([]);
    expect(left.announcements).toEqual([]);
    expect(left.notifications).toEqual([]);
    expect(left.certificates).toEqual([]);
    expect(left.cohorts.map((c) => c.name)).toEqual(["Cohort 01"]);
  });
});

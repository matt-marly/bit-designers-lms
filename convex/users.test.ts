import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import { createUser, seedTrack, setup } from "./test.setup";

describe("updatePermissions", () => {
  test("nobody can change their own permissions", async () => {
    const t = setup();
    const { superAdmin } = await seedTrack(t);

    await expect(
      superAdmin.as.mutation(api.users.updatePermissions, {
        userId: superAdmin.userId,
        platformRole: "member",
        permissions: [],
      }),
    ).rejects.toThrow(/can't change your own permissions/);
  });

  test("users.manage is required", async () => {
    const t = setup();
    const { admin, lead } = await seedTrack(t);

    await expect(
      admin.as.mutation(api.users.updatePermissions, {
        userId: lead.userId,
        platformRole: "platform_mentor",
        permissions: ["content.manage"],
      }),
    ).rejects.toThrow(/Not authorized/);
  });

  test("only a super admin can change or create super admins", async () => {
    const t = setup();
    const { superAdmin, lead } = await seedTrack(t);
    const manager = await createUser(t, {
      email: "manager@test.dev",
      platformRole: "admin",
      permissions: ["users.manage", "invites.manage"],
    });

    await expect(
      manager.as.mutation(api.users.updatePermissions, {
        userId: superAdmin.userId,
        platformRole: "member",
        permissions: [],
      }),
    ).rejects.toThrow(/Only a super admin can change super admins/);
    await expect(
      manager.as.mutation(api.users.updatePermissions, {
        userId: lead.userId,
        platformRole: "super_admin",
        permissions: ["users.manage"],
      }),
    ).rejects.toThrow(/Only a super admin can change super admins/);
  });

  test("a manager can only add or remove permissions they hold", async () => {
    const t = setup();
    const { lead } = await seedTrack(t);
    const manager = await createUser(t, {
      email: "manager@test.dev",
      platformRole: "admin",
      permissions: ["users.manage", "invites.manage"],
    });
    const mentor = await createUser(t, {
      email: "mentor@test.dev",
      platformRole: "platform_mentor",
      permissions: ["content.manage", "invites.manage"],
    });

    await expect(
      manager.as.mutation(api.users.updatePermissions, {
        userId: lead.userId,
        platformRole: "admin",
        permissions: ["tracks.manage"],
      }),
    ).rejects.toThrow(/can't change a permission you don't have: tracks.manage/);

    await expect(
      manager.as.mutation(api.users.updatePermissions, {
        userId: mentor.userId,
        platformRole: "member",
        permissions: [],
      }),
    ).rejects.toThrow(/can't change a permission you don't have: content.manage/);

    await manager.as.mutation(api.users.updatePermissions, {
      userId: mentor.userId,
      platformRole: "platform_mentor",
      permissions: ["content.manage"],
    });
    const updated = await t.run((ctx) => ctx.db.get("users", mentor.userId));
    expect(updated?.permissions).toEqual(["content.manage"]);
  });

  test("a super admin can change anyone else", async () => {
    const t = setup();
    const { superAdmin, admin } = await seedTrack(t);
    const otherSuper = await createUser(t, { email: "super2@test.dev", platformRole: "super_admin" });

    await superAdmin.as.mutation(api.users.updatePermissions, {
      userId: otherSuper.userId,
      platformRole: "admin",
      permissions: ["invites.manage", "invites.manage"],
    });
    await superAdmin.as.mutation(api.users.updatePermissions, {
      userId: admin.userId,
      platformRole: "admin",
      permissions: ["users.manage"],
    });

    const [demoted, promoted] = await t.run(async (ctx) => [
      await ctx.db.get("users", otherSuper.userId),
      await ctx.db.get("users", admin.userId),
    ]);
    expect(demoted).toMatchObject({ platformRole: "admin", permissions: ["invites.manage"] });
    expect(promoted?.permissions).toEqual(["users.manage"]);
  });
});

describe("setStatus", () => {
  test("nobody can suspend themselves", async () => {
    const t = setup();
    const { superAdmin } = await seedTrack(t);

    await expect(
      superAdmin.as.mutation(api.users.setStatus, { userId: superAdmin.userId, status: "suspended" }),
    ).rejects.toThrow(/can't suspend yourself/);
  });

  test("only a super admin can suspend a super admin", async () => {
    const t = setup();
    const { superAdmin } = await seedTrack(t);
    const manager = await createUser(t, {
      email: "manager@test.dev",
      platformRole: "admin",
      permissions: ["users.manage"],
    });

    await expect(
      manager.as.mutation(api.users.setStatus, { userId: superAdmin.userId, status: "suspended" }),
    ).rejects.toThrow(/Only a super admin can suspend a super admin/);
  });

  test("a suspended user is locked out until reactivated", async () => {
    const t = setup();
    const { superAdmin, lead, trackId } = await seedTrack(t);

    await superAdmin.as.mutation(api.users.setStatus, { userId: lead.userId, status: "suspended" });

    await expect(lead.as.query(api.tracks.getForAdmin, { trackId })).rejects.toThrow(/suspended/);
    const me = await lead.as.query(api.users.me, {});
    expect(me?.user.status).toBe("suspended");

    await superAdmin.as.mutation(api.users.setStatus, { userId: lead.userId, status: "active" });
    await expect(lead.as.query(api.tracks.getForAdmin, { trackId })).resolves.toMatchObject({
      capabilities: { canManageCoMentors: true },
    });
  });
});

describe("listForManagement", () => {
  test("requires users.manage", async () => {
    const t = setup();
    const { admin } = await seedTrack(t);

    await expect(
      admin.as.query(api.users.listForManagement, { paginationOpts: { numItems: 10, cursor: null } }),
    ).rejects.toThrow(/Not authorized/);
  });

  test("marks which rows the viewer can edit", async () => {
    const t = setup();
    const { superAdmin, student, trackId } = await seedTrack(t);
    const manager = await createUser(t, {
      email: "manager@test.dev",
      platformRole: "admin",
      permissions: ["users.manage"],
    });

    const { page } = await manager.as.query(api.users.listForManagement, {
      paginationOpts: { numItems: 50, cursor: null },
    });
    const byEmail = new Map(page.map((row) => [row.email, row]));

    expect(byEmail.get("manager@test.dev")).toMatchObject({ isSelf: true, canEdit: false });
    expect(byEmail.get(superAdmin.email)?.canEdit).toBe(false);
    expect(byEmail.get(student.email)).toMatchObject({
      canEdit: true,
      trackRoles: [{ trackId, trackName: "Design Lab", role: "student", cohortName: "Cohort 01" }],
    });
    expect(byEmail.get("lead@test.dev")?.trackRoles).toEqual([
      expect.objectContaining({ role: "lead_mentor", cohortName: null }),
    ]);
  });
});

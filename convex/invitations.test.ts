import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { api } from "./_generated/api";
import { addStaff, createCohort, createUser, seedTrack, setup } from "./test.setup";

const member = { platformRole: "member" as const, permissions: [] };

beforeEach(() => {
  // New-email invitations schedule the Clerk email action; fake timers keep it from running.
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("platform grants", () => {
  test("only a super admin can invite a super admin", async () => {
    const t = setup();
    const { admin, superAdmin } = await seedTrack(t);
    const invite = { email: "new@test.dev", platformRole: "super_admin" as const, permissions: [], trackGrants: [] };

    await expect(admin.as.mutation(api.invitations.create, invite)).rejects.toThrow(
      /Only a super admin can create another super admin/,
    );
    await expect(superAdmin.as.mutation(api.invitations.create, invite)).resolves.toBe("sent");
  });

  test("nobody can grant a permission they don't hold", async () => {
    const t = setup();
    const { admin } = await seedTrack(t);

    await expect(
      admin.as.mutation(api.invitations.create, {
        email: "new@test.dev",
        platformRole: "admin",
        permissions: ["users.manage"],
        trackGrants: [],
      }),
    ).rejects.toThrow(/can't grant a permission you don't have: users.manage/);
  });

  test("granting platform access requires invites.manage", async () => {
    const t = setup();
    const { lead } = await seedTrack(t);

    await expect(
      lead.as.mutation(api.invitations.create, {
        email: "new@test.dev",
        platformRole: "platform_mentor",
        permissions: [],
        trackGrants: [],
      }),
    ).rejects.toThrow(/only invite people into your own tracks/);
  });

  test("an invitation must grant something", async () => {
    const t = setup();
    const { superAdmin } = await seedTrack(t);

    await expect(
      superAdmin.as.mutation(api.invitations.create, { email: "new@test.dev", ...member, trackGrants: [] }),
    ).rejects.toThrow(/at least one permission or track role/);
  });
});

describe("track grants", () => {
  test("a lead mentor can invite students into their own track only", async () => {
    const t = setup();
    const { lead, trackId, otherTrackId, cohortId } = await seedTrack(t);
    const otherCohortId = await createCohort(t, otherTrackId);

    await expect(
      lead.as.mutation(api.invitations.create, {
        email: "learner@test.dev",
        ...member,
        trackGrants: [{ trackId, role: "student", cohortId, permissions: [] }],
      }),
    ).resolves.toBe("sent");

    await expect(
      lead.as.mutation(api.invitations.create, {
        email: "learner2@test.dev",
        ...member,
        trackGrants: [{ trackId: otherTrackId, role: "student", cohortId: otherCohortId, permissions: [] }],
      }),
    ).rejects.toThrow(/can't invite students to Open Source Lab/);
  });

  test("a lead mentor can add co-mentors but not assign a lead", async () => {
    const t = setup();
    const { lead, trackId } = await seedTrack(t);

    await expect(
      lead.as.mutation(api.invitations.create, {
        email: "helper@test.dev",
        ...member,
        trackGrants: [{ trackId, role: "co_mentor", permissions: ["track.reviews", "track.workshops"] }],
      }),
    ).resolves.toBe("sent");

    await expect(
      lead.as.mutation(api.invitations.create, {
        email: "boss@test.dev",
        ...member,
        trackGrants: [{ trackId, role: "lead_mentor", permissions: [] }],
      }),
    ).rejects.toThrow(/Only people who manage tracks can assign a lead mentor/);
  });

  test("a co-mentor can't add other co-mentors, even with student invites", async () => {
    const t = setup();
    const { trackId, cohortId } = await seedTrack(t);
    const inviter = await createUser(t, { email: "inviter@test.dev" });
    await addStaff(t, trackId, inviter.userId, "co_mentor", ["track.students.invite"]);

    await expect(
      inviter.as.mutation(api.invitations.create, {
        email: "learner@test.dev",
        ...member,
        trackGrants: [{ trackId, role: "student", cohortId, permissions: [] }],
      }),
    ).resolves.toBe("sent");

    await expect(
      inviter.as.mutation(api.invitations.create, {
        email: "helper@test.dev",
        ...member,
        trackGrants: [{ trackId, role: "co_mentor", permissions: [] }],
      }),
    ).rejects.toThrow(/Only the lead mentor can add co-mentors/);
  });

  test("a co-mentor without student invites can't invite students", async () => {
    const t = setup();
    const { coMentor, trackId, cohortId } = await seedTrack(t);

    await expect(
      coMentor.as.mutation(api.invitations.create, {
        email: "learner@test.dev",
        ...member,
        trackGrants: [{ trackId, role: "student", cohortId, permissions: [] }],
      }),
    ).rejects.toThrow(/can't invite students to Design Lab/);
  });

  test("a student grant needs a cohort from the same track", async () => {
    const t = setup();
    const { superAdmin, trackId, otherTrackId } = await seedTrack(t);
    const otherCohortId = await createCohort(t, otherTrackId);

    await expect(
      superAdmin.as.mutation(api.invitations.create, {
        email: "learner@test.dev",
        ...member,
        trackGrants: [{ trackId, role: "student", permissions: [] }],
      }),
    ).rejects.toThrow(/Pick a cohort/);

    await expect(
      superAdmin.as.mutation(api.invitations.create, {
        email: "learner@test.dev",
        ...member,
        trackGrants: [{ trackId, role: "student", cohortId: otherCohortId, permissions: [] }],
      }),
    ).rejects.toThrow(/doesn't belong to Design Lab/);
  });

  test("archived tracks can't receive new grants", async () => {
    const t = setup();
    const { superAdmin, trackId, cohortId } = await seedTrack(t);
    await t.run((ctx) => ctx.db.patch("tracks", trackId, { status: "archived" }));

    await expect(
      superAdmin.as.mutation(api.invitations.create, {
        email: "learner@test.dev",
        ...member,
        trackGrants: [{ trackId, role: "student", cohortId, permissions: [] }],
      }),
    ).rejects.toThrow(/no longer exists/);
  });
});

describe("existing members and new emails", () => {
  test("inviting an existing member applies the grants at once and never downgrades", async () => {
    const t = setup();
    const { superAdmin, admin, trackId, cohortId } = await seedTrack(t);

    const result = await superAdmin.as.mutation(api.invitations.create, {
      email: admin.email,
      platformRole: "platform_mentor",
      permissions: ["content.manage"],
      trackGrants: [{ trackId, role: "student", cohortId, permissions: [] }],
    });
    expect(result).toBe("applied");

    const updated = await t.run((ctx) => ctx.db.get("users", admin.userId));
    expect(updated?.platformRole).toBe("admin");
    const enrollment = await t.run((ctx) =>
      ctx.db
        .query("enrollments")
        .withIndex("by_userId_and_cohortId", (q) => q.eq("userId", admin.userId).eq("cohortId", cohortId))
        .unique(),
    );
    expect(enrollment).not.toBeNull();
  });

  test("a new email gets one open invitation at a time", async () => {
    const t = setup();
    const { superAdmin, trackId, cohortId } = await seedTrack(t);
    const invite = {
      email: "  New@Test.dev ",
      ...member,
      trackGrants: [{ trackId, role: "student" as const, cohortId, permissions: [] }],
    };

    await expect(superAdmin.as.mutation(api.invitations.create, invite)).resolves.toBe("sent");
    await expect(superAdmin.as.mutation(api.invitations.create, invite)).rejects.toThrow(
      /already has an open invitation/,
    );

    const invitations = await t.run((ctx) => ctx.db.query("invitations").collect());
    expect(invitations).toHaveLength(1);
    expect(invitations[0]).toMatchObject({ email: "new@test.dev", status: "pending" });
  });

  test("only the inviter or someone with invites.manage can revoke", async () => {
    const t = setup();
    const { lead, coMentor, admin, trackId, cohortId } = await seedTrack(t);
    await lead.as.mutation(api.invitations.create, {
      email: "learner@test.dev",
      ...member,
      trackGrants: [{ trackId, role: "student", cohortId, permissions: [] }],
    });
    const invitation = await t.run((ctx) => ctx.db.query("invitations").first());

    await expect(
      coMentor.as.mutation(api.invitations.revoke, { invitationId: invitation!._id }),
    ).rejects.toThrow(/Not authorized/);
    await admin.as.mutation(api.invitations.revoke, { invitationId: invitation!._id });

    const revoked = await t.run((ctx) => ctx.db.get("invitations", invitation!._id));
    expect(revoked?.status).toBe("revoked");
  });
});

describe("first sign-in", () => {
  test("an invited email becomes a user with the invitation's grants", async () => {
    const t = setup();
    const { superAdmin, trackId, cohortId } = await seedTrack(t);
    await superAdmin.as.mutation(api.invitations.create, {
      email: "learner@test.dev",
      ...member,
      trackGrants: [{ trackId, role: "student", cohortId, permissions: [] }],
    });

    const asLearner = t.withIdentity({
      tokenIdentifier: "https://clerk.test|new-learner",
      email: "Learner@test.dev",
      emailVerified: true,
    });
    await expect(asLearner.mutation(api.users.ensureCurrent, { fullName: "Ada Learner" })).resolves.toBe("ok");

    const me = await asLearner.query(api.users.me, {});
    expect(me?.user).toMatchObject({ email: "learner@test.dev", fullName: "Ada Learner", platformRole: "member" });
    expect(me?.hasAdminAccess).toBe(false);
    expect(me?.tracks).toEqual([expect.objectContaining({ name: "Design Lab", isStudent: true })]);

    const invitation = await t.run((ctx) => ctx.db.query("invitations").first());
    expect(invitation?.status).toBe("accepted");
  });

  test("an email without an invitation gets no access", async () => {
    const t = setup();
    await seedTrack(t);
    const stranger = t.withIdentity({ email: "stranger@test.dev", emailVerified: true });

    await expect(stranger.mutation(api.users.ensureCurrent, {})).resolves.toBe("no_access");
    const users = await t.run((ctx) => ctx.db.query("users").collect());
    expect(users.some((u) => u.email === "stranger@test.dev")).toBe(false);
  });

  test("an unverified email gets no access even if invited", async () => {
    const t = setup();
    const { superAdmin, trackId, cohortId } = await seedTrack(t);
    await superAdmin.as.mutation(api.invitations.create, {
      email: "learner@test.dev",
      ...member,
      trackGrants: [{ trackId, role: "student", cohortId, permissions: [] }],
    });
    const unverified = t.withIdentity({ email: "learner@test.dev", emailVerified: false });

    await expect(unverified.mutation(api.users.ensureCurrent, {})).resolves.toBe("no_access");
  });

  test("a suspended user is told they're suspended", async () => {
    const t = setup();
    const suspended = await createUser(t, { email: "gone@test.dev", status: "suspended" });

    await expect(suspended.as.mutation(api.users.ensureCurrent, {})).resolves.toBe("suspended");
  });
});

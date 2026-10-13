import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import { addStaff, createCohort, createTrack, createUser, enroll, seedTrack, setup } from "./test.setup";

const JAN = Date.UTC(2027, 0, 4);
const MAR = Date.UTC(2027, 2, 29);

describe("which tracks people can administer", () => {
  test("tracks.manage sees every track, including archived ones", async () => {
    const t = setup();
    const { admin } = await seedTrack(t);
    await createTrack(t, "Old Lab", "archived");

    const tracks = await admin.as.query(api.tracks.listForAdmin, {});
    expect(tracks.map((track) => track.name)).toEqual(["Design Lab", "Open Source Lab", "Old Lab"]);
    expect(tracks[0]).toMatchObject({ leadName: "lead", coMentorCount: 1, cohortCount: 1, activeCohortCount: 1 });
  });

  test("track staff see only their own active tracks; students see none", async () => {
    const t = setup();
    const { lead, coMentor, student, trackId } = await seedTrack(t);

    expect((await lead.as.query(api.tracks.listForAdmin, {})).map((track) => track.name)).toEqual(["Design Lab"]);
    expect((await coMentor.as.query(api.tracks.listForAdmin, {})).map((track) => track.name)).toEqual(["Design Lab"]);
    expect(await student.as.query(api.tracks.listForAdmin, {})).toEqual([]);

    await t.run((ctx) => ctx.db.patch("tracks", trackId, { status: "archived" }));
    expect(await lead.as.query(api.tracks.listForAdmin, {})).toEqual([]);
  });

  test("students and outsiders can't open a track's admin view", async () => {
    const t = setup();
    const { student, otherTrackId, lead, trackId } = await seedTrack(t);

    await expect(student.as.query(api.tracks.getForAdmin, { trackId })).rejects.toThrow(/Not authorized/);
    await expect(lead.as.query(api.tracks.getForAdmin, { trackId: otherTrackId })).rejects.toThrow(
      /Not authorized/,
    );
  });

  test("capabilities follow the viewer's role on the track", async () => {
    const t = setup();
    const { admin, lead, coMentor, trackId } = await seedTrack(t);

    const asAdmin = await admin.as.query(api.tracks.getForAdmin, { trackId });
    expect(asAdmin.capabilities).toMatchObject({
      canEditTrack: true,
      canAssignLead: true,
      canManageCoMentors: true,
      canManageCohorts: true,
      canAddStudents: true,
    });

    const asLead = await lead.as.query(api.tracks.getForAdmin, { trackId });
    expect(asLead.capabilities).toMatchObject({
      canEditTrack: false,
      canAssignLead: false,
      canManageCoMentors: true,
      canManageCohorts: true,
      canAddStudents: true,
    });
    expect(asLead.staff.map((s) => [s.email, s.role, s.isSelf])).toEqual([
      ["lead@test.dev", "lead_mentor", true],
      ["co@test.dev", "co_mentor", false],
    ]);

    const asCo = await coMentor.as.query(api.tracks.getForAdmin, { trackId });
    expect(asCo.capabilities).toMatchObject({
      canManageCoMentors: false,
      canManageCohorts: false,
      canAddStudents: false,
      grantablePermissions: ["track.reviews"],
    });
  });
});

describe("track settings", () => {
  test("only tracks.manage can create, rename and archive tracks", async () => {
    const t = setup();
    const { admin, lead, trackId } = await seedTrack(t);

    await expect(lead.as.mutation(api.tracks.create, { name: "Product Lab" })).rejects.toThrow(/Not authorized/);
    await expect(lead.as.mutation(api.tracks.update, { trackId, name: "Renamed" })).rejects.toThrow(/Not authorized/);

    await admin.as.mutation(api.tracks.create, { name: "Product Lab", description: "  " });
    await admin.as.mutation(api.tracks.update, { trackId, status: "archived" });
    const track = await t.run((ctx) => ctx.db.get("tracks", trackId));
    expect(track?.status).toBe("archived");
  });

  test("track names must be unique", async () => {
    const t = setup();
    const { admin, trackId } = await seedTrack(t);

    await expect(admin.as.mutation(api.tracks.create, { name: "design lab" })).rejects.toThrow(/already exists/);
    await expect(admin.as.mutation(api.tracks.update, { trackId, name: "Open Source Lab" })).rejects.toThrow(
      /already exists/,
    );
    await expect(admin.as.mutation(api.tracks.update, { trackId, name: "Design Lab" })).resolves.toBeNull();
  });
});

describe("track staff", () => {
  test("assigning a new lead turns the old lead into a co-mentor with every permission", async () => {
    const t = setup();
    const { admin, lead, coMentor, trackId } = await seedTrack(t);

    await expect(lead.as.mutation(api.tracks.setLead, { trackId, userId: coMentor.userId })).rejects.toThrow(
      /Not authorized/,
    );
    await admin.as.mutation(api.tracks.setLead, { trackId, userId: coMentor.userId });

    const { staff } = await admin.as.query(api.tracks.getForAdmin, { trackId });
    expect(staff.find((s) => s.userId === coMentor.userId)?.role).toBe("lead_mentor");
    expect(staff.find((s) => s.userId === lead.userId)).toMatchObject({ role: "co_mentor" });
    expect(staff.find((s) => s.userId === lead.userId)?.permissions).toHaveLength(6);
  });

  test("a lead can't be assigned on an archived track", async () => {
    const t = setup();
    const { admin, coMentor, trackId } = await seedTrack(t);
    await t.run((ctx) => ctx.db.patch("tracks", trackId, { status: "archived" }));

    await expect(admin.as.mutation(api.tracks.setLead, { trackId, userId: coMentor.userId })).rejects.toThrow(
      /Restore this track/,
    );
  });

  test("the lead manages co-mentor permissions; co-mentors can't", async () => {
    const t = setup();
    const { lead, coMentor, trackId } = await seedTrack(t);
    const other = await createUser(t, { email: "other@test.dev" });
    await addStaff(t, trackId, other.userId, "co_mentor", ["track.reviews"]);

    await expect(
      coMentor.as.mutation(api.tracks.setCoMentorPermissions, {
        trackId,
        userId: other.userId,
        permissions: ["track.cohorts"],
      }),
    ).rejects.toThrow(/Only the lead mentor can manage co-mentors/);

    await lead.as.mutation(api.tracks.setCoMentorPermissions, {
      trackId,
      userId: coMentor.userId,
      permissions: ["track.cohorts", "track.cohorts"],
    });
    const membership = await t.run((ctx) =>
      ctx.db
        .query("trackMembers")
        .withIndex("by_trackId_and_userId", (q) => q.eq("trackId", trackId).eq("userId", coMentor.userId))
        .unique(),
    );
    expect(membership?.permissions).toEqual(["track.cohorts"]);

    await expect(
      lead.as.mutation(api.tracks.setCoMentorPermissions, { trackId, userId: lead.userId, permissions: [] }),
    ).rejects.toThrow(/already has every track permission/);
  });

  test("the lead can remove co-mentors but not themselves; co-mentors can't remove anyone", async () => {
    const t = setup();
    const { admin, lead, coMentor, trackId } = await seedTrack(t);

    await expect(coMentor.as.mutation(api.tracks.removeMember, { trackId, userId: lead.userId })).rejects.toThrow(
      /Only people who manage tracks can remove a lead mentor/,
    );
    await expect(lead.as.mutation(api.tracks.removeMember, { trackId, userId: lead.userId })).rejects.toThrow(
      /Only people who manage tracks can remove a lead mentor/,
    );

    await lead.as.mutation(api.tracks.removeMember, { trackId, userId: coMentor.userId });
    await admin.as.mutation(api.tracks.removeMember, { trackId, userId: lead.userId });

    const { staff } = await admin.as.query(api.tracks.getForAdmin, { trackId });
    expect(staff).toEqual([]);
  });
});

describe("cohorts", () => {
  test("creating cohorts needs track.cohorts on that track", async () => {
    const t = setup();
    const { lead, coMentor, trackId, otherTrackId } = await seedTrack(t);

    await expect(
      coMentor.as.mutation(api.tracks.createCohort, { trackId, name: "Cohort 02", startsAt: JAN }),
    ).rejects.toThrow(/Not authorized for this track/);
    await expect(
      lead.as.mutation(api.tracks.createCohort, { trackId: otherTrackId, name: "Cohort 02", startsAt: JAN }),
    ).rejects.toThrow(/Not authorized for this track/);

    const cohortId = await lead.as.mutation(api.tracks.createCohort, {
      trackId,
      name: " Cohort 02 ",
      startsAt: JAN,
      endsAt: MAR,
    });
    const cohort = await t.run((ctx) => ctx.db.get("cohorts", cohortId));
    expect(cohort).toMatchObject({ name: "Cohort 02", status: "draft", startsAt: JAN, endsAt: MAR });
  });

  test("dates and archived tracks are validated", async () => {
    const t = setup();
    const { admin, trackId, cohortId } = await seedTrack(t);

    await expect(
      admin.as.mutation(api.tracks.createCohort, { trackId, name: "Backwards", startsAt: MAR, endsAt: JAN }),
    ).rejects.toThrow(/end date must be after the start date/);
    await expect(
      admin.as.mutation(api.tracks.updateCohort, { cohortId, endsAt: Date.UTC(2026, 0, 1) }),
    ).rejects.toThrow(/end date must be after the start date/);

    await t.run((ctx) => ctx.db.patch("tracks", trackId, { status: "archived" }));
    await expect(
      admin.as.mutation(api.tracks.createCohort, { trackId, name: "Late", startsAt: JAN }),
    ).rejects.toThrow(/Restore this track/);
  });

  test("updateCohort edits fields and can clear the end date", async () => {
    const t = setup();
    const { lead, cohortId } = await seedTrack(t);

    await lead.as.mutation(api.tracks.updateCohort, { cohortId, endsAt: MAR, status: "completed" });
    expect(await t.run((ctx) => ctx.db.get("cohorts", cohortId))).toMatchObject({ endsAt: MAR, status: "completed" });

    await lead.as.mutation(api.tracks.updateCohort, { cohortId, endsAt: null, name: "Pilot" });
    const cohort = await t.run((ctx) => ctx.db.get("cohorts", cohortId));
    expect(cohort?.endsAt).toBeUndefined();
    expect(cohort?.name).toBe("Pilot");
  });

  test("student counts and the student list are visible to track staff only", async () => {
    const t = setup();
    const { lead, student, cohortId, trackId } = await seedTrack(t);

    const { cohorts } = await lead.as.query(api.tracks.getForAdmin, { trackId });
    expect(cohorts).toEqual([expect.objectContaining({ studentCount: 1, studentCountCapped: false })]);

    const students = await lead.as.query(api.tracks.listCohortStudents, {
      cohortId,
      paginationOpts: { numItems: 10, cursor: null },
    });
    expect(students.page).toEqual([expect.objectContaining({ email: "student@test.dev", enrollmentStatus: "active" })]);

    await expect(
      student.as.query(api.tracks.listCohortStudents, { cohortId, paginationOpts: { numItems: 10, cursor: null } }),
    ).rejects.toThrow(/Not authorized/);
  });
});

describe("moving and unenrolling students", () => {
  async function studentEnrollment(t: ReturnType<typeof setup>, userId: Parameters<typeof enroll>[1]) {
    return await t.run((ctx) =>
      ctx.db
        .query("enrollments")
        .withIndex("by_userId_and_trackId", (q) => q.eq("userId", userId))
        .collect(),
    );
  }

  test("students move between cohorts of the same track only", async () => {
    const t = setup();
    const { lead, admin, student, trackId, otherTrackId } = await seedTrack(t);
    const [enrollment] = await studentEnrollment(t, student.userId);
    const cohort2 = await createCohort(t, trackId, "Cohort 02");
    const foreignCohort = await createCohort(t, otherTrackId, "OSS 01");

    await expect(
      admin.as.mutation(api.tracks.moveStudent, { enrollmentId: enrollment._id, cohortId: foreignCohort }),
    ).rejects.toThrow(/same track/);

    await lead.as.mutation(api.tracks.moveStudent, { enrollmentId: enrollment._id, cohortId: cohort2 });
    const after = await studentEnrollment(t, student.userId);
    expect(after).toEqual([expect.objectContaining({ _id: enrollment._id, cohortId: cohort2 })]);
  });

  test("moving into a cohort the student is already in merges the enrollments", async () => {
    const t = setup();
    const { lead, student, trackId } = await seedTrack(t);
    const [original] = await studentEnrollment(t, student.userId);
    const cohort2 = await createCohort(t, trackId, "Cohort 02");
    await enroll(t, student.userId, trackId, cohort2);

    await lead.as.mutation(api.tracks.moveStudent, { enrollmentId: original._id, cohortId: cohort2 });
    const after = await studentEnrollment(t, student.userId);
    expect(after).toHaveLength(1);
    expect(after[0].cohortId).toBe(cohort2);
  });

  test("unenrolling needs track.cohorts", async () => {
    const t = setup();
    const { lead, coMentor, student } = await seedTrack(t);
    const [enrollment] = await studentEnrollment(t, student.userId);

    await expect(coMentor.as.mutation(api.tracks.unenroll, { enrollmentId: enrollment._id })).rejects.toThrow(
      /Not authorized for this track/,
    );
    await expect(student.as.mutation(api.tracks.unenroll, { enrollmentId: enrollment._id })).rejects.toThrow(
      /Not authorized for this track/,
    );

    await lead.as.mutation(api.tracks.unenroll, { enrollmentId: enrollment._id });
    expect(await studentEnrollment(t, student.userId)).toEqual([]);
    expect(await student.as.query(api.users.me, {})).toMatchObject({ tracks: [] });
  });
});

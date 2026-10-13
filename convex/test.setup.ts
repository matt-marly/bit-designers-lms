/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import schema from "./schema";
import type { Doc, Id } from "./_generated/dataModel";
import {
  PLATFORM_ROLE_PRESETS,
  TRACK_PERMISSIONS,
  type PlatformPermission,
  type PlatformRole,
  type TrackPermission,
} from "./lib/permissions";

export const modules = import.meta.glob("./**/*.ts");

export function setup() {
  return convexTest(schema, modules);
}

export type TestConvex = ReturnType<typeof setup>;

export async function createUser(
  t: TestConvex,
  options: {
    email: string;
    fullName?: string;
    platformRole?: PlatformRole;
    permissions?: PlatformPermission[];
    status?: Doc<"users">["status"];
  },
) {
  const platformRole = options.platformRole ?? "member";
  const tokenIdentifier = `https://clerk.test|${options.email}`;
  const fullName = options.fullName ?? options.email.split("@")[0];
  const userId = await t.run((ctx) =>
    ctx.db.insert("users", {
      tokenIdentifier,
      email: options.email,
      fullName,
      platformRole,
      permissions: options.permissions ?? [...PLATFORM_ROLE_PRESETS[platformRole].permissions],
      status: options.status ?? "active",
    }),
  );
  const as = t.withIdentity({
    tokenIdentifier,
    subject: options.email,
    issuer: "https://clerk.test",
    email: options.email,
    emailVerified: true,
    name: fullName,
  });
  return { userId, as, email: options.email };
}

export async function createTrack(
  t: TestConvex,
  name: string,
  status: Doc<"tracks">["status"] = "active",
) {
  return await t.run((ctx) =>
    ctx.db.insert("tracks", {
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
      status,
    }),
  );
}

export async function createCohort(
  t: TestConvex,
  trackId: Id<"tracks">,
  name = "Cohort 01",
  status: Doc<"cohorts">["status"] = "active",
) {
  return await t.run((ctx) =>
    ctx.db.insert("cohorts", { trackId, name, startsAt: Date.UTC(2027, 0, 4), status }),
  );
}

export async function addStaff(
  t: TestConvex,
  trackId: Id<"tracks">,
  userId: Id<"users">,
  role: "lead_mentor" | "co_mentor",
  permissions: TrackPermission[] = role === "lead_mentor" ? [...TRACK_PERMISSIONS] : [],
) {
  return await t.run((ctx) => ctx.db.insert("trackMembers", { trackId, userId, role, permissions }));
}

export async function enroll(
  t: TestConvex,
  userId: Id<"users">,
  trackId: Id<"tracks">,
  cohortId: Id<"cohorts">,
) {
  return await t.run((ctx) =>
    ctx.db.insert("enrollments", { userId, trackId, cohortId, status: "active" }),
  );
}

/** convex-test doesn't record content types on stored files, so this sets it the way an upload URL would. */
export async function storeFile(t: TestConvex, contentType: string, bytes = 16) {
  const fileId = await t.run((ctx) => ctx.storage.store(new Blob([new Uint8Array(bytes)])));
  await t.run(async (ctx) => {
    const db = ctx.db as unknown as { patch: (id: Id<"_storage">, value: { contentType: string }) => Promise<void> };
    await db.patch(fileId, { contentType });
  });
  return fileId;
}

/** A track with a lead, a co-mentor, a student, and a platform admin and super admin. */
export async function seedTrack(t: TestConvex) {
  const superAdmin = await createUser(t, { email: "super@test.dev", platformRole: "super_admin" });
  const admin = await createUser(t, { email: "admin@test.dev", platformRole: "admin" });
  const trackId = await createTrack(t, "Design Lab");
  const otherTrackId = await createTrack(t, "Open Source Lab");
  const cohortId = await createCohort(t, trackId);
  const lead = await createUser(t, { email: "lead@test.dev" });
  await addStaff(t, trackId, lead.userId, "lead_mentor");
  const coMentor = await createUser(t, { email: "co@test.dev" });
  await addStaff(t, trackId, coMentor.userId, "co_mentor", ["track.reviews"]);
  const student = await createUser(t, { email: "student@test.dev" });
  await enroll(t, student.userId, trackId, cohortId);
  return { superAdmin, admin, lead, coMentor, student, trackId, otherTrackId, cohortId };
}

import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { flattenOutline, loadOutline } from "./curriculum";
import { notify } from "./notifications";

const MAX_COMPLETIONS = 1000;
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export const CERTIFICATE_CODE_PATTERN = /^BD-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

function randomCode() {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  const chars = Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
  return `BD-${chars.slice(0, 4)}-${chars.slice(4, 8)}-${chars.slice(8, 12)}`;
}

/**
 * Issues a certificate the first time an enrolled learner has completed every
 * published module of a track. Never revoked once issued.
 */
export async function maybeIssueCertificate(ctx: MutationCtx, userId: Id<"users">, trackId: Id<"tracks">) {
  const existing = await ctx.db
    .query("certificates")
    .withIndex("by_userId_and_trackId", (q) => q.eq("userId", userId).eq("trackId", trackId))
    .first();
  if (existing !== null) return null;

  const enrollment = await ctx.db
    .query("enrollments")
    .withIndex("by_userId_and_trackId", (q) => q.eq("userId", userId).eq("trackId", trackId))
    .first();
  if (enrollment === null) return null;

  const modules = flattenOutline(await loadOutline(ctx, trackId, false));
  if (modules.length === 0) return null;

  const completions = await ctx.db
    .query("moduleCompletions")
    .withIndex("by_userId_and_trackId", (q) => q.eq("userId", userId).eq("trackId", trackId))
    .take(MAX_COMPLETIONS);
  const done = new Set(completions.map((c) => c.moduleId));
  if (!modules.every(({ module }) => done.has(module._id))) return null;

  let code = randomCode();
  while (
    (await ctx.db
      .query("certificates")
      .withIndex("by_code", (q) => q.eq("code", code))
      .first()) !== null
  ) {
    code = randomCode();
  }

  await ctx.db.insert("certificates", {
    userId,
    trackId,
    cohortId: enrollment.cohortId,
    code,
    issuedAt: Date.now(),
  });
  const track = await ctx.db.get("tracks", trackId);
  await notify(ctx, userId, {
    type: "certificate",
    title: `You completed ${track?.name ?? "your track"}`,
    body: "Your certificate is ready to view and share.",
    link: `/certificates/${code}`,
  });
  return code;
}

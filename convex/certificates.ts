import { v } from "convex/values";
import { query } from "./_generated/server";
import { getCurrentUser } from "./lib/auth";
import { CERTIFICATE_CODE_PATTERN } from "./lib/certificates";

const MAX_CERTIFICATES = 50;

export const mine = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("certificates"),
      code: v.string(),
      trackId: v.id("tracks"),
      trackName: v.string(),
      cohortName: v.string(),
      issuedAt: v.number(),
    }),
  ),
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (user === null) return [];
    const certificates = await ctx.db
      .query("certificates")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(MAX_CERTIFICATES);
    return await Promise.all(
      certificates.map(async (c) => {
        const [track, cohort] = await Promise.all([ctx.db.get("tracks", c.trackId), ctx.db.get("cohorts", c.cohortId)]);
        return {
          _id: c._id,
          code: c.code,
          trackId: c.trackId,
          trackName: track?.name ?? "Track",
          cohortName: cohort?.name ?? "",
          issuedAt: c.issuedAt,
        };
      }),
    );
  },
});

/** Public verification. Shows only what is printed on the certificate. */
export const getByCode = query({
  args: { code: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      code: v.string(),
      fullName: v.string(),
      trackName: v.string(),
      cohortName: v.string(),
      issuedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const code = args.code.trim().toUpperCase();
    if (!CERTIFICATE_CODE_PATTERN.test(code)) return null;
    const certificate = await ctx.db
      .query("certificates")
      .withIndex("by_code", (q) => q.eq("code", code))
      .unique();
    if (certificate === null) return null;
    const [user, track, cohort] = await Promise.all([
      ctx.db.get("users", certificate.userId),
      ctx.db.get("tracks", certificate.trackId),
      ctx.db.get("cohorts", certificate.cohortId),
    ]);
    if (user === null || track === null) return null;
    return {
      code: certificate.code,
      fullName: user.fullName,
      trackName: track.name,
      cohortName: cohort?.name ?? "",
      issuedAt: certificate.issuedAt,
    };
  },
});

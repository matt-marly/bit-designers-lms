import type { Doc } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";

export const PROFILE_LIMITS = {
  fullName: 100,
  bio: 600,
  portfolioUrl: 500,
} as const;

export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
export const AVATAR_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;

export async function avatarUrlFor(ctx: QueryCtx, user: Doc<"users">) {
  return user.avatarFileId ? await ctx.storage.getUrl(user.avatarFileId) : null;
}

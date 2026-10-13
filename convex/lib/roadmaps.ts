import { ConvexError } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import { getTrackAccess, requireUser } from "./auth";
import { slugify } from "./curriculum";

export const MAX_NODES_PER_ROADMAP = 200;
export const MAX_ROADMAPS = 100;

export async function uniqueRoadmapSlug(ctx: QueryCtx, title: string): Promise<string> {
  const base = slugify(title) || "roadmap";
  for (let i = 1; i <= 100; i++) {
    const candidate = i === 1 ? base : `${base}-${i}`;
    const taken = await ctx.db
      .query("roadmaps")
      .withIndex("by_slug", (q) => q.eq("slug", candidate))
      .first();
    if (taken === null) return candidate;
  }
  throw new ConvexError("Too many roadmaps share this title. Pick a different one.");
}

export function cleanLane(lane: string): string {
  const trimmed = lane.trim().slice(0, 120);
  return trimmed || "General";
}

export type RoadmapViewer =
  | { ok: true; canEdit: boolean }
  | { ok: false };

/** Can the caller see this roadmap? Editors also see drafts. */
export async function roadmapAccess(
  ctx: QueryCtx,
  user: Doc<"users">,
  roadmap: Doc<"roadmaps">,
): Promise<RoadmapViewer> {
  if (roadmap.trackId === undefined) {
    const isPlatform = user.permissions.includes("content.manage");
    if (roadmap.status === "published") return { ok: true, canEdit: isPlatform };
    return isPlatform ? { ok: true, canEdit: true } : { ok: false };
  }
  const access = await getTrackAccess(ctx, user, roadmap.trackId);
  if (!access.canView) return { ok: false };
  const canEdit = access.permissions.includes("track.content");
  if (roadmap.status !== "published" && !canEdit) return { ok: false };
  return { ok: true, canEdit };
}

export async function requireRoadmapViewer(ctx: QueryCtx, roadmapId: Id<"roadmaps">) {
  const user = await requireUser(ctx);
  const roadmap = await ctx.db.get("roadmaps", roadmapId);
  if (roadmap === null) throw new ConvexError("Roadmap not found");
  const access = await roadmapAccess(ctx, user, roadmap);
  if (!access.ok) throw new ConvexError("Not authorized for this roadmap");
  return { user, roadmap, canEdit: access.canEdit };
}

/** Track roadmaps need track.content; global guides need content.manage. */
export async function requireRoadmapEditor(ctx: QueryCtx, trackId: Id<"tracks"> | undefined) {
  const user = await requireUser(ctx);
  if (trackId === undefined) {
    if (!user.permissions.includes("content.manage")) {
      throw new ConvexError("Not authorized to edit guides");
    }
    const track = null;
    return { user, track };
  }
  const access = await getTrackAccess(ctx, user, trackId);
  if (!access.permissions.includes("track.content")) {
    throw new ConvexError("Not authorized to edit this roadmap");
  }
  const track = await ctx.db.get("tracks", trackId);
  if (track === null) throw new ConvexError("Track not found");
  return { user, track };
}

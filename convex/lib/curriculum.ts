import { ConvexError } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import { getTrackAccess, requireUser } from "./auth";

export const MAX_UNITS_PER_TRACK = 50;
export const MAX_MODULES_PER_UNIT = 50;
export const MAX_LESSONS_PER_MODULE = 30;
export const MAX_COMPLETIONS_PER_TRACK = 3000;

export const LIMITS = {
  title: 120,
  description: 2000,
  objective: 200,
  objectives: 12,
  body: 50_000,
  transcript: 50_000,
  summary: 2000,
  videoUrl: 500,
} as const;

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
}

export function cleanTitle(title: string, what: string): string {
  const trimmed = title.trim();
  if (!trimmed) {
    throw new ConvexError(`${what} title is required`);
  }
  if (trimmed.length > LIMITS.title) {
    throw new ConvexError(`${what} title must be ${LIMITS.title} characters or fewer`);
  }
  return trimmed;
}

export function cleanText(value: string, limit: number, what: string): string | undefined {
  const trimmed = value.trim();
  if (trimmed.length > limit) {
    throw new ConvexError(`${what} must be ${limit.toLocaleString("en-US")} characters or fewer`);
  }
  return trimmed || undefined;
}

export function cleanObjectives(objectives: string[]): string[] {
  const cleaned = objectives.map((o) => o.trim()).filter(Boolean);
  if (cleaned.length > LIMITS.objectives) {
    throw new ConvexError(`A module can have at most ${LIMITS.objectives} objectives`);
  }
  for (const objective of cleaned) {
    if (objective.length > LIMITS.objective) {
      throw new ConvexError(`Each objective must be ${LIMITS.objective} characters or fewer`);
    }
  }
  return cleaned;
}

export function cleanVideoUrl(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (trimmed.length > LIMITS.videoUrl) {
    throw new ConvexError("The video link is too long");
  }
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new ConvexError("Enter a full video link, starting with https://");
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new ConvexError("Enter a full video link, starting with https://");
  }
  return trimmed;
}

export async function uniqueModuleSlug(ctx: QueryCtx, title: string): Promise<string> {
  const base = slugify(title) || "module";
  for (let i = 1; i <= 100; i++) {
    const candidate = i === 1 ? base : `${base}-${i}`;
    const taken = await ctx.db
      .query("modules")
      .withIndex("by_slug", (q) => q.eq("slug", candidate))
      .first();
    if (taken === null) return candidate;
  }
  throw new ConvexError("Too many modules share this title. Pick a different one.");
}

export async function uniqueLessonSlug(
  ctx: QueryCtx,
  moduleId: Id<"modules">,
  title: string,
): Promise<string> {
  const base = slugify(title) || "lesson";
  for (let i = 1; i <= 100; i++) {
    const candidate = i === 1 ? base : `${base}-${i}`;
    const taken = await ctx.db
      .query("lessons")
      .withIndex("by_moduleId_and_slug", (q) => q.eq("moduleId", moduleId).eq("slug", candidate))
      .first();
    if (taken === null) return candidate;
  }
  throw new ConvexError("Too many lessons in this module share this title. Pick a different one.");
}

export function padNumber(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * The caller must be able to view the track. `canEdit` means they hold
 * `track.content` there and may see drafts.
 */
export async function requireTrackViewer(ctx: QueryCtx, trackId: Id<"tracks">) {
  const result = await checkTrackViewer(ctx, trackId);
  if (!result.ok) {
    throw new ConvexError(result.reason);
  }
  return result.viewer;
}

/** Like `requireTrackViewer`, but returns null instead of throwing when the track is off limits. */
export async function getTrackViewer(ctx: QueryCtx, trackId: Id<"tracks">) {
  const result = await checkTrackViewer(ctx, trackId);
  return result.ok ? result.viewer : null;
}

async function checkTrackViewer(ctx: QueryCtx, trackId: Id<"tracks">) {
  const user = await requireUser(ctx);
  const track = await ctx.db.get("tracks", trackId);
  if (track === null) {
    return { ok: false as const, reason: "Track not found" };
  }
  const access = await getTrackAccess(ctx, user, trackId);
  if (!access.canView) {
    return { ok: false as const, reason: "Not authorized for this track" };
  }
  const canEdit = access.permissions.includes("track.content");
  if (track.status !== "active" && !canEdit) {
    return { ok: false as const, reason: "This track is archived" };
  }
  return { ok: true as const, viewer: { user, track, access, canEdit } };
}

export type OutlineUnit = {
  unit: Doc<"units">;
  number: string;
  modules: { module: Doc<"modules">; number: string }[];
};

/**
 * Units and modules in teaching order. Without drafts, units that have no
 * published modules are left out and numbering skips drafts.
 */
export async function loadOutline(
  ctx: QueryCtx,
  trackId: Id<"tracks">,
  includeDrafts: boolean,
): Promise<OutlineUnit[]> {
  const units = await ctx.db
    .query("units")
    .withIndex("by_trackId_and_sortOrder", (q) => q.eq("trackId", trackId))
    .take(MAX_UNITS_PER_TRACK);

  const outline: OutlineUnit[] = [];
  for (const unit of units) {
    const modules = await ctx.db
      .query("modules")
      .withIndex("by_unitId_and_sortOrder", (q) => q.eq("unitId", unit._id))
      .take(MAX_MODULES_PER_UNIT);
    const visible = includeDrafts ? modules : modules.filter((m) => m.status === "published");
    if (visible.length === 0 && !includeDrafts) continue;
    outline.push({
      unit,
      number: padNumber(outline.length + 1),
      modules: visible.map((module, i) => ({ module, number: padNumber(i + 1) })),
    });
  }
  return outline;
}

export function flattenOutline(outline: OutlineUnit[]) {
  return outline.flatMap((entry) =>
    entry.modules.map(({ module, number }) => ({ module, number, unit: entry.unit, unitNumber: entry.number })),
  );
}

export async function loadLessons(ctx: QueryCtx, moduleId: Id<"modules">) {
  return await ctx.db
    .query("lessons")
    .withIndex("by_moduleId_and_sortOrder", (q) => q.eq("moduleId", moduleId))
    .take(MAX_LESSONS_PER_MODULE);
}

export async function completedLessonIds(
  ctx: QueryCtx,
  userId: Id<"users">,
  moduleId: Id<"modules">,
): Promise<Set<Id<"lessons">>> {
  const completions = await ctx.db
    .query("lessonCompletions")
    .withIndex("by_userId_and_moduleId", (q) => q.eq("userId", userId).eq("moduleId", moduleId))
    .take(MAX_LESSONS_PER_MODULE * 2);
  return new Set(completions.map((c) => c.lessonId));
}

/** Per-module progress for one learner across a track. */
export async function loadTrackProgress(ctx: QueryCtx, userId: Id<"users">, trackId: Id<"tracks">) {
  const [lessonCompletions, moduleCompletions] = await Promise.all([
    ctx.db
      .query("lessonCompletions")
      .withIndex("by_userId_and_trackId", (q) => q.eq("userId", userId).eq("trackId", trackId))
      .take(MAX_COMPLETIONS_PER_TRACK),
    ctx.db
      .query("moduleCompletions")
      .withIndex("by_userId_and_trackId", (q) => q.eq("userId", userId).eq("trackId", trackId))
      .take(MAX_COMPLETIONS_PER_TRACK),
  ]);
  const lessonsDone = new Map<Id<"modules">, number>();
  for (const completion of lessonCompletions) {
    lessonsDone.set(completion.moduleId, (lessonsDone.get(completion.moduleId) ?? 0) + 1);
  }
  return {
    lessonsDone,
    modulesDone: new Set(moduleCompletions.map((c) => c.moduleId)),
  };
}

export type ModuleProgress = "complete" | "in_progress" | "not_started";

export function moduleProgress(
  module: Doc<"modules">,
  progress: Awaited<ReturnType<typeof loadTrackProgress>>,
): { progress: ModuleProgress; completedLessons: number } {
  const completedLessons = Math.min(progress.lessonsDone.get(module._id) ?? 0, module.lessonCount);
  if (progress.modulesDone.has(module._id)) {
    return { progress: "complete", completedLessons };
  }
  return { progress: completedLessons > 0 ? "in_progress" : "not_started", completedLessons };
}

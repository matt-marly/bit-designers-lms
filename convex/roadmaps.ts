import { v } from "convex/values";
import { query, type QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { getCurrentUser, getTrackAccess } from "./lib/auth";
import { loadOutline, loadTrackProgress, moduleProgress } from "./lib/curriculum";
import { isMissionSatisfied, latestSubmission, loadMissions, missionStatus } from "./lib/missions";
import { roadmapAccess } from "./lib/roadmaps";
import { applyNodeState, statesMap } from "./lib/roadmapProgress";
import {
  roadmapBadgeValidator,
  roadmapNodeKindValidator,
  roadmapNodeStateValidator,
  roadmapStatusValidator,
} from "./lib/validators";

const nodeValidator = v.object({
  _id: v.id("roadmapNodes"),
  kind: roadmapNodeKindValidator,
  title: v.string(),
  description: v.union(v.string(), v.null()),
  url: v.union(v.string(), v.null()),
  lane: v.string(),
  sortOrder: v.number(),
  badge: roadmapBadgeValidator,
  progress: v.union(v.literal("complete"), v.literal("in_progress"), v.literal("not_started"), v.null()),
  state: roadmapNodeStateValidator,
  href: v.union(v.string(), v.null()),
  meta: v.union(v.string(), v.null()),
});

async function nodeProgress(
  ctx: QueryCtx,
  userId: Id<"users">,
  trackId: Id<"tracks"> | undefined,
  kind: Doc<"roadmapNodes">["kind"],
  refId: string | undefined,
): Promise<{ progress: "complete" | "in_progress" | "not_started" | null; href: string | null; meta: string | null }> {
  if (refId === undefined) return { progress: null, href: null, meta: null };
  try {
    if (kind === "module") {
      const mod = await ctx.db.get("modules", refId as Id<"modules">);
      if (mod === null) return { progress: null, href: null, meta: null };
      const progress = await loadTrackProgress(ctx, userId, mod.trackId);
      const state = moduleProgress(mod, progress);
      return {
        progress: state.progress,
        href: `/learn/${mod.slug}`,
        meta: `${mod.lessonCount} lesson${mod.lessonCount === 1 ? "" : "s"}`,
      };
    }
    if (kind === "lesson") {
      const lesson = await ctx.db.get("lessons", refId as Id<"lessons">);
      if (lesson === null) return { progress: null, href: null, meta: null };
      const mod = await ctx.db.get("modules", lesson.moduleId);
      const done = await ctx.db
        .query("lessonCompletions")
        .withIndex("by_userId_and_lessonId", (q) => q.eq("userId", userId).eq("lessonId", lesson._id))
        .first();
      return {
        progress: done ? "complete" : "not_started",
        href: mod ? `/learn/${mod.slug}/${lesson.slug}` : null,
        meta: "Lesson",
      };
    }
    if (kind === "mission") {
      const mission = await ctx.db.get("missions", refId as Id<"missions">);
      if (mission === null) return { progress: null, href: null, meta: null };
      const latest = await latestSubmission(ctx, userId, mission._id);
      const satisfied = isMissionSatisfied(mission, latest);
      const status = missionStatus(latest);
      return {
        progress: satisfied ? "complete" : status === "not_started" ? "not_started" : "in_progress",
        href: `/missions/${mission.slug}`,
        meta: "Mission",
      };
    }
    if (kind === "resource") {
      const resource = await ctx.db.get("resources", refId as Id<"resources">);
      if (resource === null) return { progress: null, href: null, meta: null };
      return {
        progress: null,
        href: resource.url ?? null,
        meta: resource.category,
      };
    }
    if (kind === "workshop") {
      const workshop = await ctx.db.get("workshops", refId as Id<"workshops">);
      if (workshop === null) return { progress: null, href: null, meta: null };
      return { progress: null, href: "/live", meta: "Live session" };
    }
  } catch {
    return { progress: null, href: null, meta: null };
  }
  return { progress: null, href: null, meta: null };
}

export const list = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("roadmaps"),
      slug: v.string(),
      title: v.string(),
      description: v.union(v.string(), v.null()),
      trackId: v.union(v.id("tracks"), v.null()),
      trackName: v.union(v.string(), v.null()),
      status: roadmapStatusValidator,
      nodeCount: v.number(),
      completedNodes: v.number(),
    }),
  ),
  handler: async (ctx) => {
    // Return empty (not an error) while auth resolves or for signed-out
    // callers: the query re-runs automatically once Convex auth is ready,
    // and proxy.ts keeps signed-out users off this route anyway.
    const user = await getCurrentUser(ctx);
    if (user === null || user.status !== "active") return [];
    const roadmaps = await ctx.db.query("roadmaps").take(100);
    const visible = [];
    for (const roadmap of roadmaps) {
      const access = await roadmapAccess(ctx, user, roadmap);
      if (!access.ok) continue;
      if (roadmap.status !== "published" && !access.canEdit) continue;
      const nodes = await ctx.db
        .query("roadmapNodes")
        .withIndex("by_roadmapId_and_sortOrder", (q) => q.eq("roadmapId", roadmap._id))
        .take(200);
      let trackName: string | null = null;
      if (roadmap.trackId !== undefined) {
        const track = await ctx.db.get("tracks", roadmap.trackId);
        trackName = track?.name ?? null;
      }
      const explicitStates = statesMap(
        await ctx.db
          .query("roadmapNodeStates")
          .withIndex("by_userId_and_roadmapId", (q) => q.eq("userId", user._id).eq("roadmapId", roadmap._id))
          .take(500),
      );
      let completed = 0;
      if (roadmap.trackId !== undefined) {
        const accessTrack = await getTrackAccess(ctx, user, roadmap.trackId);
        if (accessTrack.canView) {
          for (const node of nodes) {
            if (node.kind !== "module" || node.refId === undefined) continue;
            const r = await nodeProgress(ctx, user._id, roadmap.trackId, node.kind, node.refId);
            if (applyNodeState(r.progress, explicitStates.get(node._id)).countsAsComplete) completed += 1;
          }
        }
      }
      const moduleTotal = nodes.filter((n) => n.kind === "module").length;
      visible.push({
        _id: roadmap._id,
        slug: roadmap.slug,
        title: roadmap.title,
        description: roadmap.description ?? null,
        trackId: roadmap.trackId ?? null,
        trackName,
        status: roadmap.status,
        nodeCount: nodes.length,
        completedNodes: completed,
      });
      void moduleTotal;
    }
    return visible.sort((a, b) => a.title.localeCompare(b.title));
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("roadmaps"),
      title: v.string(),
      description: v.union(v.string(), v.null()),
      trackId: v.union(v.id("tracks"), v.null()),
      trackName: v.union(v.string(), v.null()),
      status: roadmapStatusValidator,
      canEdit: v.boolean(),
      totals: v.object({ nodes: v.number(), completedNodes: v.number() }),
      lanes: v.array(
        v.object({
          name: v.string(),
          nodes: v.array(nodeValidator),
        }),
      ),
    }),
  ),
  handler: async (ctx, args) => {
    // Same as `list`: null while auth resolves instead of throwing, so the
    // page shows a loader rather than crashing on transient auth states.
    const user = await getCurrentUser(ctx);
    if (user === null || user.status !== "active") return null;
    const roadmap = await ctx.db
      .query("roadmaps")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (roadmap === null) return null;
    const access = await roadmapAccess(ctx, user, roadmap);
    if (!access.ok) return null;
    if (roadmap.status !== "published" && !access.canEdit) return null;

    const nodes = await ctx.db
      .query("roadmapNodes")
      .withIndex("by_roadmapId_and_sortOrder", (q) => q.eq("roadmapId", roadmap._id))
      .take(200);

    let trackName: string | null = null;
    if (roadmap.trackId !== undefined) {
      const track = await ctx.db.get("tracks", roadmap.trackId);
      trackName = track?.name ?? null;
    }

    const laneMap = new Map<string, Doc<"roadmapNodes">[]>();
    for (const node of nodes) {
      const list = laneMap.get(node.lane) ?? [];
      list.push(node);
      laneMap.set(node.lane, list);
    }

    const explicitStates = statesMap(
      await ctx.db
        .query("roadmapNodeStates")
        .withIndex("by_userId_and_roadmapId", (q) => q.eq("userId", user._id).eq("roadmapId", roadmap._id))
        .take(500),
    );

    let completed = 0;
    const lanes = [];
    for (const [name, laneNodes] of laneMap) {
      const resolved = [];
      for (const node of laneNodes) {
        const r = await nodeProgress(ctx, user._id, roadmap.trackId, node.kind, node.refId);
        const effective = applyNodeState(r.progress, explicitStates.get(node._id));
        if (effective.countsAsComplete) completed += 1;
        resolved.push({
          _id: node._id,
          kind: node.kind,
          title: node.title,
          description: node.description ?? null,
          url: node.url ?? r.href,
          lane: node.lane,
          sortOrder: node.sortOrder,
          badge: node.badge,
          progress: effective.progress,
          state: effective.state,
          href: node.url ?? r.href,
          meta: r.meta,
        });
      }
      lanes.push({ name, nodes: resolved });
    }

    void loadOutline;
    void loadMissions;
    return {
      _id: roadmap._id,
      title: roadmap.title,
      description: roadmap.description ?? null,
      trackId: roadmap.trackId ?? null,
      trackName,
      status: roadmap.status,
      canEdit: access.canEdit,
      totals: { nodes: nodes.length, completedNodes: completed },
      lanes,
    };
  },
});

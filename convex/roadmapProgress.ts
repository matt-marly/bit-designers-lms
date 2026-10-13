import { ConvexError, v } from "convex/values";
import { mutation, query, type QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { getCurrentUser, requireUser } from "./lib/auth";
import { loadLessons } from "./lib/curriculum";
import { latestSubmission } from "./lib/missions";
import { roadmapAccess } from "./lib/roadmaps";
import { statesMap } from "./lib/roadmapProgress";
import { roadmapNodeStateValidator } from "./lib/validators";

const MAX_STATES = 500;

async function loadStates(ctx: QueryCtx, userId: Id<"users">, roadmapId: Id<"roadmaps">) {
  const states = await ctx.db
    .query("roadmapNodeStates")
    .withIndex("by_userId_and_roadmapId", (q) => q.eq("userId", userId).eq("roadmapId", roadmapId))
    .take(MAX_STATES);
  return statesMap(states);
}

const detailValidator = v.union(
  v.null(),
  v.object({
    kind: v.string(),
    title: v.string(),
    description: v.union(v.string(), v.null()),
    href: v.union(v.string(), v.null()),
    meta: v.union(v.string(), v.null()),
    videoUrl: v.union(v.string(), v.null()),
    objectives: v.array(v.string()),
    rubric: v.array(v.string()),
    lessons: v.array(
      v.object({ title: v.string(), href: v.string(), completed: v.boolean() }),
    ),
  }),
);

/**
 * Full drawer payload for one roadmap node: the node itself, resolved
 * curriculum detail for the Recommended card, related track resources,
 * and the learner's effective state.
 */
export const getNodeDetail = query({
  args: { roadmapSlug: v.string(), nodeId: v.id("roadmapNodes") },
  returns: v.union(
    v.null(),
    v.object({
      node: v.object({
        _id: v.id("roadmapNodes"),
        kind: v.string(),
        title: v.string(),
        description: v.union(v.string(), v.null()),
        url: v.union(v.string(), v.null()),
        lane: v.string(),
        badge: v.string(),
        href: v.union(v.string(), v.null()),
        state: roadmapNodeStateValidator,
      }),
      detail: detailValidator,
      related: v.array(
        v.object({
          title: v.string(),
          href: v.union(v.string(), v.null()),
          meta: v.union(v.string(), v.null()),
          kind: v.string(),
        }),
      ),
    }),
  ),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (user === null || user.status !== "active") return null;
    const roadmap = await ctx.db
      .query("roadmaps")
      .withIndex("by_slug", (q) => q.eq("slug", args.roadmapSlug))
      .unique();
    if (roadmap === null) return null;
    const access = await roadmapAccess(ctx, user, roadmap);
    if (!access.ok) return null;
    if (roadmap.status !== "published" && !access.canEdit) return null;

    const node = await ctx.db.get("roadmapNodes", args.nodeId);
    if (node === null || node.roadmapId !== roadmap._id) return null;

    const states = await loadStates(ctx, user._id, roadmap._id);
    const explicit = states.get(node._id);
    const state = explicit ?? "learning";

    let href: string | null = node.url ?? null;
    type Detail = {
      kind: string;
      title: string;
      description: string | null;
      href: string | null;
      meta: string | null;
      videoUrl: string | null;
      objectives: string[];
      rubric: string[];
      lessons: { title: string; href: string; completed: boolean }[];
    };
    const empty: Detail = {
      kind: node.kind,
      title: node.title,
      description: node.description ?? null,
      href: null,
      meta: null,
      videoUrl: null,
      objectives: [],
      rubric: [],
      lessons: [],
    };
    let detail: Detail = empty;

    if (node.kind === "module" && node.refId !== undefined) {
      const mod = await ctx.db.get("modules", node.refId as Id<"modules">);
      if (mod) {
        const lessons = await loadLessons(ctx, mod._id);
        const done = new Set(
          (
            await ctx.db
              .query("lessonCompletions")
              .withIndex("by_userId_and_moduleId", (q) => q.eq("userId", user._id).eq("moduleId", mod._id))
              .take(100)
          ).map((c) => c.lessonId),
        );
        detail = {
          ...empty,
          description: node.description ?? mod.description ?? null,
          href: `/learn/${mod.slug}`,
          meta: `${mod.lessonCount} lesson${mod.lessonCount === 1 ? "" : "s"}`,
          objectives: mod.objectives,
          lessons: lessons.map((l) => ({
            title: l.title,
            href: `/learn/${mod.slug}/${l.slug}`,
            completed: done.has(l._id),
          })),
        };
        href = detail.href;
      } else {
        detail = empty;
      }
    } else if (node.kind === "lesson" && node.refId !== undefined) {
      const lesson = await ctx.db.get("lessons", node.refId as Id<"lessons">);
      if (lesson) {
        const mod = await ctx.db.get("modules", lesson.moduleId);
        detail = {
          ...empty,
          description: node.description ?? lesson.summary ?? null,
          href: mod ? `/learn/${mod.slug}/${lesson.slug}` : null,
          meta: "Lesson",
          videoUrl: lesson.videoUrl ?? null,
        };
        href = detail.href;
      } else {
        detail = empty;
      }
    } else if (node.kind === "mission" && node.refId !== undefined) {
      const mission = await ctx.db.get("missions", node.refId as Id<"missions">);
      if (mission) {
        const latest = await latestSubmission(ctx, user._id, mission._id);
        detail = {
          ...empty,
          description: node.description ?? mission.brief.slice(0, 500),
          href: `/missions/${mission.slug}`,
          meta: latest ? `Attempt ${latest.version}` : "Not started",
          rubric: mission.rubric,
        };
        href = detail.href;
      } else {
        detail = empty;
      }
    } else if (node.kind === "resource" && node.refId !== undefined) {
      const resource = await ctx.db.get("resources", node.refId as Id<"resources">);
      detail = {
        ...empty,
        description: node.description ?? resource?.description ?? null,
        href: resource?.url ?? node.url ?? null,
        meta: resource?.category ?? null,
      };
      href = detail.href;
    } else if (node.kind === "workshop" && node.refId !== undefined) {
      const workshop = await ctx.db.get("workshops", node.refId as Id<"workshops">);
      detail = { ...empty, href: "/live", meta: workshop ? "Live session" : null };
      href = detail.href;
    } else {
      detail = { ...empty, href: node.url ?? null, meta: node.url ? "External link" : null };
    }

    // Related track resources: same track (or global guides), excluding the node itself.
    const allResources = await ctx.db.query("resources").take(100);
    const related = [];
    for (const r of allResources) {
      if (roadmap.trackId !== undefined) {
        if (r.trackId !== undefined && r.trackId !== roadmap.trackId) continue;
      } else if (r.trackId !== undefined) {
        continue;
      }
      if (node.kind === "resource" && node.refId === r._id) continue;
      if (!r.url) continue;
      related.push({ title: r.title, href: r.url, meta: r.category, kind: "resource" });
      if (related.length >= 6) break;
    }

    return {
      node: {
        _id: node._id,
        kind: node.kind,
        title: node.title,
        description: node.description ?? null,
        url: node.url ?? null,
        lane: node.lane,
        badge: node.badge,
        href,
        state,
      },
      detail,
      related,
    };
  },
});

export const setNodeState = mutation({
  args: { nodeId: v.id("roadmapNodes"), state: roadmapNodeStateValidator },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const node = await ctx.db.get("roadmapNodes", args.nodeId);
    if (node === null) throw new ConvexError("Node not found");
    const roadmap = await ctx.db.get("roadmaps", node.roadmapId);
    if (roadmap === null) throw new ConvexError("Roadmap not found");
    const access = await roadmapAccess(ctx, user, roadmap);
    if (!access.ok) throw new ConvexError("Not authorized for this roadmap");

    const existing = await ctx.db
      .query("roadmapNodeStates")
      .withIndex("by_userId_and_nodeId", (q) => q.eq("userId", user._id).eq("nodeId", node._id))
      .unique();
    if (args.state === "learning") {
      if (existing) await ctx.db.delete("roadmapNodeStates", existing._id);
    } else if (existing) {
      await ctx.db.patch("roadmapNodeStates", existing._id, { state: args.state, updatedAt: Date.now() });
    } else {
      await ctx.db.insert("roadmapNodeStates", {
        userId: user._id,
        roadmapId: roadmap._id,
        nodeId: node._id,
        state: args.state,
        updatedAt: Date.now(),
      });
    }
    return null;
  },
});

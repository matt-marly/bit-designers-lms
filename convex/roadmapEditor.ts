import { ConvexError, v } from "convex/values";
import { mutation, query, type QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { requireUser } from "./lib/auth";
import { loadOutline } from "./lib/curriculum";
import {
  cleanLane,
  MAX_NODES_PER_ROADMAP,
  requireRoadmapEditor,
  requireRoadmapViewer,
  roadmapAccess,
  uniqueRoadmapSlug,
} from "./lib/roadmaps";
import {
  roadmapBadgeValidator,
  roadmapNodeKindValidator,
  roadmapStatusValidator,
} from "./lib/validators";

async function nextSortOrder(ctx: QueryCtx, roadmapId: Id<"roadmaps">) {
  const nodes = await ctx.db
    .query("roadmapNodes")
    .withIndex("by_roadmapId_and_sortOrder", (q) => q.eq("roadmapId", roadmapId))
    .take(MAX_NODES_PER_ROADMAP);
  return nodes.length === 0 ? 0 : Math.max(...nodes.map((n) => n.sortOrder)) + 1;
}

export const listEditable = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("roadmaps"),
      slug: v.string(),
      title: v.string(),
      trackId: v.union(v.id("tracks"), v.null()),
      trackName: v.union(v.string(), v.null()),
      status: roadmapStatusValidator,
      nodeCount: v.number(),
    }),
  ),
  handler: async (ctx) => {
    const me = await requireUser(ctx);
    const roadmaps = await ctx.db.query("roadmaps").take(100);
    const out = [];
    for (const roadmap of roadmaps) {
      const access = await roadmapAccess(ctx, me, roadmap);
      if (!access.ok || !access.canEdit) continue;
      let trackName: string | null = null;
      if (roadmap.trackId !== undefined) {
        trackName = (await ctx.db.get("tracks", roadmap.trackId))?.name ?? null;
      }
      const total = (
        await ctx.db
          .query("roadmapNodes")
          .withIndex("by_roadmapId_and_sortOrder", (q) => q.eq("roadmapId", roadmap._id))
          .take(MAX_NODES_PER_ROADMAP)
      ).length;
      out.push({
        _id: roadmap._id,
        slug: roadmap.slug,
        title: roadmap.title,
        trackId: roadmap.trackId ?? null,
        trackName,
        status: roadmap.status,
        nodeCount: total,
      });
    }
    return out.sort((a, b) => a.title.localeCompare(b.title));
  },
});

export const createRoadmap = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    trackId: v.optional(v.id("tracks")),
  },
  returns: v.object({ roadmapId: v.id("roadmaps"), slug: v.string() }),
  handler: async (ctx, args) => {
    const title = args.title.trim();
    if (!title) throw new ConvexError("Roadmap title is required");
    if (title.length > 120) throw new ConvexError("Roadmap title must be 120 characters or fewer");
    await requireRoadmapEditor(ctx, args.trackId);
    const slug = await uniqueRoadmapSlug(ctx, title);
    const existing = await ctx.db.query("roadmaps").take(MAX_NODES_PER_ROADMAP);
    const roadmapId = await ctx.db.insert("roadmaps", {
      title,
      slug,
      description: args.description?.trim() || undefined,
      trackId: args.trackId,
      status: "draft",
      showInLibrary: true,
      sortOrder: existing.length,
    });
    return { roadmapId, slug };
  },
});

export const setStatus = mutation({
  args: { roadmapId: v.id("roadmaps"), status: roadmapStatusValidator },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { roadmap } = await requireRoadmapViewer(ctx, args.roadmapId);
    await requireRoadmapEditor(ctx, roadmap.trackId);
    await ctx.db.patch("roadmaps", args.roadmapId, { status: args.status, updatedAt: Date.now() });
    return null;
  },
});

export const updateRoadmap = mutation({
  args: {
    roadmapId: v.id("roadmaps"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { roadmap } = await requireRoadmapViewer(ctx, args.roadmapId);
    await requireRoadmapEditor(ctx, roadmap.trackId);
    const patch: { title?: string; description?: string; updatedAt: number } = { updatedAt: Date.now() };
    if (args.title !== undefined) {
      const title = args.title.trim();
      if (!title) throw new ConvexError("Roadmap title is required");
      if (title.length > 120) throw new ConvexError("Roadmap title must be 120 characters or fewer");
      patch.title = title;
    }
    if (args.description !== undefined) {
      const description = args.description.trim();
      if (description.length > 2000) throw new ConvexError("Description must be 2,000 characters or fewer");
      patch.description = description;
    }
    await ctx.db.patch("roadmaps", args.roadmapId, patch);
    return null;
  },
});

export const deleteRoadmap = mutation({
  args: { roadmapId: v.id("roadmaps") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { roadmap } = await requireRoadmapViewer(ctx, args.roadmapId);
    await requireRoadmapEditor(ctx, roadmap.trackId);
    const nodes = await ctx.db
      .query("roadmapNodes")
      .withIndex("by_roadmapId_and_sortOrder", (q) => q.eq("roadmapId", args.roadmapId))
      .take(MAX_NODES_PER_ROADMAP);
    for (const node of nodes) await ctx.db.delete("roadmapNodes", node._id);
    await ctx.db.delete("roadmaps", args.roadmapId);
    return null;
  },
});

/** Builds lane nodes from the track's published outline. Keeps custom nodes on re-runs. */
export const generateFromTrack = mutation({
  args: { roadmapId: v.id("roadmaps") },
  returns: v.object({ nodes: v.number() }),
  handler: async (ctx, args) => {
    const { roadmap } = await requireRoadmapViewer(ctx, args.roadmapId);
    if (roadmap.trackId === undefined) throw new ConvexError("Only track roadmaps can be generated");
    await requireRoadmapEditor(ctx, roadmap.trackId);
    const outline = await loadOutline(ctx, roadmap.trackId, false);

    const existing = await ctx.db
      .query("roadmapNodes")
      .withIndex("by_roadmapId_and_sortOrder", (q) => q.eq("roadmapId", args.roadmapId))
      .take(MAX_NODES_PER_ROADMAP);
    const generatedRefs = new Set(existing.filter((n) => n.kind === "module").map((n) => n.refId));

    let sortOrder =
      existing.length === 0 ? 0 : Math.max(...existing.map((n) => n.sortOrder)) + 1;
    let added = 0;
    for (const unit of outline) {
      for (const { module } of unit.modules) {
        if (generatedRefs.has(module._id)) continue;
        if (existing.length + added >= MAX_NODES_PER_ROADMAP) break;
        await ctx.db.insert("roadmapNodes", {
          roadmapId: args.roadmapId,
          kind: "module",
          refId: module._id,
          title: module.title,
          description: module.description ?? undefined,
          lane: cleanLane(unit.unit.title),
          sortOrder,
          badge: "required",
        });
        sortOrder += 1;
        added += 1;
      }
    }
    await ctx.db.patch("roadmaps", args.roadmapId, { updatedAt: Date.now() });
    return { nodes: added };
  },
});

/** Adds new modules, drops nodes pointing at deleted/draft modules. Keeps custom nodes. */
export const syncFromTrack = mutation({
  args: { roadmapId: v.id("roadmaps") },
  returns: v.object({ added: v.number(), removed: v.number() }),
  handler: async (ctx, args) => {
    const { roadmap } = await requireRoadmapViewer(ctx, args.roadmapId);
    if (roadmap.trackId === undefined) throw new ConvexError("Only track roadmaps can be synced");
    await requireRoadmapEditor(ctx, roadmap.trackId);
    const outline = await loadOutline(ctx, roadmap.trackId, false);
    const live = new Map(outline.flatMap((u) => u.modules.map(({ module }) => [module._id, { module, lane: u.unit.title }])));
    const existing = await ctx.db
      .query("roadmapNodes")
      .withIndex("by_roadmapId_and_sortOrder", (q) => q.eq("roadmapId", args.roadmapId))
      .take(MAX_NODES_PER_ROADMAP);

    let removed = 0;
    for (const node of existing) {
      if (node.kind !== "module" || node.refId === undefined) continue;
      if (!live.has(node.refId as never)) {
        await ctx.db.delete("roadmapNodes", node._id);
        removed += 1;
      }
    }
    let sortOrder =
      existing.length === 0 ? 0 : Math.max(...existing.map((n) => n.sortOrder)) + 1;
    const kept = new Set(
      (
        await ctx.db
          .query("roadmapNodes")
          .withIndex("by_roadmapId_and_sortOrder", (q) => q.eq("roadmapId", args.roadmapId))
          .take(MAX_NODES_PER_ROADMAP)
      )
        .filter((n) => n.kind === "module")
        .map((n) => n.refId),
    );
    let added = 0;
    for (const [id, entry] of live) {
      if (kept.has(id)) continue;
      await ctx.db.insert("roadmapNodes", {
        roadmapId: args.roadmapId,
        kind: "module",
        refId: id,
        title: entry.module.title,
        lane: cleanLane(entry.lane),
        sortOrder,
        badge: "required",
      });
      sortOrder += 1;
      added += 1;
    }
    await ctx.db.patch("roadmaps", args.roadmapId, { updatedAt: Date.now() });
    return { added, removed };
  },
});

export const addCustomNode = mutation({
  args: {
    roadmapId: v.id("roadmaps"),
    title: v.string(),
    description: v.optional(v.string()),
    url: v.optional(v.string()),
    lane: v.optional(v.string()),
    badge: v.optional(roadmapBadgeValidator),
  },
  returns: v.id("roadmapNodes"),
  handler: async (ctx, args) => {
    const { roadmap } = await requireRoadmapViewer(ctx, args.roadmapId);
    await requireRoadmapEditor(ctx, roadmap.trackId);
    const title = args.title.trim();
    if (!title) throw new ConvexError("Node title is required");
    if (title.length > 120) throw new ConvexError("Node title must be 120 characters or fewer");
    if (args.url !== undefined) {
      try {
        const url = new URL(args.url);
        if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error();
      } catch {
        throw new ConvexError("Enter a full link, starting with https://");
      }
    }
    return await ctx.db.insert("roadmapNodes", {
      roadmapId: args.roadmapId,
      kind: "custom",
      title,
      description: args.description?.trim() || undefined,
      url: args.url?.trim() || undefined,
      lane: cleanLane(args.lane ?? "General"),
      sortOrder: await nextSortOrder(ctx, args.roadmapId),
      badge: args.badge ?? "required",
    });
  },
});

export const updateNode = mutation({
  args: {
    nodeId: v.id("roadmapNodes"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    url: v.optional(v.string()),
    lane: v.optional(v.string()),
    badge: v.optional(roadmapBadgeValidator),
    kind: v.optional(roadmapNodeKindValidator),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const node = await ctx.db.get("roadmapNodes", args.nodeId);
    if (node === null) throw new ConvexError("Node not found");
    const { roadmap } = await requireRoadmapViewer(ctx, node.roadmapId);
    await requireRoadmapEditor(ctx, roadmap.trackId);
    const patch: Record<string, unknown> = {};
    if (args.title !== undefined) {
      const title = args.title.trim();
      if (!title) throw new ConvexError("Node title is required");
      if (title.length > 120) throw new ConvexError("Node title must be 120 characters or fewer");
      patch.title = title;
    }
    if (args.description !== undefined) patch.description = args.description.trim() || undefined;
    if (args.url !== undefined) patch.url = args.url.trim() || undefined;
    if (args.lane !== undefined) patch.lane = cleanLane(args.lane);
    if (args.badge !== undefined) patch.badge = args.badge;
    if (args.kind !== undefined) patch.kind = args.kind;
    await ctx.db.patch("roadmapNodes", args.nodeId, patch);
    return null;
  },
});

export const moveNode = mutation({
  args: {
    nodeId: v.id("roadmapNodes"),
    direction: v.union(v.literal("up"), v.literal("down")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const node = await ctx.db.get("roadmapNodes", args.nodeId);
    if (node === null) throw new ConvexError("Node not found");
    const { roadmap } = await requireRoadmapViewer(ctx, node.roadmapId);
    await requireRoadmapEditor(ctx, roadmap.trackId);
    const siblings = await ctx.db
      .query("roadmapNodes")
      .withIndex("by_roadmapId_and_sortOrder", (q) => q.eq("roadmapId", node.roadmapId))
      .take(MAX_NODES_PER_ROADMAP);
    const lane = siblings.filter((n) => n.lane === node.lane).sort((a, b) => a.sortOrder - b.sortOrder);
    const index = lane.findIndex((n) => n._id === node._id);
    const swap = args.direction === "up" ? lane[index - 1] : lane[index + 1];
    if (swap === undefined) return null;
    await ctx.db.patch("roadmapNodes", node._id, { sortOrder: swap.sortOrder });
    await ctx.db.patch("roadmapNodes", swap._id, { sortOrder: node.sortOrder });
    return null;
  },
});

export const removeNode = mutation({
  args: { nodeId: v.id("roadmapNodes") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const node = await ctx.db.get("roadmapNodes", args.nodeId);
    if (node === null) throw new ConvexError("Node not found");
    const { roadmap } = await requireRoadmapViewer(ctx, node.roadmapId);
    await requireRoadmapEditor(ctx, roadmap.trackId);
    await ctx.db.delete("roadmapNodes", args.nodeId);
    return null;
  },
});

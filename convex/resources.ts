import { ConvexError, v } from "convex/values";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { resourceKindValidator } from "./schema";
import { requirePlatformPermission, requireUser } from "./lib/auth";
import { getTrackViewer } from "./lib/curriculum";
import { cleanHttpUrl, cleanText, requireText } from "./lib/urls";
import {
  MAX_RESOURCE_FILE_BYTES,
  RESOURCE_CATEGORIES,
  RESOURCE_FILE_TYPES,
  RESOURCE_LIMITS,
  type ResourceKind,
} from "./lib/resources";

const MAX_RESOURCES_PER_KIND = 500;
const MAX_TRACKS = 200;

const resourceValidator = v.object({
  _id: v.id("resources"),
  kind: resourceKindValidator,
  category: v.string(),
  title: v.string(),
  description: v.union(v.string(), v.null()),
  resourceType: v.union(v.literal("link"), v.literal("file")),
  /** The link, or a download URL for uploaded files. */
  url: v.union(v.string(), v.null()),
  fileName: v.union(v.string(), v.null()),
  meta: v.union(v.string(), v.null()),
  source: v.union(v.string(), v.null()),
  trackId: v.union(v.id("tracks"), v.null()),
});

const resourceFields = {
  category: v.string(),
  title: v.string(),
  description: v.optional(v.string()),
  resourceType: v.union(v.literal("link"), v.literal("file")),
  url: v.optional(v.string()),
  fileId: v.optional(v.id("_storage")),
  fileName: v.optional(v.string()),
  meta: v.optional(v.string()),
  source: v.optional(v.string()),
  trackId: v.optional(v.id("tracks")),
};

type ResourceInput = {
  category: string;
  title: string;
  description?: string;
  resourceType: "link" | "file";
  url?: string;
  fileId?: Id<"_storage">;
  fileName?: string;
  meta?: string;
  source?: string;
  trackId?: Id<"tracks">;
};

const resultValidator = v.union(
  v.object({ ok: v.literal(true), resourceId: v.id("resources") }),
  v.object({ ok: v.literal(false), error: v.string() }),
);

async function toResource(ctx: QueryCtx, doc: Doc<"resources">) {
  const url = doc.resourceType === "file" ? (doc.fileId ? await ctx.storage.getUrl(doc.fileId) : null) : (doc.url ?? null);
  return {
    _id: doc._id,
    kind: doc.kind,
    category: doc.category,
    title: doc.title,
    description: doc.description ?? null,
    resourceType: doc.resourceType,
    url,
    fileName: doc.fileName ?? null,
    meta: doc.meta ?? null,
    source: doc.source ?? null,
    trackId: doc.trackId ?? null,
  };
}

async function loadKind(ctx: QueryCtx, kind: ResourceKind) {
  return await ctx.db
    .query("resources")
    .withIndex("by_kind_and_sortOrder", (q) => q.eq("kind", kind))
    .take(MAX_RESOURCES_PER_KIND);
}

/** Checks a new upload. Returns an error message instead of throwing so the caller can delete the file. */
async function checkUpload(ctx: MutationCtx, fileId: Id<"_storage">) {
  const file = await ctx.db.system.get("_storage", fileId);
  if (file === null) return "The file didn't finish uploading. Try again.";
  if (file.size > MAX_RESOURCE_FILE_BYTES) return "Files must be 20 MB or smaller";
  if (!(RESOURCE_FILE_TYPES as readonly string[]).includes(file.contentType ?? "")) return "Upload a PDF";
  return null;
}

async function cleanResource(ctx: MutationCtx, kind: ResourceKind, input: ResourceInput) {
  if (!RESOURCE_CATEGORIES[kind].some((c) => c.id === input.category)) {
    throw new ConvexError("Pick a section");
  }
  if (input.trackId !== undefined && (await ctx.db.get("tracks", input.trackId)) === null) {
    throw new ConvexError("Track not found");
  }
  const base = {
    category: input.category,
    title: requireText(input.title, RESOURCE_LIMITS.title, "Title"),
    description: cleanText(input.description, RESOURCE_LIMITS.description, "Description"),
    meta: cleanText(input.meta, RESOURCE_LIMITS.meta, "Length"),
    source: cleanText(input.source, RESOURCE_LIMITS.source, "Source"),
    trackId: input.trackId,
  };
  if (input.resourceType === "link") {
    return { ...base, resourceType: "link" as const, url: cleanHttpUrl(input.url ?? "", "link") };
  }
  if (kind === "reference") {
    throw new ConvexError("References must be links");
  }
  return {
    ...base,
    resourceType: "file" as const,
    fileName: cleanText(input.fileName, RESOURCE_LIMITS.fileName, "File name"),
  };
}

/** Validates the fields, deleting a fresh upload if they're rejected. */
async function cleanOrDiscard(
  ctx: MutationCtx,
  kind: ResourceKind,
  input: ResourceInput,
  freshUpload: Id<"_storage"> | undefined,
) {
  try {
    return { ok: true as const, fields: await cleanResource(ctx, kind, input) };
  } catch (err) {
    if (!(err instanceof ConvexError) || !freshUpload) throw err;
    await ctx.storage.delete(freshUpload).catch(() => undefined);
    return { ok: false as const, error: String(err.data) };
  }
}

export const list = query({
  args: { kind: resourceKindValidator, trackId: v.optional(v.id("tracks")) },
  returns: v.array(resourceValidator),
  handler: async (ctx, args) => {
    await requireUser(ctx);
    const visibleTrackId = args.trackId && (await getTrackViewer(ctx, args.trackId)) !== null ? args.trackId : null;
    const docs = await loadKind(ctx, args.kind);
    const visible = docs.filter((d) => d.trackId === undefined || d.trackId === visibleTrackId);
    return await Promise.all(visible.map((d) => toResource(ctx, d)));
  },
});

export const listForAdmin = query({
  args: { kind: resourceKindValidator },
  returns: v.object({
    resources: v.array(resourceValidator),
    tracks: v.array(v.object({ _id: v.id("tracks"), name: v.string() })),
  }),
  handler: async (ctx, args) => {
    await requirePlatformPermission(ctx, "resources.manage");
    const [docs, tracks] = await Promise.all([loadKind(ctx, args.kind), ctx.db.query("tracks").take(MAX_TRACKS)]);
    return {
      resources: await Promise.all(docs.map((d) => toResource(ctx, d))),
      tracks: tracks.map((t) => ({ _id: t._id, name: t.name })),
    };
  },
});

export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    await requirePlatformPermission(ctx, "resources.manage");
    return await ctx.storage.generateUploadUrl();
  },
});

export const create = mutation({
  args: { kind: resourceKindValidator, ...resourceFields },
  returns: resultValidator,
  handler: async (ctx, args) => {
    const user = await requirePlatformPermission(ctx, "resources.manage");
    const { kind, fileId, ...input } = args;
    if (input.resourceType === "file") {
      if (!fileId) throw new ConvexError("Upload a PDF");
      const error = await checkUpload(ctx, fileId);
      if (error !== null) {
        await ctx.storage.delete(fileId).catch(() => undefined);
        return { ok: false as const, error };
      }
    }
    const cleaned = await cleanOrDiscard(ctx, kind, input, input.resourceType === "file" ? fileId : undefined);
    if (!cleaned.ok) return cleaned;
    const fields = cleaned.fields;
    const last = await ctx.db
      .query("resources")
      .withIndex("by_kind_and_sortOrder", (q) => q.eq("kind", kind))
      .order("desc")
      .first();
    const resourceId = await ctx.db.insert("resources", {
      ...fields,
      kind,
      fileId: fields.resourceType === "file" ? fileId : undefined,
      sortOrder: (last?.sortOrder ?? 0) + 1,
      createdBy: user._id,
    });
    return { ok: true as const, resourceId };
  },
});

/** Pass `fileId` only when replacing the file; the old one is deleted. */
export const update = mutation({
  args: { resourceId: v.id("resources"), ...resourceFields },
  returns: resultValidator,
  handler: async (ctx, args) => {
    await requirePlatformPermission(ctx, "resources.manage");
    const { resourceId, fileId, ...input } = args;
    const resource = await ctx.db.get("resources", resourceId);
    if (resource === null) {
      throw new ConvexError("Resource not found");
    }

    let nextFileId: Id<"_storage"> | undefined = resource.fileId;
    if (input.resourceType === "file") {
      if (fileId && fileId !== resource.fileId) {
        const error = await checkUpload(ctx, fileId);
        if (error !== null) {
          await ctx.storage.delete(fileId).catch(() => undefined);
          return { ok: false as const, error };
        }
        nextFileId = fileId;
      }
      if (!nextFileId) throw new ConvexError("Upload a PDF");
    } else {
      nextFileId = undefined;
    }

    const cleaned = await cleanOrDiscard(
      ctx,
      resource.kind,
      input,
      nextFileId !== resource.fileId ? nextFileId : undefined,
    );
    if (!cleaned.ok) return cleaned;
    const fields = cleaned.fields;
    if (resource.fileId && resource.fileId !== nextFileId) {
      await ctx.storage.delete(resource.fileId).catch(() => undefined);
    }
    await ctx.db.replace("resources", resource._id, {
      ...fields,
      kind: resource.kind,
      fileId: nextFileId,
      sortOrder: resource.sortOrder,
      createdBy: resource.createdBy,
    });
    return { ok: true as const, resourceId: resource._id };
  },
});

export const remove = mutation({
  args: { resourceId: v.id("resources") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requirePlatformPermission(ctx, "resources.manage");
    const resource = await ctx.db.get("resources", args.resourceId);
    if (resource === null) {
      throw new ConvexError("Resource not found");
    }
    if (resource.fileId) {
      await ctx.storage.delete(resource.fileId).catch(() => undefined);
    }
    await ctx.db.delete("resources", resource._id);
    return null;
  },
});

/** Swaps the resource with its neighbour in the same section. */
export const move = mutation({
  args: { resourceId: v.id("resources"), direction: v.union(v.literal("up"), v.literal("down")) },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requirePlatformPermission(ctx, "resources.manage");
    const resource = await ctx.db.get("resources", args.resourceId);
    if (resource === null) {
      throw new ConvexError("Resource not found");
    }
    const siblings = (await loadKind(ctx, resource.kind)).filter((r) => r.category === resource.category);
    const index = siblings.findIndex((r) => r._id === resource._id);
    const neighbour = siblings[args.direction === "up" ? index - 1 : index + 1];
    if (!neighbour) return null;
    await ctx.db.patch("resources", resource._id, { sortOrder: neighbour.sortOrder });
    await ctx.db.patch("resources", neighbour._id, { sortOrder: resource.sortOrder });
    return null;
  },
});

import { ConvexError, v } from "convex/values";
import { paginationOptsValidator, paginationResultValidator } from "convex/server";
import { internal } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";
import {
  env,
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  MutationCtx,
  query,
  QueryCtx,
} from "./_generated/server";
import schema from "./schema";
import { hasPlatformPermission, normalizeEmail, requireUser } from "./lib/auth";
import { applyGrants, assertCanGrant, Grants } from "./lib/grants";
import {
  platformPermissionValidator,
  platformRoleValidator,
  trackGrantValidator,
} from "./lib/validators";

const OPEN_STATUSES = ["pending", "sending", "sent", "failed"] as const;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function findOpenInvitation(
  ctx: QueryCtx,
  email: string,
): Promise<Doc<"invitations"> | null> {
  for (const status of OPEN_STATUSES) {
    const invitation = await ctx.db
      .query("invitations")
      .withIndex("by_email_and_status", (q) => q.eq("email", email).eq("status", status))
      .first();
    if (invitation !== null) {
      return invitation;
    }
  }
  return null;
}

/** Inserts an invitation and schedules the Clerk email. Callers must check permissions first. */
export async function createAndSend(
  ctx: MutationCtx,
  email: string,
  grants: Grants,
  invitedBy: Id<"users"> | undefined,
): Promise<Id<"invitations">> {
  if (await findOpenInvitation(ctx, email)) {
    throw new ConvexError(`${email} already has an open invitation. Revoke it first.`);
  }
  const invitationId = await ctx.db.insert("invitations", {
    email,
    invitedBy,
    status: "pending",
    ...grants,
  });
  await ctx.scheduler.runAfter(0, internal.invitations.sendClerkInvite, { invitationId });
  return invitationId;
}

async function requireInvitationManager(ctx: QueryCtx, invitation: Doc<"invitations">) {
  const user = await requireUser(ctx);
  if (invitation.invitedBy !== user._id && !hasPlatformPermission(user, "invites.manage")) {
    throw new ConvexError("Not authorized");
  }
  return user;
}

export const create = mutation({
  args: {
    email: v.string(),
    platformRole: platformRoleValidator,
    permissions: v.array(platformPermissionValidator),
    trackGrants: v.array(trackGrantValidator),
  },
  returns: v.union(v.literal("sent"), v.literal("applied")),
  handler: async (ctx, args) => {
    const inviter = await requireUser(ctx);
    const email = normalizeEmail(args.email);
    if (!EMAIL_PATTERN.test(email)) {
      throw new ConvexError("Enter a valid email address");
    }
    const grants: Grants = {
      platformRole: args.platformRole,
      permissions: args.permissions,
      trackGrants: args.trackGrants,
    };
    await assertCanGrant(ctx, inviter, grants);

    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    if (existingUser !== null) {
      await applyGrants(ctx, existingUser, grants);
      await ctx.db.insert("invitations", {
        email,
        invitedBy: inviter._id,
        status: "accepted",
        acceptedBy: existingUser._id,
        ...grants,
      });
      return "applied" as const;
    }

    await createAndSend(ctx, email, grants, inviter._id);
    return "sent" as const;
  },
});

export const revoke = mutation({
  args: { invitationId: v.id("invitations") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const invitation = await ctx.db.get("invitations", args.invitationId);
    if (invitation === null) {
      throw new ConvexError("Invitation not found");
    }
    await requireInvitationManager(ctx, invitation);
    if (!(OPEN_STATUSES as readonly string[]).includes(invitation.status)) {
      throw new ConvexError("This invitation can no longer be revoked");
    }
    await ctx.db.patch("invitations", invitation._id, {
      status: "revoked",
      updatedAt: Date.now(),
    });
    if (invitation.clerkInvitationId !== undefined) {
      await ctx.scheduler.runAfter(0, internal.invitations.revokeClerkInvite, {
        clerkInvitationId: invitation.clerkInvitationId,
      });
    }
    return null;
  },
});

export const resend = mutation({
  args: { invitationId: v.id("invitations") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const invitation = await ctx.db.get("invitations", args.invitationId);
    if (invitation === null) {
      throw new ConvexError("Invitation not found");
    }
    await requireInvitationManager(ctx, invitation);
    if (invitation.status !== "sent" && invitation.status !== "failed") {
      throw new ConvexError("Only sent or failed invitations can be resent");
    }
    await ctx.db.patch("invitations", invitation._id, {
      status: "pending",
      error: undefined,
      updatedAt: Date.now(),
    });
    await ctx.scheduler.runAfter(0, internal.invitations.sendClerkInvite, {
      invitationId: invitation._id,
      revokeClerkInvitationId: invitation.clerkInvitationId,
    });
    return null;
  },
});

const invitationListItem = schema.doc("invitations").extend({
  invitedByName: v.union(v.string(), v.null()),
  trackNames: v.array(v.string()),
});

export const listForManager = query({
  args: { paginationOpts: paginationOptsValidator },
  returns: paginationResultValidator(invitationListItem),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const results = hasPlatformPermission(user, "invites.manage")
      ? await ctx.db.query("invitations").order("desc").paginate(args.paginationOpts)
      : await ctx.db
          .query("invitations")
          .withIndex("by_invitedBy", (q) => q.eq("invitedBy", user._id))
          .order("desc")
          .paginate(args.paginationOpts);

    const page = await Promise.all(
      results.page.map(async (invitation) => {
        const inviter = invitation.invitedBy
          ? await ctx.db.get("users", invitation.invitedBy)
          : null;
        const trackNames = await Promise.all(
          invitation.trackGrants.map(
            async (grant) => (await ctx.db.get("tracks", grant.trackId))?.name ?? "Deleted track",
          ),
        );
        return { ...invitation, invitedByName: inviter?.fullName ?? null, trackNames };
      }),
    );
    return { ...results, page };
  },
});

export const getForSending = internalQuery({
  args: { invitationId: v.id("invitations") },
  returns: v.union(schema.doc("invitations"), v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get("invitations", args.invitationId);
  },
});

export const recordSendResult = internalMutation({
  args: {
    invitationId: v.id("invitations"),
    clerkInvitationId: v.optional(v.string()),
    error: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const invitation = await ctx.db.get("invitations", args.invitationId);
    if (invitation === null || invitation.status !== "sending") {
      return null;
    }
    await ctx.db.patch("invitations", args.invitationId, {
      status: args.error === undefined ? "sent" : "failed",
      clerkInvitationId: args.clerkInvitationId,
      error: args.error,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const markSending = internalMutation({
  args: { invitationId: v.id("invitations") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const invitation = await ctx.db.get("invitations", args.invitationId);
    if (invitation === null || invitation.status !== "pending") {
      return false;
    }
    await ctx.db.patch("invitations", args.invitationId, { status: "sending" });
    return true;
  },
});

async function clerkRequest(path: string, init: RequestInit): Promise<Response> {
  return await fetch(`https://api.clerk.com/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.CLERK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
  });
}

async function clerkErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as {
      errors?: { long_message?: string; message?: string }[];
    };
    const first = body.errors?.[0];
    return first?.long_message ?? first?.message ?? `Clerk returned ${response.status}`;
  } catch {
    return `Clerk returned ${response.status}`;
  }
}

export const sendClerkInvite = internalAction({
  args: {
    invitationId: v.id("invitations"),
    revokeClerkInvitationId: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const claimed: boolean = await ctx.runMutation(internal.invitations.markSending, {
      invitationId: args.invitationId,
    });
    if (!claimed) {
      return null;
    }
    const invitation = await ctx.runQuery(internal.invitations.getForSending, {
      invitationId: args.invitationId,
    });
    if (invitation === null) {
      return null;
    }

    if (args.revokeClerkInvitationId !== undefined) {
      await clerkRequest(`/invitations/${args.revokeClerkInvitationId}/revoke`, {
        method: "POST",
      });
    }

    const response = await clerkRequest("/invitations", {
      method: "POST",
      body: JSON.stringify({
        email_address: invitation.email,
        redirect_url: `${env.SITE_URL.replace(/\/$/, "")}/accept-invite`,
        public_metadata: { invitationId: invitation._id },
        notify: true,
        ignore_existing: true,
        expires_in_days: 30,
      }),
    });

    if (!response.ok) {
      await ctx.runMutation(internal.invitations.recordSendResult, {
        invitationId: invitation._id,
        error: await clerkErrorMessage(response),
      });
      return null;
    }

    const created = (await response.json()) as { id: string };
    await ctx.runMutation(internal.invitations.recordSendResult, {
      invitationId: invitation._id,
      clerkInvitationId: created.id,
    });
    return null;
  },
});

export const revokeClerkInvite = internalAction({
  args: { clerkInvitationId: v.string() },
  returns: v.null(),
  handler: async (_ctx, args) => {
    const response = await clerkRequest(`/invitations/${args.clerkInvitationId}/revoke`, {
      method: "POST",
    });
    if (!response.ok) {
      console.warn(
        `Could not revoke Clerk invitation ${args.clerkInvitationId}: ${await clerkErrorMessage(response)}`,
      );
    }
    return null;
  },
});

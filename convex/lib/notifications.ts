import type { Infer } from "convex/values";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import type { notificationTypeValidator } from "../schema";

export type NotificationInput = {
  type: Infer<typeof notificationTypeValidator>;
  title: string;
  body?: string;
  /** An in-app path such as `/missions/wireframes`. */
  link?: string;
};

const MAX_TITLE = 160;
const MAX_BODY = 280;

function clip(value: string, max: number) {
  return value.length > max ? `${value.slice(0, max - 1).trimEnd()}…` : value;
}

export async function notify(ctx: MutationCtx, userId: Id<"users">, input: NotificationInput) {
  await ctx.db.insert("notifications", {
    userId,
    type: input.type,
    title: clip(input.title, MAX_TITLE),
    body: input.body ? clip(input.body, MAX_BODY) : undefined,
    link: input.link,
    read: false,
  });
}

/** Turns a Markdown body into a short plain-text preview. */
export function plainPreview(markdown: string) {
  return markdown
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`~-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

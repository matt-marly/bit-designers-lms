import { ConvexError } from "convex/values";

const MAX_URL_LENGTH = 1000;

/** Trims and checks an http(s) URL. `label` names the field in error messages, e.g. "meeting link". */
export function cleanHttpUrl(value: string, label: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new ConvexError(`Add a ${label}`);
  }
  if (trimmed.length > MAX_URL_LENGTH) {
    throw new ConvexError(`The ${label} is too long`);
  }
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new ConvexError(`Enter a full ${label}, starting with https://`);
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new ConvexError(`Enter a full ${label}, starting with https://`);
  }
  return trimmed;
}

const VIDEO_HOSTS = ["youtube.com", "youtu.be", "youtube-nocookie.com", "vimeo.com", "player.vimeo.com"];

/** A YouTube or Vimeo link. */
export function cleanVideoLink(value: string): string {
  const cleaned = cleanHttpUrl(value, "video link");
  const host = new URL(cleaned).hostname.replace(/^www\.|^m\./, "");
  if (!VIDEO_HOSTS.includes(host)) {
    throw new ConvexError("Use a YouTube or Vimeo link");
  }
  return cleaned;
}

/** Like `cleanHttpUrl`, but an empty value means "none". */
export function cleanOptionalHttpUrl(value: string | undefined, label: string): string | undefined {
  if (value === undefined || !value.trim()) return undefined;
  return cleanHttpUrl(value, label);
}

export function cleanText(value: string | undefined, max: number, label: string): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  if (trimmed.length > max) {
    throw new ConvexError(`${label} must be ${max.toLocaleString("en-US")} characters or fewer`);
  }
  return trimmed;
}

export function requireText(value: string, max: number, label: string): string {
  const cleaned = cleanText(value, max, label);
  if (cleaned === undefined) {
    throw new ConvexError(`${label} is required`);
  }
  return cleaned;
}

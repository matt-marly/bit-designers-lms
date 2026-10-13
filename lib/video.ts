/** Turns a YouTube or Vimeo link into an embeddable player URL, or null for anything else. */
export function videoEmbedUrl(link: string): string | null {
  let url: URL;
  try {
    url = new URL(link);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\.|^m\./, "");

  let youtubeId: string | null = null;
  if (host === "youtu.be") {
    youtubeId = url.pathname.slice(1).split("/")[0] || null;
  } else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (url.pathname === "/watch") youtubeId = url.searchParams.get("v");
    else {
      const match = url.pathname.match(/^\/(?:embed|shorts|live)\/([^/?#]+)/);
      youtubeId = match?.[1] ?? null;
    }
  }
  if (youtubeId && /^[\w-]{6,20}$/.test(youtubeId)) {
    const start = url.searchParams.get("t") ?? url.searchParams.get("start");
    const seconds = start ? parseInt(start, 10) : NaN;
    return `https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&modestbranding=1${
      Number.isFinite(seconds) && seconds > 0 ? `&start=${seconds}` : ""
    }`;
  }

  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const match = url.pathname.match(/(?:^|\/)(\d{6,12})(?:\/|$)/);
    if (match) return `https://player.vimeo.com/video/${match[1]}?dnt=1`;
  }

  return null;
}

export function readingMinutes(markdown: string) {
  const words = markdown.trim() ? markdown.trim().split(/\s+/).length : 0;
  return Math.max(1, Math.round(words / 200));
}

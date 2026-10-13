const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** "Just now", "5 min ago", "3 hours ago", "Yesterday", "4 days ago", then a date. */
export function relativeTime(ms: number, now: number) {
  const diff = Math.max(0, now - ms);
  if (diff < MINUTE) return "Just now";
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)} min ago`;
  if (diff < DAY) {
    const hours = Math.floor(diff / HOUR);
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }
  if (diff < 2 * DAY) return "Yesterday";
  if (diff < 7 * DAY) return `${Math.floor(diff / DAY)} days ago`;
  const sameYear = new Date(ms).getFullYear() === new Date(now).getFullYear();
  return new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}

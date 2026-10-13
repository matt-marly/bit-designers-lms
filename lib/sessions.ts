/** "Tue, Oct 6" in the viewer's timezone. */
export function sessionDay(ms: number) {
  return new Date(ms).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

/** "6:00 PM WAT" in the viewer's timezone. */
export function sessionTime(ms: number) {
  return new Date(ms).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZoneName: "short" });
}

export function viewerTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function offsetLabel(ms: number, timezone: string) {
  return new Date(ms).toLocaleTimeString("en-US", { timeZone: timezone, hour: "numeric", minute: "2-digit" });
}

/**
 * The host's local time when it differs from the viewer's, e.g. "7:00 PM in Lagos".
 * Returns null when both clocks read the same.
 */
export function hostTimeLabel(ms: number, timezone: string) {
  try {
    const host = offsetLabel(ms, timezone);
    if (host === offsetLabel(ms, viewerTimezone())) return null;
    const city = timezone.split("/").pop()?.replace(/_/g, " ") ?? timezone;
    return `${host} in ${city}`;
  } catch {
    return null;
  }
}

export function durationLabel(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} hr` : `${hours} hr ${rest} min`;
}

/** Local "HH:MM" for `<input type="time">`. */
export function toTimeInput(ms: number) {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** Combines local date and time inputs into a timestamp, or null when either is missing. */
export function fromDateTimeInputs(date: string, time: string): number | null {
  if (!date || !time) return null;
  const ms = new Date(`${date}T${time}`).getTime();
  return Number.isFinite(ms) ? ms : null;
}

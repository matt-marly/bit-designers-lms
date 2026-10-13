function icsDate(ms: number) {
  return new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function escapeText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** Downloads an .ics file for a session. Times are written in UTC so calendars convert them correctly. */
export function generateICS(session: {
  id: string;
  title: string;
  description: string | null;
  startsAt: number;
  endsAt: number;
  url: string | null;
}) {
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//BitDesigners Africa//Live Sessions//EN",
    "BEGIN:VEVENT",
    `UID:${session.id}@bitdesigners.africa`,
    `DTSTAMP:${icsDate(Date.now())}`,
    `DTSTART:${icsDate(session.startsAt)}`,
    `DTEND:${icsDate(session.endsAt)}`,
    `SUMMARY:${escapeText(session.title)}`,
    `DESCRIPTION:${escapeText([session.description, session.url].filter(Boolean).join("\n\n"))}`,
    `LOCATION:${escapeText(session.url ?? "")}`,
    ...(session.url ? [`URL:${session.url}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = `${session.title.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase() || "session"}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(href);
}

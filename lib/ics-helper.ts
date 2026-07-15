/**
 * Generates and downloads an .ics calendar file for a session.
 */
export function generateICS(session: {
  title: string;
  description: string;
  date: string;
  time: string;
  duration: number;
  joinUrl: string | null;
}) {
  const [year, month, day] = session.date.split("-").map(Number);
  const [hour, minute] = session.time.split(":").map(Number);

  // Format as YYYYMMDDTHHMMSS (WAT = UTC+1)
  const pad = (n: number) => String(n).padStart(2, "0");
  const dtStart = `${year}${pad(month)}${pad(day)}T${pad(hour)}${pad(minute)}00`;

  // Calculate end time
  const startDate = new Date(year, month - 1, day, hour, minute);
  const endDate = new Date(startDate.getTime() + session.duration * 60 * 1000);
  const dtEnd = `${endDate.getFullYear()}${pad(endDate.getMonth() + 1)}${pad(endDate.getDate())}T${pad(endDate.getHours())}${pad(endDate.getMinutes())}00`;

  const uid = `${session.date}-${session.time}-bitdesigners@bitdesigners.africa`;
  const location = session.joinUrl || "";

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//BitDesigners Africa//Live Sessions//EN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTART;TZID=Africa/Lagos:${dtStart}`,
    `DTEND;TZID=Africa/Lagos:${dtEnd}`,
    `SUMMARY:${session.title}`,
    `DESCRIPTION:${session.description.replace(/\n/g, "\\n")}`,
    `LOCATION:${location}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${session.title.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Award, Megaphone, CheckCircle2, BookOpen, Clock, FileText, PlayCircle, Target, Users } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { FunctionReturnType } from "convex/server";
import Link from "next/link";
import { workshopPhase } from "@/convex/lib/workshops";
import { useLearnerTrack } from "@/lib/use-learner-track";
import { useNow } from "@/lib/use-now";
import { sessionDay, sessionTime } from "@/lib/sessions";
import { relativeTime } from "@/lib/time";
import { Markdown } from "@/components/markdown";
import { daysUntil, isOverdue, missionStatusLabel, shortDate } from "@/components/learn/missions";

type MissionRow = FunctionReturnType<typeof api.missions.list>["missions"][number];

/** Needs revision first, then untouched work by nearest due date, then outline order. */
function pickCurrentMission(missions: MissionRow[]): MissionRow | null {
  const revision = missions.find((m) => m.status === "needs_revision");
  if (revision) return revision;
  const todo = missions.filter((m) => m.status === "not_started");
  if (todo.length === 0) return null;
  return [...todo].sort((a, b) => (a.dueAt ?? Infinity) - (b.dueAt ?? Infinity))[0];
}

function dueLabel(mission: MissionRow) {
  if (mission.dueAt === null) return null;
  if (isOverdue(mission.dueAt, mission.satisfied, mission.status)) return { text: `OVERDUE · WAS DUE ${shortDate(mission.dueAt).toUpperCase()}`, color: "#F87171" };
  const days = daysUntil(mission.dueAt);
  if (days <= 0) return { text: "DUE TODAY", color: "#FBBF24" };
  if (days === 1) return { text: "DUE TOMORROW", color: "#FBBF24" };
  return { text: `DUE IN ${days} DAYS · ${shortDate(mission.dueAt).toUpperCase()}`, color: days <= 3 ? "#FBBF24" : "#737373" };
}

type FeedItem = FunctionReturnType<typeof api.announcements.feed>[number];

function AnnouncementItem({ announcement: a, last, time }: { announcement: FeedItem; last: boolean; time: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: last ? "none" : "1px solid var(--color-border-subtle)" }}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
          padding: "12px 0",
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span style={{ display: "flex", alignItems: "flex-start", gap: 12, minWidth: 0 }}>
          <Megaphone
            aria-hidden
            style={{ width: 16, height: 16, color: "var(--color-text-tertiary)", marginTop: 3, flexShrink: 0 }}
          />
          <span
            style={{
              fontFamily: "var(--font-body), 'Inter', system-ui, sans-serif",
              fontSize: "14.5px",
              lineHeight: "22px",
              color: "var(--color-text-primary)",
            }}
          >
            {a.title}
          </span>
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono), 'JetBrains Mono', 'SF Mono', monospace",
            fontSize: 11,
            lineHeight: "14px",
            fontWeight: 500,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "var(--color-text-tertiary)",
            flexShrink: 0,
            marginTop: 4,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {time}
        </span>
      </button>
      {open && (
        <div style={{ padding: "0 0 16px 28px" }}>
          <Markdown>{a.body}</Markdown>
          {a.authorName && (
            <p
              style={{
                fontFamily: "var(--font-mono), 'JetBrains Mono', 'SF Mono', monospace",
                fontSize: 11,
                color: "var(--color-text-tertiary)",
                margin: "8px 0 0",
              }}
            >
              From {a.authorName}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Animation — design system §5
// ---------------------------------------------------------------------------
const spring = { type: "spring" as const, stiffness: 300, damping: 28 };

function sectionAnim(delay: number) {
  return {
    initial: { opacity: 0, y: 8 } as const,
    animate: { opacity: 1, y: 0 } as const,
    transition: { ...spring, delay },
  };
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function cohortWeeks(cohort: { startsAt: number; endsAt: number | null }, now: number) {
  const total = cohort.endsAt ? Math.max(1, Math.ceil((cohort.endsAt - cohort.startsAt) / WEEK_MS)) : null;
  if (now < cohort.startsAt) return { started: false as const, total };
  const current = Math.floor((now - cohort.startsAt) / WEEK_MS) + 1;
  return { started: true as const, current: total ? Math.min(current, total) : current, total };
}

// ---------------------------------------------------------------------------
// Shared style shortcuts
// ---------------------------------------------------------------------------
const font = {
  display: "var(--font-display), 'Space Grotesk', 'Inter', system-ui, sans-serif",
  body: "var(--font-body), 'Inter', system-ui, -apple-system, sans-serif",
  mono: "var(--font-mono), 'JetBrains Mono', 'SF Mono', monospace",
};

// ---------------------------------------------------------------------------
// Toast type
// ---------------------------------------------------------------------------
type ToastData = {
  message: string;
  type: "success" | "error" | "warning";
};

const toastDotColor: Record<ToastData["type"], string> = {
  success: "#22C55E",
  error: "#EF4444",
  warning: "#F59E0B",
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function HomePage() {
  const router = useRouter();
  const { me, track } = useLearnerTrack();
  const home = useQuery(api.curriculum.home, track ? { trackId: track.trackId } : "skip");
  const missionData = useQuery(api.missions.list, track ? { trackId: track.trackId } : "skip");
  const missionStats = missionData?.stats ?? null;
  const currentMission = missionData ? pickCurrentMission(missionData.missions) : null;
  const currentDue = currentMission ? dueLabel(currentMission) : null;
  const [now] = useState(() => Date.now());
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);

  const firstName = me?.user.fullName.split(/\s+/)[0] ?? "";
  const cohort = home?.cohort ?? null;
  const weeks = cohort ? cohortWeeks(cohort, now) : null;
  const next = home?.next ?? null;
  const nextPercent = next && next.lessonCount > 0 ? Math.round((next.completedLessons / next.lessonCount) * 100) : 0;
  const contextLine = [
    cohort?.name,
    track?.name,
    weeks?.started ? `Week ${pad2(weeks.current)}${weeks.total ? ` / ${weeks.total}` : ""}` : null,
    weeks && !weeks.started && cohort ? `Starts ${new Date(cohort.startsAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const showToast = useCallback((message: string, type: ToastData["type"] = "success") => {
    setToast({ message, type });
  }, []);

  // Auto-dismiss toast after 3000ms
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const clock = useNow(60_000);
  const upcomingSession = useQuery(
    api.workshops.next,
    track && clock > 0 ? { trackId: track.trackId, now: clock } : "skip",
  );
  const bannerState = upcomingSession ? workshopPhase(upcomingSession.scheduledAt, upcomingSession.endsAt, clock) : null;
  const announcements = useQuery(api.announcements.feed, track ? { trackId: track.trackId, limit: 5 } : "skip");
  const certificates = useQuery(api.certificates.mine, me ? {} : "skip");
  const certificate = certificates?.find((c) => c.trackId === track?.trackId) ?? null;

  // Suppress unused var warning — showToast is exposed for future use
  void showToast;

  return (
    <>
      {/* Pulse keyframes for live dot */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
        @media (max-width: 768px) {
          .home-banner { flex-direction: column !important; align-items: flex-start !important; gap: 8px !important; }
          .home-banner-left { flex-wrap: wrap !important; }
          .home-stat-grid { grid-template-columns: 1fr 1fr !important; }
          .home-stat-grid > :last-child { grid-column: 1 / -1; }
          .home-two-col { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div style={{ maxWidth: 880, margin: "0 auto" }}>
        {/* ── ZONE 0: Live Session Banner ── */}
        {upcomingSession && (
          <div
            className="home-banner"
            style={{
              width: "100%",
              background: "rgba(99,102,241,0.08)",
              border: "1px solid rgba(99,102,241,0.20)",
              borderRadius: 12,
              padding: "12px 20px",
              marginBottom: 28,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            {/* LEFT */}
            <div
              className="home-banner-left"
              style={{ display: "flex", alignItems: "center", gap: 10 }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: "#6366F1",
                  animation: "pulse 2s ease infinite",
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontFamily: font.body,
                  fontSize: 14,
                  fontWeight: 500,
                  color: "#FFFFFF",
                }}
              >
                {upcomingSession.title}
              </span>
              <span style={{ color: "#737373" }}>·</span>
              <span
                style={{
                  fontFamily: font.mono,
                  fontSize: 12,
                  color: "#737373",
                }}
              >
                {bannerState === "live"
                  ? "HAPPENING NOW"
                  : `${sessionDay(upcomingSession.scheduledAt).toUpperCase()} \u00b7 ${sessionTime(upcomingSession.scheduledAt)}`}
              </span>
            </div>

            {bannerState === "live" ? (
              <a
                href={upcomingSession.meetingUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontFamily: font.body,
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#A5B4FC",
                  flexShrink: 0,
                  whiteSpace: "nowrap",
                  textDecoration: "none",
                }}
              >
                Join now {"\u2192"}
              </a>
            ) : (
              <Link
                href="/live"
                style={{
                  fontFamily: font.body,
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#A5B4FC",
                  flexShrink: 0,
                  whiteSpace: "nowrap",
                  textDecoration: "none",
                }}
              >
                View details {"\u2192"}
              </Link>
            )}
          </div>
        )}
        {/* ── ZONE 1: Page Header ── */}
        <header style={{ marginTop: 32, marginBottom: 24 }}>
          <h1
            style={{
              fontFamily: font.display,
              fontSize: 32,
              lineHeight: "38px",
              fontWeight: 700,
              color: "#FFFFFF",
              margin: 0,
            }}
          >
            {getGreeting()}
            {firstName && `, ${firstName}`}
          </h1>
          <p
            style={{
              fontFamily: font.mono,
              fontSize: 11,
              lineHeight: "14px",
              fontWeight: 600,
              letterSpacing: "0.10em",
              textTransform: "uppercase",
              color: "#737373",
              marginTop: 6,
            }}
          >
            {contextLine || "\u00a0"}
          </p>
        </header>

        {certificate && (
          <Link
            href={`/certificates/${certificate.code}`}
            className="home-banner"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              padding: "14px 20px",
              marginBottom: 24,
              borderRadius: 12,
              border: "1px solid rgba(34,197,94,0.25)",
              backgroundColor: "rgba(34,197,94,0.06)",
              textDecoration: "none",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Award aria-hidden style={{ width: 18, height: 18, color: "#4ADE80", flexShrink: 0 }} />
              <span style={{ fontFamily: font.body, fontSize: 14, fontWeight: 500, color: "#FFFFFF" }}>
                You completed {certificate.trackName}. Your certificate is ready.
              </span>
            </span>
            <span style={{ fontFamily: font.body, fontSize: 13, fontWeight: 500, color: "#4ADE80", whiteSpace: "nowrap" }}>
              View certificate {"\u2192"}
            </span>
          </Link>
        )}

        {/* ── ZONE 2: Stat Row ── */}
        <section
          className="home-stat-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 12,
            marginBottom: 24,
          }}
        >
          {[
            {
              label: "CURRENT WEEK",
              value: weeks?.started ? `W${pad2(weeks.current)}` : "—",
              sub: weeks?.started
                ? weeks.total
                  ? `OF ${weeks.total} WEEKS`
                  : "OF THE COHORT"
                : cohort
                  ? "NOT STARTED YET"
                  : "NO COHORT",
              valueColor: "#6366F1",
            },
            {
              label: "MODULES COMPLETE",
              value: home ? pad2(home.modules.completed) : "—",
              sub: home ? `OF ${home.modules.total} MODULES` : "\u00a0",
              valueColor: "#FFFFFF",
            },
            {
              label: "MISSIONS",
              value: missionStats ? pad2(missionStats.done) : "—",
              sub: missionStats
                ? missionStats.waiting > 0
                  ? `OF ${missionStats.total} DONE \u00b7 ${missionStats.waiting} IN REVIEW`
                  : `OF ${missionStats.total} DONE`
                : "\u00a0",
              valueColor: "#FFFFFF",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                backgroundColor: "#111111",
                border: "1px solid #242424",
                borderRadius: 14,
                padding: "20px 24px",
              }}
            >
              <span
                style={{
                  fontFamily: font.mono,
                  fontSize: 11,
                  lineHeight: "14px",
                  fontWeight: 600,
                  letterSpacing: "0.10em",
                  textTransform: "uppercase",
                  color: "#737373",
                }}
              >
                {stat.label}
              </span>
              <p
                style={{
                  fontFamily: font.mono,
                  fontSize: 32,
                  lineHeight: "36px",
                  fontWeight: 600,
                  letterSpacing: "-0.02em",
                  color: stat.valueColor,
                  margin: 0,
                  marginTop: 12,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {stat.value}
              </p>
              <p
                style={{
                  fontFamily: font.mono,
                  fontSize: 11,
                  lineHeight: "14px",
                  fontWeight: 600,
                  letterSpacing: "0.10em",
                  color: "#737373",
                  textTransform: "uppercase",
                  margin: 0,
                  marginTop: 4,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {stat.sub}
              </p>
            </div>
          ))}
        </section>

        {/* ── ZONE 3: Two-Column Grid ── */}
        <div
          className="home-two-col"
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr 1fr",
            gap: 16,
            marginBottom: 24,
            alignItems: "stretch",
          }}
        >
          {/* LEFT COLUMN */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Card A — UP NEXT */}
            <div
              style={{
                backgroundColor: "#111111",
                border: "1px solid #242424",
                borderLeft: "3px solid #6366F1",
                borderRadius: 14,
                padding: 24,
              }}
            >
              <span
                style={{
                  fontFamily: font.mono,
                  fontSize: 11,
                  lineHeight: "14px",
                  fontWeight: 600,
                  letterSpacing: "0.10em",
                  textTransform: "uppercase",
                  color: "#A5B4FC",
                  marginBottom: 10,
                  display: "block",
                }}
              >
                UP NEXT
              </span>

              {next ? (
                <>
                  <h2
                    style={{
                      fontFamily: font.display,
                      fontSize: 24,
                      lineHeight: "30px",
                      fontWeight: 600,
                      color: "#FFFFFF",
                      margin: 0,
                    }}
                  >
                    {next.moduleTitle}
                  </h2>

                  {/* Breadcrumb + BTC badge */}
                  <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        fontFamily: font.mono,
                        fontSize: 11,
                        lineHeight: "14px",
                        fontWeight: 600,
                        letterSpacing: "0.10em",
                        textTransform: "uppercase",
                        color: "#737373",
                      }}
                    >
                      {next.unitTitle} · {next.mission ? `Mission: ${next.mission.title}` : next.lessonTitle}
                    </span>
                  </div>

                  {/* Progress zone */}
                  <div style={{ marginTop: 16 }}>
                    <span
                      style={{
                        fontFamily: font.mono,
                        fontSize: 11,
                        lineHeight: "14px",
                        fontWeight: 600,
                        letterSpacing: "0.10em",
                        textTransform: "uppercase",
                        color: "#737373",
                        marginBottom: 6,
                        display: "block",
                      }}
                    >
                      {next.mission
                        ? "LESSONS DONE · MISSION LEFT TO FINISH"
                        : `${next.completedLessons} OF ${next.lessonCount} LESSONS COMPLETE`}
                    </span>
                    <div
                      style={{
                        height: 3,
                        width: "100%",
                        borderRadius: 999,
                        backgroundColor: "#1C1C1C",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${nextPercent}%`,
                          transition: "width 600ms cubic-bezier(0.4, 0, 0.2, 1)",
                          height: 3,
                          backgroundColor: "#6366F1",
                          borderRadius: 999,
                        }}
                      />
                    </div>
                  </div>

                  {/* Buttons */}
                  <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 10 }}>
                    <button
                      onClick={() => {
                        setIsLoading(true);
                        router.push(
                          next.mission ? `/missions/${next.mission.slug}` : `/learn/${next.moduleSlug}/${next.lessonSlug}`,
                        );
                      }}
                      disabled={isLoading}
                      style={{
                        height: 40,
                        padding: "0 20px",
                        borderRadius: 10,
                        backgroundColor: "#6366F1",
                        color: "#FFFFFF",
                        fontFamily: font.body,
                        fontSize: 14,
                        fontWeight: 500,
                        border: "none",
                        cursor: isLoading ? "not-allowed" : "pointer",
                        opacity: isLoading ? 0.6 : 1,
                        pointerEvents: isLoading ? "none" as const : "auto" as const,
                      }}
                      onMouseEnter={(e) => {
                        if (!isLoading) e.currentTarget.style.backgroundColor = "#777AF5";
                      }}
                      onMouseLeave={(e) => {
                        if (!isLoading) e.currentTarget.style.backgroundColor = "#6366F1";
                      }}
                    >
                      {next.mission ? "Open mission" : next.completedLessons > 0 ? "Continue learning" : "Start lesson"}
                    </button>
                    <button
                      onClick={() => router.push("/learn")}
                      style={{
                        height: 40,
                        padding: "0 20px",
                        borderRadius: 10,
                        backgroundColor: "transparent",
                        color: "#FFFFFF",
                        fontFamily: font.body,
                        fontSize: 14,
                        fontWeight: 500,
                        border: "1px solid #333333",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)";
                        e.currentTarget.style.borderColor = "rgba(255,255,255,0.22)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.borderColor = "#333333";
                      }}
                    >
                      View syllabus
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                  <BookOpen style={{ width: 32, height: 32, color: "#737373" }} />
                  <p
                    style={{
                      fontFamily: font.body,
                      fontSize: 16,
                      fontWeight: 500,
                      color: "#FFFFFF",
                      margin: 0,
                      marginTop: 12,
                    }}
                  >
                    {home && home.modules.total > 0 ? "You're all caught up" : "Nothing to learn yet"}
                  </p>
                  <p
                    style={{
                      fontFamily: font.body,
                      fontSize: 14,
                      color: "#737373",
                      margin: 0,
                      marginTop: 6,
                    }}
                  >
                    {home && home.modules.total > 0
                      ? "You've finished every module published so far."
                      : track
                        ? "Your mentors haven't published any modules yet."
                        : "You'll see your modules here once you join a track."}
                  </p>
                  <button
                    onClick={() => router.push("/learn")}
                    style={{
                      height: 40,
                      padding: "0 20px",
                      borderRadius: 10,
                      backgroundColor: "transparent",
                      color: "#FFFFFF",
                      fontFamily: font.body,
                      fontSize: 14,
                      fontWeight: 500,
                      border: "1px solid #333333",
                      cursor: "pointer",
                      marginTop: 16,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)";
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.22)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.borderColor = "#333333";
                    }}
                  >
                    Browse modules
                  </button>
                </div>
              )}
            </div>

            {/* Card B — CURRENT MISSION */}
            <div
              style={{
                backgroundColor: "#111111",
                border: "1px solid #242424",
                borderLeft: "3px solid #F59E0B",
                borderRadius: 14,
                padding: 24,
              }}
            >
              <span
                style={{
                  fontFamily: font.mono,
                  fontSize: 11,
                  lineHeight: "14px",
                  fontWeight: 600,
                  letterSpacing: "0.10em",
                  textTransform: "uppercase",
                  color: "#A5B4FC",
                  marginBottom: 10,
                  display: "block",
                }}
              >
                CURRENT MISSION
              </span>

              {currentMission ? (
                <>
                  <h2
                    style={{
                      fontFamily: font.display,
                      fontSize: 20,
                      lineHeight: "26px",
                      fontWeight: 600,
                      color: "#FFFFFF",
                      margin: 0,
                    }}
                  >
                    {currentMission.title}
                  </h2>

                  {/* Status row */}
                  <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    {currentDue && (
                      <span
                        style={{
                          fontFamily: font.mono,
                          fontSize: 11,
                          lineHeight: "14px",
                          fontWeight: 600,
                          letterSpacing: "0.10em",
                          textTransform: "uppercase",
                          color: currentDue.color,
                        }}
                      >
                        {currentDue.text}
                      </span>
                    )}
                    <span
                      style={{
                        fontFamily: font.mono,
                        fontSize: 10,
                        fontWeight: 600,
                        letterSpacing: "0.10em",
                        textTransform: "uppercase",
                        color: currentMission.status === "needs_revision" ? "#FBBF24" : "#A5B4FC",
                        backgroundColor:
                          currentMission.status === "needs_revision" ? "rgba(251,191,36,0.10)" : "rgba(99,102,241,0.12)",
                        border: `1px solid ${
                          currentMission.status === "needs_revision" ? "rgba(251,191,36,0.35)" : "rgba(99,102,241,0.35)"
                        }`,
                        padding: "3px 8px",
                        borderRadius: 999,
                      }}
                    >
                      {missionStatusLabel(currentMission.status, currentMission.reviewType)}
                    </span>
                  </div>
                  <p style={{ fontFamily: font.body, fontSize: 13, color: "#737373", margin: "8px 0 0" }}>
                    Module {currentMission.module.number} · {currentMission.module.title}
                  </p>

                  {/* Buttons */}
                  <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <button
                      onClick={() => router.push(`/missions/${currentMission.slug}`)}
                      style={{
                        height: 40,
                        padding: "0 20px",
                        borderRadius: 10,
                        backgroundColor: "#6366F1",
                        color: "#FFFFFF",
                        fontFamily: font.body,
                        fontSize: 14,
                        fontWeight: 500,
                        border: "none",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#777AF5")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#6366F1")}
                    >
                      {currentMission.status === "needs_revision" ? "Revise and resubmit" : "Open mission"}
                    </button>
                    <button
                      onClick={() => router.push("/missions")}
                      style={{
                        height: 40,
                        padding: "0 20px",
                        borderRadius: 10,
                        backgroundColor: "transparent",
                        color: "#FFFFFF",
                        fontFamily: font.body,
                        fontSize: 14,
                        fontWeight: 500,
                        border: "1px solid #333333",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)";
                        e.currentTarget.style.borderColor = "rgba(255,255,255,0.22)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.borderColor = "#333333";
                      }}
                    >
                      All missions
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                  {missionStats && missionStats.waiting > 0 ? (
                    <Clock style={{ width: 32, height: 32, color: "#A5B4FC" }} />
                  ) : missionStats && missionStats.total > 0 ? (
                    <CheckCircle2 style={{ width: 32, height: 32, color: "#22C55E" }} />
                  ) : (
                    <Target style={{ width: 32, height: 32, color: "#737373" }} />
                  )}
                  <p
                    style={{
                      fontFamily: font.body,
                      fontSize: 16,
                      fontWeight: 500,
                      color: "#FFFFFF",
                      margin: 0,
                      marginTop: 12,
                    }}
                  >
                    {!missionStats
                      ? "\u00a0"
                      : missionStats.waiting > 0
                        ? `${missionStats.waiting} waiting for review`
                        : missionStats.total > 0
                          ? "All missions done"
                          : "No missions yet"}
                  </p>
                  <p
                    style={{
                      fontFamily: font.body,
                      fontSize: 14,
                      color: "#737373",
                      margin: 0,
                      marginTop: 6,
                    }}
                  >
                    {missionStats && missionStats.waiting > 0
                      ? "A mentor will review your work. You'll see their feedback on the mission page."
                      : missionStats && missionStats.total > 0
                        ? "Nice work. New missions show up here as modules are published."
                        : "Missions appear here as your mentors publish them."}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16, height: "100%" }}>
            {/* Card C — SUGGESTED FOR YOU */}
            <div
              style={{
                backgroundColor: "#111111",
                border: "1px solid #242424",
                borderRadius: 14,
                padding: 24,
                display: "flex",
                flexDirection: "column" as const,
                height: "100%",
              }}
            >
              <span
                style={{
                  fontFamily: font.mono,
                  fontSize: 11,
                  lineHeight: "14px",
                  fontWeight: 600,
                  letterSpacing: "0.10em",
                  textTransform: "uppercase",
                  color: "#737373",
                  marginBottom: 20,
                  display: "block",
                }}
              >
                SUGGESTED FOR YOU
              </span>

              {[
                {
                  type: "MATERIAL",
                  title: "Bitcoin Design Guide",
                  sub: "Recommended for Week 03",
                  icon: FileText,
                  onClick: () => router.push("/materials"),
                },
                {
                  type: "REFERENCE",
                  title: "How Bitcoin Wallets Work",
                  sub: "Related to current module",
                  icon: PlayCircle,
                  onClick: () => router.push("/reference"),
                },
                {
                  type: "COMMUNITY",
                  title: "Week 3 discussion is live",
                  sub: "Join the conversation on Discord",
                  icon: Users,
                  onClick: () => window.open("https://discord.gg", "_blank"),
                },
              ].map((row, i, arr) => (
                <div
                  key={row.type}
                  onClick={row.onClick}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 14,
                    padding: "14px 8px",
                    borderBottom: i < arr.length - 1 ? "1px solid #1C1C1C" : "none",
                    cursor: "pointer",
                    borderRadius: 8,
                    transition: "background 120ms ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#161616")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      background: "#1C1C1C",
                      border: "1px solid #242424",
                      borderRadius: 8,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <row.icon style={{ width: 16, height: 16, color: "#737373" }} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" as const, gap: 3 }}>
                    <span
                      style={{
                        fontFamily: font.mono,
                        fontSize: 10,
                        fontWeight: 500,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        color: "#737373",
                      }}
                    >
                      {row.type}
                    </span>
                    <span
                      style={{
                        fontFamily: font.body,
                        fontSize: 14,
                        fontWeight: 500,
                        color: "#FFFFFF",
                      }}
                    >
                      {row.title}
                    </span>
                    <span
                      style={{
                        fontFamily: font.body,
                        fontSize: 12,
                        color: "#737373",
                      }}
                    >
                      {row.sub}
                    </span>
                  </div>
                </div>
              ))}

              {/* Footer */}
              <div style={{ marginTop: "auto", borderTop: "1px solid #242424", paddingTop: 16 }}>
                <span
                  style={{
                    fontFamily: font.body,
                    fontSize: 12,
                    color: "#4A4A4A",
                  }}
                >
                  Based on your current stage
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── ZONE 4: Announcements (kept exactly as-is) ── */}
        <motion.section {...sectionAnim(0.24)}>
          <span
            style={{
              fontFamily: font.mono,
              fontSize: 11,
              lineHeight: "14px",
              fontWeight: 600,
              letterSpacing: "0.10em",
              textTransform: "uppercase",
              color: "var(--color-text-tertiary)",
            }}
          >
            Announcements
          </span>

          <div style={{ marginTop: 12 }}>
            {announcements === undefined ? null : announcements.length > 0 ? (
              announcements.map((a, i) => (
                <AnnouncementItem
                  key={a._id}
                  announcement={a}
                  last={i === announcements.length - 1}
                  time={relativeTime(a.createdAt, clock)}
                />
              ))
            ) : (
              <p
                style={{
                  fontFamily: font.body,
                  fontSize: 14,
                  color: "#737373",
                  margin: 0,
                  marginTop: 4,
                }}
              >
                No announcements yet.
              </p>
            )}
          </div>
        </motion.section>
      </div>

      {/* ── Toast notification ── */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 50,
            background: "#1C1C1C",
            border: "1px solid #333333",
            borderRadius: 10,
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            minWidth: 280,
            maxWidth: 360,
            boxShadow: "0 16px 40px rgba(0,0,0,0.55)",
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              backgroundColor: toastDotColor[toast.type],
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontFamily: font.body,
              fontSize: 14,
              color: "#FFFFFF",
            }}
          >
            {toast.message}
          </span>
        </div>
      )}
    </>
  );
}

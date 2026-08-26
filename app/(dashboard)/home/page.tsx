"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Megaphone, CheckCircle2, BookOpen, FileText, PlayCircle, Users } from "lucide-react";
import { mockSessions } from "@/lib/mock-live-data";

// ---------------------------------------------------------------------------
// Mock data — replaced with Supabase queries later
// ---------------------------------------------------------------------------
const user = { firstName: "Amara" };
const cohort = { name: "Cohort 1", track: "Design Lab", currentWeek: 3, totalWeeks: 12 };
const nextModule: {
  label: string;
  unit: string;
  module: string;
  lesson: string;
  progressPercent: number;
} | null = {
  label: "Bitcoin as a Design Medium",
  unit: "Unit 01",
  module: "Module 03",
  lesson: "Lesson 02",
  progressPercent: 60,
};
const stats = {
  modulesComplete: 7,
  modulesTotal: 24,
  missionsPassed: 2,
  missionsPending: 1,
};
const currentMission: {
  title: string;
  dueInDays: number;
  status: "In Progress";
} | null = {
  title: "Bitcoin UX Audit \u2014 Wallets",
  dueInDays: 3,
  status: "In Progress" as const,
};
const announcements: { title: string; time: string }[] = [
  { title: "Cohort 1 Kickoff Recording is now available", time: "2 hours ago" },
  { title: "Week 3 Mission Brief has been posted", time: "Yesterday" },
];

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

// ---------------------------------------------------------------------------
// Shared style shortcuts
// ---------------------------------------------------------------------------
const font = {
  display: "var(--font-display), 'Space Grotesk', 'Inter', system-ui, sans-serif",
  body: "var(--font-body), 'Inter', system-ui, -apple-system, sans-serif",
  mono: "var(--font-mono), 'JetBrains Mono', 'SF Mono', monospace",
};

// ---------------------------------------------------------------------------
// Live session banner helpers
// ---------------------------------------------------------------------------
function getUpcomingSession() {
  return mockSessions.find((s) => s.status === "upcoming") ?? null;
}

function getSessionDateTime(session: { date: string; time: string }): Date {
  return new Date(`${session.date}T${session.time}:00`);
}

function formatSessionDate(session: { date: string; time: string; timezone: string }): string {
  const dt = getSessionDateTime(session);
  const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const monthNames = [
    "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
    "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER",
  ];
  const day = dayNames[dt.getDay()];
  const month = monthNames[dt.getMonth()];
  const hours = dt.getHours();
  const minutes = dt.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  const h12 = hours % 12 || 12;
  const timeStr = minutes === 0 ? `${h12}:00 ${ampm}` : `${h12}:${pad2(minutes)} ${ampm}`;
  return `${day}, ${month} ${dt.getDate()} \u00b7 ${timeStr} ${session.timezone}`;
}

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
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);
  const showToast = useCallback((message: string, type: ToastData["type"] = "success") => {
    setToast({ message, type });
  }, []);

  // Auto-dismiss toast after 3000ms
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (nextModule) {
      const timer = setTimeout(() => setProgress(nextModule.progressPercent), 100);
      return () => clearTimeout(timer);
    }
  }, []);

  const upcomingSession = useMemo(() => getUpcomingSession(), []);

  // "live" if session starts within 15 mins (or already started within its duration)
  const bannerState = useMemo(() => {
    if (!upcomingSession) return null;
    const sessionTime = getSessionDateTime(upcomingSession);
    const now = new Date();
    const diffMs = sessionTime.getTime() - now.getTime();
    const diffMins = diffMs / (1000 * 60);
    if (diffMins <= 15 && diffMins > -(upcomingSession.duration ?? 90)) return "live" as const;
    return "upcoming" as const;
  }, [upcomingSession]);

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
                {formatSessionDate(upcomingSession)}
              </span>
            </div>

            {/* RIGHT */}
            <span
              onClick={() => {
                if (bannerState === "live" && upcomingSession.joinUrl) {
                  window.open(upcomingSession.joinUrl, "_blank", "noopener,noreferrer");
                } else {
                  router.push("/live");
                }
              }}
              style={{
                fontFamily: font.body,
                fontSize: 13,
                fontWeight: 500,
                color: "#A5B4FC",
                cursor: "pointer",
                flexShrink: 0,
                whiteSpace: "nowrap",
              }}
            >
              {bannerState === "live" ? "Join now \u2192" : "View details \u2192"}
            </span>
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
            {getGreeting()}, {user.firstName}
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
            COHORT 01 · DESIGN LAB · WEEK 03 / 12
          </p>
        </header>

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
              value: `W${pad2(cohort.currentWeek)}`,
              sub: `OF ${cohort.totalWeeks} WEEKS`,
              valueColor: "#6366F1",
            },
            {
              label: "MODULES COMPLETE",
              value: pad2(stats.modulesComplete),
              sub: `OF ${stats.modulesTotal} MODULES`,
              valueColor: "#FFFFFF",
            },
            {
              label: "MISSIONS",
              value: pad2(stats.missionsPassed),
              sub: `PASSED \u00b7 ${pad2(stats.missionsPending)} PENDING`,
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

              {nextModule ? (
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
                    {nextModule.label}
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
                      {nextModule.unit} · {nextModule.module} · {nextModule.lesson}
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
                      {nextModule.progressPercent}% OF MODULE COMPLETE
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
                          width: `${progress}%`,
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
                        router.push("/learn/bitcoin-as-a-design-medium");
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
                      Continue learning
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
                    You&apos;re all caught up
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
                    No modules in progress. Continue from where you left off.
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
                  <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 10 }}>
                    <span
                      style={{
                        fontFamily: font.mono,
                        fontSize: 11,
                        lineHeight: "14px",
                        fontWeight: 600,
                        letterSpacing: "0.10em",
                        textTransform: "uppercase",
                        color: "#F59E0B",
                      }}
                    >
                      DUE IN {currentMission.dueInDays} DAYS
                    </span>
                    <span
                      style={{
                        fontFamily: font.mono,
                        fontSize: 10,
                        fontWeight: 600,
                        letterSpacing: "0.10em",
                        textTransform: "uppercase",
                        color: "#A5B4FC",
                        backgroundColor: "rgba(99,102,241,0.12)",
                        border: "1px solid rgba(99,102,241,0.35)",
                        padding: "3px 8px",
                        borderRadius: 999,
                      }}
                    >
                      IN PROGRESS
                    </span>
                  </div>

                  {/* Buttons */}
                  <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 10 }}>
                    <button
                      onClick={() => router.push("/missions/bitcoin-ux-audit-wallets")}
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
                      Submit deliverable
                    </button>
                    <button
                      onClick={() => router.push("/missions/bitcoin-ux-audit-wallets")}
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
                      Mission brief
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                  <CheckCircle2 style={{ width: 32, height: 32, color: "#22C55E" }} />
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
                    No active missions
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
                    Check back when your next mission is assigned.
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
            {announcements.length > 0 ? (
              announcements.map((a, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 16,
                    paddingTop: 12,
                    paddingBottom: 12,
                    borderBottom:
                      i < announcements.length - 1
                        ? "1px solid var(--color-border-subtle)"
                        : "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <Megaphone
                      style={{
                        width: 16,
                        height: 16,
                        color: "var(--color-text-tertiary)",
                        marginTop: 3,
                        flexShrink: 0,
                      }}
                    />
                    <p
                      style={{
                        fontFamily: font.body,
                        fontSize: "14.5px",
                        lineHeight: "22px",
                        fontWeight: 400,
                        color: "var(--color-text-primary)",
                        margin: 0,
                      }}
                    >
                      {a.title}
                    </p>
                  </div>
                  <span
                    style={{
                      fontFamily: font.mono,
                      fontSize: 11,
                      lineHeight: "14px",
                      fontWeight: 500,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      color: "var(--color-text-tertiary)",
                      flexShrink: 0,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {a.time}
                  </span>
                </div>
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

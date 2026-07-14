"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BookOpen, Clock, Target, Radio, Megaphone, FileText } from "lucide-react";

// ---------------------------------------------------------------------------
// Mock data — replaced with Supabase queries later
// ---------------------------------------------------------------------------
const user = { firstName: "Amara" };
const cohort = { name: "Cohort 1", track: "Design Lab", currentWeek: 3, totalWeeks: 12 };
const nextModule = {
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
const currentMission = {
  title: "Bitcoin UX Audit — Wallets",
  dueInDays: 3,
  status: "In Progress" as const,
};
const nextWorkshop = {
  title: "Bitcoin Design Systems — Live Critique",
  date: "Thursday, July 17 · 6:00 PM WAT",
  host: "Adeyemi Matthew",
};
const announcements = [
  { title: "Cohort 1 Kickoff Recording is now available", time: "2 hours ago" },
  { title: "Week 3 Mission Brief has been posted", time: "Yesterday" },
];

// ---------------------------------------------------------------------------
// Animation — design system §5: duration-enter 240ms, ease-out-quart
// No spring on layout; only opacity + translateY for entrances
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
// Shared sub-components
// ---------------------------------------------------------------------------

/** §4.4 SectionLabel — mono eyebrow */
function SectionLabel({ children, color = "var(--color-text-tertiary)" }: { children: string; color?: string }) {
  return (
    <span
      style={{
        fontFamily: "var(--font-mono), 'JetBrains Mono', 'SF Mono', monospace",
        fontSize: 11,
        lineHeight: "14px",
        fontWeight: 600,
        letterSpacing: "0.10em",
        textTransform: "uppercase",
        color,
      }}
    >
      {children}
    </span>
  );
}

/** §4.3 StatusPill — [dot] [label] */
function StatusPill({
  label,
  variant,
}: {
  label: string;
  variant: "indigo" | "warning" | "success" | "danger";
}) {
  const map = {
    indigo: {
      dot: "var(--color-indigo)",
      text: "var(--color-indigo-text)",
      bg: "var(--color-indigo-subtle)",
      border: "var(--color-indigo-border)",
    },
    warning: {
      dot: "var(--color-warning)",
      text: "var(--color-warning-text)",
      bg: "var(--color-warning-subtle)",
      border: "var(--color-warning-border)",
    },
    success: {
      dot: "var(--color-success)",
      text: "var(--color-success-text)",
      bg: "var(--color-success-subtle)",
      border: "var(--color-success-border)",
    },
    danger: {
      dot: "var(--color-danger)",
      text: "var(--color-danger-text)",
      bg: "var(--color-danger-subtle)",
      border: "var(--color-danger-border)",
    },
  };
  const t = map[variant];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        height: 24,
        padding: "0 10px",
        borderRadius: 999,
        backgroundColor: t.bg,
        border: `1px solid ${t.border}`,
        fontFamily: "var(--font-mono), 'JetBrains Mono', 'SF Mono', monospace",
        fontSize: 11,
        lineHeight: "14px",
        fontWeight: 600,
        letterSpacing: "0.10em",
        textTransform: "uppercase",
        color: t.text,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          backgroundColor: t.dot,
          marginRight: 6,
          flexShrink: 0,
        }}
      />
      {label}
    </span>
  );
}

/** §4.6 Badge — static descriptor */
function Badge({
  children,
  variant = "default",
}: {
  children: string;
  variant?: "default" | "indigo" | "btc";
}) {
  const styles = {
    default: {
      bg: "var(--color-bg-surface-3)",
      text: "var(--color-text-secondary)",
      border: "var(--color-border-subtle)",
    },
    indigo: {
      bg: "var(--color-indigo-subtle)",
      text: "var(--color-indigo-text)",
      border: "var(--color-indigo-border)",
    },
    btc: {
      bg: "var(--color-btc-subtle)",
      text: "var(--color-btc-text)",
      border: "var(--color-btc-border)",
    },
  };
  const s = styles[variant];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        height: 20,
        padding: "0 8px",
        borderRadius: 6,
        backgroundColor: s.bg,
        border: `1px solid ${s.border}`,
        fontFamily: "var(--font-mono), 'JetBrains Mono', 'SF Mono', monospace",
        fontSize: 10,
        lineHeight: "12px",
        fontWeight: 500,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: s.text,
      }}
    >
      {children}
    </span>
  );
}

/** §4.2 PrimaryButton */
function PrimaryButton({ children, icon: Icon }: { children: string; icon?: React.ElementType }) {
  return (
    <button
      className="inline-flex items-center justify-center transition-colors"
      style={{
        height: 40,
        padding: "0 16px",
        borderRadius: 10,
        backgroundColor: "var(--color-indigo)",
        color: "var(--color-text-on-accent)",
        fontFamily: "var(--font-body), 'Inter', system-ui, sans-serif",
        fontSize: "14.5px",
        lineHeight: "22px",
        fontWeight: 500,
        gap: 8,
        border: "none",
        cursor: "pointer",
        transitionDuration: "var(--duration-fast)",
        transitionTimingFunction: "var(--ease-out-quart)",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-indigo-hover)")}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--color-indigo)")}
      onMouseDown={(e) => (e.currentTarget.style.backgroundColor = "var(--color-indigo-active)")}
      onMouseUp={(e) => (e.currentTarget.style.backgroundColor = "var(--color-indigo-hover)")}
    >
      {Icon && <Icon style={{ width: 16, height: 16 }} />}
      {children}
    </button>
  );
}

/** §4.2 OutlineButton */
function OutlineButton({ children, icon: Icon }: { children: string; icon?: React.ElementType }) {
  return (
    <button
      className="inline-flex items-center justify-center transition-colors"
      style={{
        height: 40,
        padding: "0 16px",
        borderRadius: 10,
        backgroundColor: "transparent",
        color: "var(--color-text-primary)",
        border: "1px solid var(--color-border-strong)",
        fontFamily: "var(--font-body), 'Inter', system-ui, sans-serif",
        fontSize: "14.5px",
        lineHeight: "22px",
        fontWeight: 500,
        gap: 8,
        cursor: "pointer",
        transitionDuration: "var(--duration-fast)",
        transitionTimingFunction: "var(--ease-out-quart)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)";
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.22)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "transparent";
        e.currentTarget.style.borderColor = "var(--color-border-strong)";
      }}
      onMouseDown={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.08)")}
      onMouseUp={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)")}
    >
      {Icon && <Icon style={{ width: 16, height: 16 }} />}
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Shared style shortcuts
// ---------------------------------------------------------------------------
const font = {
  display: "var(--font-display), 'Space Grotesk', 'Inter', system-ui, sans-serif",
  body: "var(--font-body), 'Inter', system-ui, -apple-system, sans-serif",
  mono: "var(--font-mono), 'JetBrains Mono', 'SF Mono', monospace",
};

const cardStyle: React.CSSProperties = {
  backgroundColor: "var(--color-bg-surface)",
  border: "1px solid var(--color-border-subtle)",
  borderRadius: 14,
  padding: 24,
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function HomePage() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setProgress(nextModule.progressPercent), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring}
      style={{
        maxWidth: 880,
        display: "flex",
        flexDirection: "column",
        gap: 48,
      }}
    >
      {/* ── SECTION 1: Page Header (§4.9) ── */}
      <header>
        <h1
          style={{
            fontFamily: font.display,
            fontSize: 36,
            lineHeight: "42px",
            fontWeight: 600,
            letterSpacing: "-0.02em",
            color: "var(--color-text-primary)",
            margin: 0,
          }}
        >
          {getGreeting()}, {user.firstName}
        </h1>
        <p
          style={{
            fontFamily: font.mono,
            fontSize: 13,
            lineHeight: "18px",
            fontWeight: 500,
            letterSpacing: "0",
            textTransform: "uppercase",
            color: "var(--color-text-tertiary)",
            marginTop: 10,
          }}
        >
          Cohort 01 · {cohort.track} · Week {pad2(cohort.currentWeek)} / {cohort.totalWeeks}
        </p>
      </header>

      {/* ── SECTION 2: Next Step Card (§4.1 featured card, §4.4) ── */}
      <motion.section {...sectionAnim(0)}>
        <div style={{ ...cardStyle, padding: 32 }}>
          <SectionLabel color="var(--color-indigo-text)">Up Next</SectionLabel>

          <h2
            style={{
              fontFamily: font.display,
              fontSize: 26,
              lineHeight: "32px",
              fontWeight: 600,
              letterSpacing: "-0.015em",
              color: "var(--color-text-primary)",
              margin: 0,
              marginTop: 12,
            }}
          >
            {nextModule.label}
          </h2>

          {/* Metadata row + BTC badge */}
          <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                fontFamily: font.mono,
                fontSize: 13,
                lineHeight: "18px",
                fontWeight: 500,
                color: "var(--color-text-tertiary)",
                textTransform: "uppercase",
              }}
            >
              {nextModule.unit} · {nextModule.module} · {nextModule.lesson}
            </span>
            <Badge variant="btc">BTC</Badge>
          </div>

          {/* Progress bar */}
          <div
            style={{
              marginTop: 20,
              height: 3,
              width: "100%",
              borderRadius: "var(--radius-full)",
              backgroundColor: "var(--color-bg-surface-2)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                transition: "width 600ms cubic-bezier(0.4, 0, 0.2, 1)",
                height: 3,
                backgroundColor: "var(--color-indigo)",
                borderRadius: "var(--radius-full)",
              }}
            />
          </div>

          {/* Progress text */}
          <p
            style={{
              fontFamily: font.mono,
              fontSize: 11,
              lineHeight: "14px",
              fontWeight: 500,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "var(--color-text-tertiary)",
              marginTop: 8,
            }}
          >
            {nextModule.progressPercent}% of module complete
          </p>

          {/* Action row */}
          <div style={{ marginTop: 24, display: "flex", alignItems: "center", gap: 8 }}>
            <PrimaryButton icon={BookOpen}>Continue learning</PrimaryButton>
            <OutlineButton icon={FileText}>View syllabus</OutlineButton>
          </div>
        </div>
      </motion.section>

      {/* ── SECTION 3: Stats Row (§6.5) ── */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16,
          alignItems: "stretch",
        }}
        className="max-sm:!grid-cols-1"
      >
        {[
          {
            label: "CURRENT WEEK",
            value: `W${pad2(cohort.currentWeek)}`,
            sub: `OF ${cohort.totalWeeks} WEEKS`,
            valueColor: "var(--color-indigo-text)",
          },
          {
            label: "MODULES COMPLETE",
            value: pad2(stats.modulesComplete),
            sub: `OF ${stats.modulesTotal} MODULES`,
            valueColor: "var(--color-text-primary)",
          },
          {
            label: "MISSIONS",
            value: pad2(stats.missionsPassed),
            sub: `PASSED · ${pad2(stats.missionsPending)} PENDING`,
            valueColor: "var(--color-text-primary)",
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: 0.06 + i * 0.06 }}
            style={{
              ...cardStyle,
              padding: 20,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              height: "100%",
            }}
          >
            <SectionLabel>{stat.label}</SectionLabel>
            <p
              style={{
                fontFamily: font.mono,
                fontSize: 30,
                lineHeight: "34px",
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
                fontSize: 13,
                lineHeight: "18px",
                fontWeight: 500,
                color: "var(--color-text-tertiary)",
                textTransform: "uppercase",
                margin: 0,
                marginTop: 6,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {stat.sub}
            </p>
          </motion.div>
        ))}
      </section>

      {/* ── SECTION 4: Current Mission ── */}
      <motion.section {...sectionAnim(0.12)}>
        <div style={cardStyle}>
          <SectionLabel color="var(--color-warning-text)">Current Mission</SectionLabel>

          <h2
            style={{
              fontFamily: font.display,
              fontSize: 20,
              lineHeight: "26px",
              fontWeight: 600,
              letterSpacing: "-0.01em",
              color: "var(--color-text-primary)",
              margin: 0,
              marginTop: 12,
            }}
          >
            {currentMission.title}
          </h2>

          {/* Deadline + StatusPill — same row, 8px gap */}
          <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                fontFamily: font.mono,
                fontSize: 13,
                lineHeight: "18px",
                fontWeight: 500,
                color: "var(--color-warning-text)",
                textTransform: "uppercase",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              Due in {currentMission.dueInDays} days
            </span>
            <StatusPill label={currentMission.status} variant="indigo" />
          </div>

          {/* Action row */}
          <div style={{ marginTop: 24, display: "flex", alignItems: "center", gap: 8 }}>
            <PrimaryButton icon={Target}>Submit deliverable</PrimaryButton>
            <OutlineButton icon={FileText}>Mission brief</OutlineButton>
          </div>
        </div>
      </motion.section>

      {/* ── SECTION 5: Next Live Workshop ── */}
      <motion.section {...sectionAnim(0.18)}>
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <SectionLabel>Next Live Session</SectionLabel>
            <Badge variant="indigo">Live</Badge>
          </div>

          {nextWorkshop ? (
            <>
              <h2
                style={{
                  fontFamily: font.display,
                  fontSize: 20,
                  lineHeight: "26px",
                  fontWeight: 600,
                  letterSpacing: "-0.01em",
                  color: "var(--color-text-primary)",
                  margin: 0,
                  marginTop: 12,
                }}
              >
                {nextWorkshop.title}
              </h2>
              <p
                style={{
                  fontFamily: font.mono,
                  fontSize: 13,
                  lineHeight: "18px",
                  fontWeight: 500,
                  color: "var(--color-text-tertiary)",
                  textTransform: "uppercase",
                  margin: 0,
                  marginTop: 6,
                }}
              >
                {nextWorkshop.date}
              </p>
              <p
                style={{
                  fontFamily: font.body,
                  fontSize: "14.5px",
                  lineHeight: "22px",
                  fontWeight: 400,
                  color: "var(--color-text-secondary)",
                  margin: 0,
                  marginTop: 4,
                }}
              >
                with {nextWorkshop.host}
              </p>

              <div style={{ marginTop: 24 }}>
                <OutlineButton icon={Radio}>Add to calendar</OutlineButton>
              </div>
            </>
          ) : (
            <p
              style={{
                fontFamily: font.body,
                fontSize: 13,
                lineHeight: "19px",
                fontWeight: 400,
                color: "var(--color-text-tertiary)",
                marginTop: 12,
              }}
            >
              No upcoming sessions. Check back soon.
            </p>
          )}
        </div>
      </motion.section>

      {/* ── SECTION 6: Announcements ── */}
      <motion.section {...sectionAnim(0.24)}>
        <SectionLabel>Announcements</SectionLabel>

        <div style={{ marginTop: 12 }}>
          {announcements.map((a, i) => (
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
          ))}
        </div>
      </motion.section>
    </motion.div>
  );
}

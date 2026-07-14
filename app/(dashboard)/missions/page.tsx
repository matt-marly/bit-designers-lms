"use client";

import { useState } from "react";
import Link from "next/link";
import { Calendar, ChevronRight, ClipboardList, MessageSquare, CheckCircle } from "lucide-react";
import { StatusPill } from "@/components/ui/custom/status-pill";
import { mockMissions } from "@/lib/mock-missions-data";
import type { Mission, MissionStatus } from "@/lib/mock-missions-data";

const font = {
  display: "var(--font-display), 'Space Grotesk', 'Inter', system-ui, sans-serif",
  body: "var(--font-body), 'Inter', system-ui, -apple-system, sans-serif",
  mono: "var(--font-mono), 'JetBrains Mono', 'SF Mono', monospace",
};

type FilterMode = "all" | "pending" | "passed";

function getStatusPillProps(status: MissionStatus): {
  label: string;
  variant: "success" | "warning" | "indigo" | "danger" | "neutral";
} {
  switch (status) {
    case "passed":
      return { label: "Passed", variant: "success" };
    case "needs-revision":
      return { label: "Needs Revision", variant: "warning" };
    case "submitted":
      return { label: "Submitted", variant: "indigo" };
    case "in-review":
      return { label: "In Review", variant: "indigo" };
    case "not-started":
      return { label: "Not Started", variant: "neutral" };
  }
}

function getDueMeta(dateStr: string, status: MissionStatus): { text: string; color: string } {
  if (status === "passed") {
    return { text: "COMPLETED", color: "var(--color-success-text)" };
  }
  if (status === "submitted" || status === "in-review") {
    return { text: "SUBMITTED", color: "var(--color-indigo-text)" };
  }

  const due = new Date(dateStr + "T23:59:59");
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const formatted = new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  if (status === "needs-revision" && diffDays < 0) {
    return { text: `OVERDUE · ${formatted}`, color: "var(--color-warning-text)" };
  }
  if (status === "not-started" && diffDays < 0) {
    return { text: `OVERDUE · ${formatted}`, color: "var(--color-danger-text)" };
  }
  if (diffDays <= 3) {
    return { text: `DUE ${formatted}`, color: "var(--color-warning-text)" };
  }
  return { text: `DUE ${formatted}`, color: "var(--color-text-tertiary)" };
}

function filterMissions(missions: Mission[], filter: FilterMode): Mission[] {
  switch (filter) {
    case "all":
      return missions;
    case "pending":
      return missions.filter(
        (m) => m.status === "not-started" || m.status === "needs-revision" || m.status === "submitted"
      );
    case "passed":
      return missions.filter((m) => m.status === "passed");
  }
}

function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "6px 12px",
        borderRadius: 999,
        border: `1px solid ${active ? "var(--color-indigo-border)" : "var(--color-border-subtle)"}`,
        backgroundColor: active ? "var(--color-indigo-subtle)" : "var(--color-bg-surface-2)",
        color: active ? "var(--color-indigo-text)" : "var(--color-text-tertiary)",
        fontFamily: font.mono,
        fontSize: 11,
        lineHeight: "14px",
        fontWeight: 600,
        letterSpacing: "0.10em",
        textTransform: "uppercase",
        cursor: "pointer",
        transitionProperty: "border-color, background-color, color",
        transitionDuration: "var(--duration-fast)",
        transitionTimingFunction: "var(--ease-out-quart)",
        fontVariantNumeric: "tabular-nums",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.borderColor = "var(--color-border-strong)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.borderColor = "var(--color-border-subtle)";
        }
      }}
    >
      {label}
    </button>
  );
}

function EmptyState({ filter }: { filter: FilterMode }) {
  const titleMap: Record<FilterMode, string> = {
    all: "No missions yet",
    pending: "No pending missions",
    passed: "No passed missions",
  };
  const bodyMap: Record<FilterMode, string> = {
    all: "Missions will appear here as your cohort progresses.",
    pending: "All caught up. No missions need your attention right now.",
    passed: "Completed missions will appear here once reviewed.",
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        maxWidth: 360,
        margin: "0 auto",
        padding: "64px 24px",
      }}
    >
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: "50%",
          backgroundColor: "var(--color-bg-surface-2)",
          border: "1px solid var(--color-border-subtle)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ClipboardList
          style={{ width: 40, height: 40, color: "var(--color-text-tertiary)" }}
        />
      </div>
      <p
        style={{
          fontFamily: font.body,
          fontSize: 16,
          lineHeight: "22px",
          fontWeight: 600,
          letterSpacing: "-0.005em",
          color: "var(--color-text-primary)",
          margin: 0,
          marginTop: 20,
          textAlign: "center",
        }}
      >
        {titleMap[filter]}
      </p>
      <p
        style={{
          fontFamily: font.body,
          fontSize: 13,
          lineHeight: "19px",
          fontWeight: 400,
          color: "var(--color-text-secondary)",
          margin: 0,
          marginTop: 8,
          textAlign: "center",
        }}
      >
        {bodyMap[filter]}
      </p>
    </div>
  );
}

function MissionCell({ mission }: { mission: Mission }) {
  const statusProps = getStatusPillProps(mission.status);
  const due = getDueMeta(mission.dueAt, mission.status);
  const showFeedback = mission.status === "needs-revision";
  const isReviewed = mission.type === "reviewed";

  return (
    <Link
      href={`/missions/${mission.slug}`}
      style={{ textDecoration: "none", display: "block", height: "100%" }}
    >
      <div
        style={{
          backgroundColor: "var(--color-bg-surface)",
          padding: 24,
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          minHeight: 180,
          transitionProperty: "background-color",
          transitionDuration: "var(--duration-fast)",
          transitionTimingFunction: "var(--ease-out-quart)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#1C1C1C";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "var(--color-bg-surface)";
        }}
      >
        {/* TOP ROW — Mission number + Status */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 8,
          }}
        >
          <span
            style={{
              fontFamily: font.mono,
              fontSize: 10,
              lineHeight: "12px",
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "var(--color-text-tertiary)",
              fontVariantNumeric: "tabular-nums",
              marginTop: 6,
            }}
          >
            {`MISSION ${mission.number}`}
          </span>
          <StatusPill label={statusProps.label} variant={statusProps.variant} />
        </div>

        {/* Title */}
        <p
          style={{
            fontFamily: font.display,
            fontSize: 15,
            lineHeight: "22px",
            fontWeight: 600,
            color: "var(--color-text-primary)",
            margin: 0,
            marginTop: 12,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {mission.title}
        </p>

        {/* Module tag */}
        <p
          style={{
            fontFamily: font.mono,
            fontSize: 11,
            lineHeight: "14px",
            fontWeight: 500,
            textTransform: "uppercase",
            color: "var(--color-text-tertiary)",
            margin: 0,
            marginTop: 8,
            fontVariantNumeric: "tabular-nums",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: "100%",
          }}
        >
          {mission.module}
        </p>

        {/* Type indicator */}
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            alignSelf: "flex-start",
            height: 20,
            padding: "3px 8px",
            borderRadius: 999,
            backgroundColor: isReviewed
              ? "var(--color-indigo-subtle)"
              : "var(--color-bg-surface-3)",
            border: `1px solid ${isReviewed ? "var(--color-indigo-border)" : "var(--color-border-subtle)"}`,
            fontFamily: font.mono,
            fontSize: 10,
            fontWeight: 600,
            textTransform: "uppercase",
            color: isReviewed
              ? "var(--color-indigo-text)"
              : "var(--color-text-tertiary)",
            fontVariantNumeric: "tabular-nums",
            marginTop: 8,
          }}
        >
          {isReviewed ? "Mentor reviewed" : "Completion only"}
        </span>

        {/* SPACER */}
        <div style={{ flex: 1 }} />

        {/* BOTTOM META */}
        <div
          style={{
            marginTop: 16,
            borderTop: "1px solid var(--color-border-subtle)",
            paddingTop: 14,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {mission.status === "passed" ? (
                <CheckCircle
                  style={{ width: 12, height: 12, color: due.color, flexShrink: 0 }}
                />
              ) : (
                <Calendar
                  style={{ width: 12, height: 12, color: due.color, flexShrink: 0 }}
                />
              )}
              <span
                style={{
                  fontFamily: font.mono,
                  fontSize: 11,
                  lineHeight: "14px",
                  fontWeight: 500,
                  textTransform: "uppercase",
                  color: due.color,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {due.text}
              </span>
            </div>

            {showFeedback && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  marginTop: 4,
                }}
              >
                <MessageSquare
                  style={{
                    width: 11,
                    height: 11,
                    color: "var(--color-warning-text)",
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontFamily: font.mono,
                    fontSize: 10,
                    lineHeight: "12px",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    color: "var(--color-warning-text)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  Feedback received
                </span>
              </div>
            )}
          </div>

          <ChevronRight
            style={{
              width: 14,
              height: 14,
              color: "var(--color-text-tertiary)",
              flexShrink: 0,
            }}
          />
        </div>
      </div>
    </Link>
  );
}

export default function MissionsPage() {
  const [filter, setFilter] = useState<FilterMode>("all");

  const sortedMissions = [...mockMissions].sort(
    (a, b) => a.number.localeCompare(b.number)
  );
  const filtered = filterMissions(sortedMissions, filter);

  return (
    <div style={{ maxWidth: 960, margin: "0 auto" }}>
      {/* PAGE HEADER */}
      <header>
        {/* Context line */}
        <p
          style={{
            fontFamily: font.mono,
            fontSize: 11,
            lineHeight: "14px",
            fontWeight: 500,
            textTransform: "uppercase",
            color: "var(--color-text-tertiary)",
            margin: 0,
            marginBottom: 12,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          DESIGN LAB · COHORT 01 · WEEK 03
        </p>

        {/* Title */}
        <h1
          style={{
            fontFamily: font.display,
            fontSize: 44,
            lineHeight: 1.1,
            fontWeight: 600,
            letterSpacing: "-0.02em",
            color: "var(--color-text-primary)",
            margin: 0,
          }}
        >
          Missions
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontFamily: font.body,
            fontSize: 15,
            lineHeight: "24px",
            fontWeight: 400,
            color: "var(--color-text-secondary)",
            margin: 0,
            marginTop: 8,
            maxWidth: 520,
          }}
        >
          Your weekly deliverables. Submit your work, receive mentor feedback, and build your Bitcoin design portfolio.
        </p>

        {/* Filter row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginTop: 20,
          }}
        >
          <span
            style={{
              fontFamily: font.mono,
              fontSize: 11,
              lineHeight: "14px",
              fontWeight: 500,
              color: "var(--color-text-tertiary)",
            }}
          >
            Filter:
          </span>
          <FilterPill label="All" active={filter === "all"} onClick={() => setFilter("all")} />
          <FilterPill label="Pending" active={filter === "pending"} onClick={() => setFilter("pending")} />
          <FilterPill label="Passed" active={filter === "passed"} onClick={() => setFilter("passed")} />
        </div>

        {/* Divider */}
        <div
          style={{
            height: 1,
            backgroundColor: "var(--color-border-subtle)",
            marginTop: 24,
          }}
        />
      </header>

      {/* MISSION GRID */}
      <div
        style={{
          border: "1px solid var(--color-border-subtle)",
          borderRadius: 14,
          overflow: "hidden",
          marginTop: 24,
        }}
      >
        {filtered.length === 0 ? (
          <EmptyState filter={filter} />
        ) : (
          <div className="missions-dir-grid">
            {filtered.map((mission) => (
              <MissionCell key={mission.slug} mission={mission} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

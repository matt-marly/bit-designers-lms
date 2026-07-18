"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  GraduationCap,
  CheckSquare,
  CheckCircle,
  AlertCircle,
  Clock,
  Circle,
  MessageSquare,
} from "lucide-react";
import { mockMissions } from "@/lib/mock-missions-data";
import type { Mission, MissionStatus } from "@/lib/mock-missions-data";

const font = {
  display: "var(--font-display), 'Space Grotesk', 'Inter', system-ui, sans-serif",
  body: "var(--font-body), 'Inter', system-ui, -apple-system, sans-serif",
  mono: "var(--font-mono), 'JetBrains Mono', 'SF Mono', monospace",
};

type FilterMode = "all" | "pending" | "passed";

function getCardBg(status: MissionStatus): string {
  return status === "not-started" ? "#0E0E0E" : "#111111";
}

function isOverdue(dateStr: string): boolean {
  const due = new Date(dateStr + "T23:59:59");
  return due.getTime() < Date.now();
}

function getDueMeta(
  dateStr: string,
  status: MissionStatus
): { text: string } | null {
  if (status === "passed" || status === "submitted" || status === "in-review") {
    return null;
  }

  const due = new Date(dateStr + "T23:59:59");
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return null;
  }

  const formatted = new Date(dateStr)
    .toLocaleDateString("en-US", { month: "short", day: "numeric" })
    .toUpperCase();
  return { text: formatted };
}

function filterMissions(missions: Mission[], filter: FilterMode): Mission[] {
  switch (filter) {
    case "all":
      return missions;
    case "pending":
      return missions.filter(
        (m) =>
          m.status === "not-started" ||
          m.status === "needs-revision" ||
          m.status === "in-review" ||
          m.status === "submitted"
      );
    case "passed":
      return missions.filter((m) => m.status === "passed");
  }
}

function FilterTab({
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
        padding: "10px 20px",
        fontFamily: font.body,
        fontSize: 14,
        fontWeight: 500,
        color: active
          ? "var(--color-text-primary)"
          : "var(--color-text-tertiary)",
        backgroundColor: "transparent",
        border: "none",
        borderBottom: active
          ? "2px solid var(--color-indigo)"
          : "2px solid transparent",
        marginBottom: -1,
        cursor: "pointer",
        transitionProperty: "color",
        transitionDuration: "var(--duration-fast)",
        transitionTimingFunction: "var(--ease-out-quart)",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.color = "var(--color-text-secondary)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.color = "var(--color-text-tertiary)";
        }
      }}
    >
      {label}
    </button>
  );
}

function EmptyState({ filter }: { filter: FilterMode }) {
  if (filter === "all") {
    return (
      <div style={{ textAlign: "center", padding: "40px 0" }}>
        <p
          style={{
            fontFamily: font.body,
            fontSize: 14,
            color: "#737373",
            margin: 0,
          }}
        >
          No missions assigned yet.
        </p>
      </div>
    );
  }

  if (filter === "pending") {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "64px 24px",
        }}
      >
        <CheckCircle style={{ width: 32, height: 32, color: "#22C55E" }} />
        <p
          style={{
            fontFamily: font.body,
            fontSize: 16,
            fontWeight: 500,
            color: "#FFFFFF",
            margin: 0,
            marginTop: 12,
            textAlign: "center",
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
            textAlign: "center",
          }}
        >
          No pending missions right now.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "64px 24px",
      }}
    >
      <Circle style={{ width: 32, height: 32, color: "#737373" }} />
      <p
        style={{
          fontFamily: font.body,
          fontSize: 16,
          fontWeight: 500,
          color: "#FFFFFF",
          margin: 0,
          marginTop: 12,
          textAlign: "center",
        }}
      >
        No passed missions yet
      </p>
      <p
        style={{
          fontFamily: font.body,
          fontSize: 14,
          color: "#737373",
          margin: 0,
          marginTop: 6,
          textAlign: "center",
        }}
      >
        Keep going — passed missions will appear here.
      </p>
    </div>
  );
}

function StatusIndicator({ mission }: { mission: Mission }) {
  const iconSize = { width: 13, height: 13, flexShrink: 0 } as const;
  const labelStyle = {
    fontFamily: font.body,
    fontSize: 12,
    fontWeight: 500,
    lineHeight: "16px",
  } as const;

  switch (mission.status) {
    case "passed":
      return (
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <CheckCircle style={{ ...iconSize, color: "var(--color-text-secondary)" }} />
          <span style={{ ...labelStyle, color: "var(--color-text-secondary)" }}>
            Passed
          </span>
        </div>
      );
    case "needs-revision":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <AlertCircle style={{ ...iconSize, color: "#F59E0B" }} />
            <span style={{ ...labelStyle, color: "#F59E0B" }}>
              Needs revision
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <MessageSquare
              style={{
                width: 11,
                height: 11,
                color: "var(--color-text-tertiary)",
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
                color: "var(--color-text-tertiary)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              Feedback received
            </span>
          </div>
        </div>
      );
    case "submitted":
      return (
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <Clock style={{ ...iconSize, color: "var(--color-text-tertiary)" }} />
          <span style={{ ...labelStyle, color: "var(--color-text-tertiary)" }}>
            Submitted
          </span>
        </div>
      );
    case "in-review":
      return (
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <Clock style={{ ...iconSize, color: "var(--color-text-tertiary)" }} />
          <span style={{ ...labelStyle, color: "var(--color-text-tertiary)" }}>
            In review
          </span>
        </div>
      );
    case "not-started":
      return (
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <Circle style={{ ...iconSize, color: "var(--color-text-tertiary)" }} />
          <span style={{ ...labelStyle, color: "var(--color-text-tertiary)" }}>
            Not started
          </span>
        </div>
      );
  }
}

function MissionCell({ mission }: { mission: Mission }) {
  const due = getDueMeta(mission.dueAt, mission.status);
  const cardBg = getCardBg(mission.status);
  const isReviewed = mission.type === "reviewed";
  const overdue =
    isOverdue(mission.dueAt) &&
    mission.status !== "passed" &&
    mission.status !== "submitted" &&
    mission.status !== "in-review";

  return (
    <Link
      href={`/missions/${mission.slug}`}
      style={{ textDecoration: "none", display: "block", height: "100%" }}
    >
      <div
        style={{
          backgroundColor: cardBg,
          padding: 20,
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          minHeight: 160,
          transitionProperty: "background-color",
          transitionDuration: "var(--duration-fast)",
          transitionTimingFunction: "var(--ease-out-quart)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#161616";
          e.currentTarget.style.boxShadow = "inset 0 0 0 1px #333333";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = cardBg;
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        {/* TOP ROW */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {isReviewed ? (
              <GraduationCap
                style={{
                  width: 12,
                  height: 12,
                  color: "var(--color-text-tertiary)",
                  flexShrink: 0,
                }}
              />
            ) : (
              <CheckSquare
                style={{
                  width: 12,
                  height: 12,
                  color: "var(--color-text-tertiary)",
                  flexShrink: 0,
                }}
              />
            )}
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
              }}
            >
              {`MISSION ${mission.number}`}
            </span>
          </div>

          {overdue ? (
            <span
              style={{
                fontFamily: font.mono,
                fontSize: 10,
                lineHeight: "12px",
                fontWeight: 600,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "#F87171",
                backgroundColor: "rgba(239,68,68,0.10)",
                border: "1px solid rgba(239,68,68,0.20)",
                padding: "3px 8px",
                borderRadius: 999,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              OVERDUE
            </span>
          ) : due ? (
            <span
              style={{
                fontFamily: font.mono,
                fontSize: 11,
                lineHeight: "14px",
                fontWeight: 500,
                textTransform: "uppercase",
                color: "var(--color-text-tertiary)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {due.text}
            </span>
          ) : null}
        </div>

        {/* TITLE */}
        <p
          className="line-clamp-2"
          style={{
            fontFamily: font.display,
            fontSize: 15,
            lineHeight: "21px",
            fontWeight: 600,
            color: "var(--color-text-primary)",
            margin: 0,
            marginTop: 10,
          }}
        >
          {mission.title}
        </p>

        {/* MODULE */}
        <p
          style={{
            fontFamily: font.mono,
            fontSize: 11,
            lineHeight: "14px",
            fontWeight: 500,
            textTransform: "uppercase",
            color: "var(--color-text-tertiary)",
            margin: 0,
            marginTop: 6,
            fontVariantNumeric: "tabular-nums",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: "100%",
          }}
        >
          {mission.module}
        </p>

        {/* SPACER */}
        <div style={{ flex: 1 }} />

        {/* BOTTOM ROW */}
        <div
          style={{
            marginTop: 16,
            borderTop: "1px solid var(--color-border-subtle)",
            paddingTop: 12,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <StatusIndicator mission={mission} />

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

  const sortedMissions = [...mockMissions].sort((a, b) =>
    a.number.localeCompare(b.number)
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
          Your weekly deliverables. Submit your work, receive mentor feedback,
          and build your Bitcoin design portfolio.
        </p>

        {/* Tab bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 0,
            marginTop: 20,
            borderBottom: "1px solid var(--color-border-subtle)",
          }}
        >
          <FilterTab
            label="All"
            active={filter === "all"}
            onClick={() => setFilter("all")}
          />
          <FilterTab
            label="Pending"
            active={filter === "pending"}
            onClick={() => setFilter("pending")}
          />
          <FilterTab
            label="Passed"
            active={filter === "passed"}
            onClick={() => setFilter("passed")}
          />
        </div>
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

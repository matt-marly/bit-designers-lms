"use client";

import { useState } from "react";
import Link from "next/link";
import { Calendar, ChevronRight, ClipboardList, MessageSquare } from "lucide-react";
import { SectionLabel } from "@/components/ui/custom/section-label";
import { StatusPill } from "@/components/ui/custom/status-pill";
import { mockMissions, getMissionStats } from "@/lib/mock-missions-data";
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

function formatDueDate(dateStr: string, status: MissionStatus): { text: string; color: string } {
  const due = new Date(dateStr + "T23:59:59");
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  const formatted = new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  if (diffDays < 0 && status !== "passed") {
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

function StatPill({ dot, label }: { dot: string; label: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        backgroundColor: "var(--color-bg-surface-2)",
        border: "1px solid var(--color-border-subtle)",
        borderRadius: 999,
        padding: "6px 14px",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          backgroundColor: dot,
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontFamily: font.mono,
          fontSize: 11,
          lineHeight: "14px",
          fontWeight: 500,
          color: "var(--color-text-secondary)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {label}
      </span>
    </span>
  );
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

function SectionEmptyState({ filterLabel }: { filterLabel: string }) {
  return (
    <div
      style={{
        padding: 32,
        textAlign: "center",
      }}
    >
      <p
        style={{
          fontFamily: font.mono,
          fontSize: 13,
          lineHeight: "18px",
          fontWeight: 500,
          color: "var(--color-text-tertiary)",
          margin: 0,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {`No ${filterLabel} missions in this section`}
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        maxWidth: 360,
        margin: "0 auto",
        padding: "48px 24px",
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
        No missions yet
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
        Missions will appear here as your cohort progresses.
      </p>
    </div>
  );
}

function MissionTypeBadge({ type }: { type: "reviewed" | "completion-only" }) {
  const isReviewed = type === "reviewed";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
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
      }}
    >
      {isReviewed ? "REVIEWED" : "COMPLETION"}
    </span>
  );
}

function MissionCell({ mission }: { mission: Mission }) {
  const statusProps = getStatusPillProps(mission.status);
  const due = formatDueDate(mission.dueAt, mission.status);
  const showFeedback = mission.status === "needs-revision";

  return (
    <Link
      href={`/missions/${mission.slug}`}
      className="missions-cell"
      style={{ textDecoration: "none", display: "block", height: "100%" }}
    >
      <div
        style={{
          backgroundColor: "var(--color-bg-surface)",
          padding: 20,
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          transitionProperty: "background-color",
          transitionDuration: "var(--duration-fast)",
          transitionTimingFunction: "var(--ease-out-quart)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "var(--color-bg-surface-2)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "var(--color-bg-surface)";
        }}
      >
        {/* TOP ROW — Tags */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 8,
          }}
        >
          <MissionTypeBadge type={mission.type} />
          <StatusPill label={statusProps.label} variant={statusProps.variant} />
        </div>

        {/* Mission number + title */}
        <div style={{ marginTop: 12 }}>
          <p
            style={{
              fontFamily: font.mono,
              fontSize: 10,
              lineHeight: "12px",
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "var(--color-text-tertiary)",
              margin: 0,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {`MISSION ${mission.number}`}
          </p>
          <p
            style={{
              fontFamily: font.display,
              fontSize: 15,
              lineHeight: "20px",
              fontWeight: 600,
              color: "var(--color-text-primary)",
              margin: 0,
              marginTop: 4,
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {mission.title}
          </p>
        </div>

        {/* Module */}
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
          }}
        >
          {mission.module}
        </p>

        {/* SPACER */}
        <div style={{ flex: 1 }} />

        {/* BOTTOM META */}
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
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Calendar
                style={{ width: 12, height: 12, color: due.color, flexShrink: 0 }}
              />
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
                  Feedback
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

function MissionSection({
  label,
  description,
  missions,
  filter,
  allCount,
}: {
  label: string;
  description: string;
  missions: Mission[];
  filter: FilterMode;
  allCount: number;
}) {
  const filterLabel = filter === "all" ? "" : filter;

  return (
    <div>
      {/* Section header */}
      <div
        style={{
          padding: "24px 24px 16px 24px",
          borderBottom: missions.length > 0 ? "1px solid var(--color-border-subtle)" : "none",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 16,
        }}
      >
        <div>
          <SectionLabel>{label}</SectionLabel>
          <p
            style={{
              fontFamily: font.body,
              fontSize: 13,
              lineHeight: "19px",
              fontWeight: 400,
              color: "var(--color-text-tertiary)",
              margin: 0,
              marginTop: 4,
            }}
          >
            {description}
          </p>
        </div>
        <span
          style={{
            fontFamily: font.mono,
            fontSize: 11,
            lineHeight: "14px",
            fontWeight: 600,
            letterSpacing: "0.10em",
            textTransform: "uppercase",
            color: "var(--color-text-tertiary)",
            flexShrink: 0,
            marginTop: 2,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {`${allCount} mission${allCount !== 1 ? "s" : ""}`}
        </span>
      </div>

      {/* Grid or empty */}
      {allCount === 0 ? (
        <EmptyState />
      ) : missions.length === 0 ? (
        <SectionEmptyState filterLabel={filterLabel} />
      ) : (
        <div className="missions-dir-grid">
          {missions.map((mission) => (
            <MissionCell key={mission.slug} mission={mission} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function MissionsPage() {
  const [filter, setFilter] = useState<FilterMode>("all");
  const stats = getMissionStats();

  const allReviewed = mockMissions.filter((m) => m.type === "reviewed");
  const allCompletion = mockMissions.filter((m) => m.type === "completion-only");

  const filteredReviewed = filterMissions(allReviewed, filter);
  const filteredCompletion = filterMissions(allCompletion, filter);

  return (
    <div style={{ maxWidth: 960, margin: "0 auto" }}>
      {/* PAGE HEADER — directory style */}
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

        {/* Main title */}
        <h1
          style={{
            fontFamily: font.display,
            fontSize: 36,
            lineHeight: 1.2,
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
            maxWidth: 560,
          }}
        >
          Your weekly deliverables. Submit your work, receive mentor feedback, and build your Bitcoin design portfolio.
        </p>

        {/* Utility row */}
        <div
          className="missions-utility-row"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 20,
            gap: 16,
          }}
        >
          {/* Left — stat pills */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            {stats.passed > 0 && (
              <StatPill dot="var(--color-success)" label={`${stats.passed} Passed`} />
            )}
            {stats.needsRevision > 0 && (
              <StatPill dot="var(--color-warning)" label={`${stats.needsRevision} Needs Revision`} />
            )}
            {stats.submitted > 0 && (
              <StatPill dot="var(--color-indigo)" label={`${stats.submitted} Submitted`} />
            )}
            {stats.inReview > 0 && (
              <StatPill dot="var(--color-indigo)" label={`${stats.inReview} In Review`} />
            )}
            {stats.notStarted > 0 && (
              <StatPill dot="var(--color-text-tertiary)" label={`${stats.notStarted} Not Started`} />
            )}
          </div>

          {/* Right — filter */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontFamily: font.body,
                fontSize: 13,
                lineHeight: "19px",
                fontWeight: 400,
                color: "var(--color-text-tertiary)",
              }}
            >
              Show:
            </span>
            <FilterPill label="All" active={filter === "all"} onClick={() => setFilter("all")} />
            <FilterPill label="Pending" active={filter === "pending"} onClick={() => setFilter("pending")} />
            <FilterPill label="Passed" active={filter === "passed"} onClick={() => setFilter("passed")} />
          </div>
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

      {/* MAIN CONTAINER */}
      <div
        style={{
          border: "1px solid var(--color-border-subtle)",
          borderRadius: 12,
          overflow: "hidden",
          marginTop: 24,
        }}
      >
        {/* Reviewed Missions */}
        <MissionSection
          label="REVIEWED MISSIONS"
          description="Reviewed by your mentor. Must pass to complete."
          missions={filteredReviewed}
          filter={filter}
          allCount={allReviewed.length}
        />

        {/* Divider between sections */}
        <div
          style={{
            height: 1,
            backgroundColor: "var(--color-border-subtle)",
          }}
        />

        {/* Completion Missions */}
        <MissionSection
          label="COMPLETION MISSIONS"
          description="Submit to confirm completion. No review required."
          missions={filteredCompletion}
          filter={filter}
          allCount={allCompletion.length}
        />
      </div>
    </div>
  );
}

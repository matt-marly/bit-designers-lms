"use client";

import Link from "next/link";
import { ChevronRight, MessageSquare } from "lucide-react";
import { PageHeader } from "@/components/ui/custom/page-header";
import { SectionLabel } from "@/components/ui/custom/section-label";
import { StatusPill } from "@/components/ui/custom/status-pill";
import { mockMissions, getMissionStats } from "@/lib/mock-missions-data";
import type { MissionStatus } from "@/lib/mock-missions-data";

const font = {
  display: "var(--font-display), 'Space Grotesk', 'Inter', system-ui, sans-serif",
  body: "var(--font-body), 'Inter', system-ui, -apple-system, sans-serif",
  mono: "var(--font-mono), 'JetBrains Mono', 'SF Mono', monospace",
};

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

function formatDueDate(dateStr: string): { text: string; color: string } {
  const due = new Date(dateStr + "T23:59:59");
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  const formatted = new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  if (diffDays < 0) {
    return { text: `OVERDUE · ${formatted}`, color: "var(--color-danger-text)" };
  }
  if (diffDays <= 3) {
    return { text: `DUE ${formatted}`, color: "var(--color-warning-text)" };
  }
  return { text: `DUE ${formatted}`, color: "var(--color-text-tertiary)" };
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
          fontSize: 12,
          lineHeight: "16px",
          fontWeight: 500,
          color: "var(--color-text-secondary)",
        }}
      >
        {label}
      </span>
    </span>
  );
}

export default function MissionsPage() {
  const stats = getMissionStats();

  const reviewedMissions = mockMissions.filter((m) => m.type === "reviewed");
  const completionMissions = mockMissions.filter((m) => m.type === "completion-only");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 48 }}>
      {/* Page Header */}
      <div>
        <PageHeader title="Missions" context="DESIGN LAB · COHORT 01 · WEEK 03" />

        {/* Summary stat pills */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            marginTop: 24,
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
      </div>

      {/* Reviewed Missions */}
      <section>
        <SectionLabel>Reviewed Missions</SectionLabel>
        <p
          style={{
            fontFamily: font.body,
            fontSize: 13,
            lineHeight: "19px",
            fontWeight: 400,
            color: "var(--color-text-tertiary)",
            margin: 0,
            marginTop: 4,
            marginBottom: 20,
          }}
        >
          Reviewed by your mentor. Must pass to complete the program.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {reviewedMissions.map((mission) => (
            <MissionCard key={mission.slug} mission={mission} />
          ))}
        </div>
      </section>

      {/* Completion Missions */}
      <section>
        <SectionLabel>Completion Missions</SectionLabel>
        <p
          style={{
            fontFamily: font.body,
            fontSize: 13,
            lineHeight: "19px",
            fontWeight: 400,
            color: "var(--color-text-tertiary)",
            margin: 0,
            marginTop: 4,
            marginBottom: 20,
          }}
        >
          Submit to confirm completion. No mentor review required.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {completionMissions.map((mission) => (
            <MissionCard key={mission.slug} mission={mission} />
          ))}
        </div>
      </section>
    </div>
  );
}

function MissionCard({ mission }: { mission: (typeof mockMissions)[number] }) {
  const statusProps = getStatusPillProps(mission.status);
  const due = formatDueDate(mission.dueAt);
  const showFeedback = mission.status === "needs-revision";

  return (
    <Link href={`/missions/${mission.slug}`} style={{ textDecoration: "none", display: "block" }}>
      <div
        style={{
          backgroundColor: "var(--color-bg-surface)",
          border: "1px solid var(--color-border-subtle)",
          borderRadius: 14,
          padding: "20px 24px",
          cursor: "pointer",
          transitionProperty: "background-color, border-color",
          transitionDuration: "var(--duration-fast)",
          transitionTimingFunction: "var(--ease-out-quart)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "var(--color-bg-surface-2)";
          e.currentTarget.style.borderColor = "var(--color-border-strong)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "var(--color-bg-surface)";
          e.currentTarget.style.borderColor = "var(--color-border-subtle)";
        }}
      >
        {/* Row 1 */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 16,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <SectionLabel>{`Mission ${mission.number}`}</SectionLabel>
            <p
              style={{
                fontFamily: font.display,
                fontSize: 16,
                lineHeight: "22px",
                fontWeight: 600,
                color: "var(--color-text-primary)",
                margin: 0,
                marginTop: 4,
              }}
            >
              {mission.title}
            </p>
            <p
              style={{
                fontFamily: font.mono,
                fontSize: 12,
                lineHeight: "16px",
                fontWeight: 500,
                color: "var(--color-text-tertiary)",
                margin: 0,
                marginTop: 6,
                textTransform: "uppercase",
              }}
            >
              {mission.module}
            </p>
          </div>

          <div style={{ flexShrink: 0 }}>
            <StatusPill label={statusProps.label} variant={statusProps.variant} />
          </div>
        </div>

        {/* Row 2 */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* Due date */}
            {mission.status !== "passed" && (
              <span
                style={{
                  fontFamily: font.mono,
                  fontSize: 11,
                  lineHeight: "14px",
                  fontWeight: 600,
                  letterSpacing: "0.10em",
                  textTransform: "uppercase",
                  color: due.color,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {due.text}
              </span>
            )}

            {/* Feedback indicator */}
            {showFeedback && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <MessageSquare
                  style={{
                    width: 12,
                    height: 12,
                    color: "var(--color-warning-text)",
                  }}
                />
                <span
                  style={{
                    fontFamily: font.mono,
                    fontSize: 11,
                    lineHeight: "14px",
                    fontWeight: 600,
                    letterSpacing: "0.10em",
                    textTransform: "uppercase",
                    color: "var(--color-warning-text)",
                  }}
                >
                  Feedback received
                </span>
              </span>
            )}
          </div>

          <ChevronRight
            style={{ width: 16, height: 16, color: "var(--color-text-tertiary)", flexShrink: 0 }}
          />
        </div>
      </div>
    </Link>
  );
}

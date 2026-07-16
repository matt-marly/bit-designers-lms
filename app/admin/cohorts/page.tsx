"use client";

import { useState, useEffect } from "react";
import { Calendar, Users, BarChart3 } from "lucide-react";
import { SectionLabel } from "@/components/ui/custom/section-label";
import { StatusPill } from "@/components/ui/custom/status-pill";
import { OutlineButton } from "@/components/ui/custom/buttons";
import { mockCohorts } from "@/lib/mock-admin-data";

const font = {
  display: "var(--font-display), 'Space Grotesk', 'Inter', system-ui, sans-serif",
  body: "var(--font-body), 'Inter', system-ui, -apple-system, sans-serif",
  mono: "var(--font-mono), 'JetBrains Mono', 'SF Mono', monospace",
};

const cardStyle: React.CSSProperties = {
  backgroundColor: "var(--color-bg-surface)",
  border: "1px solid var(--color-border-subtle)",
  borderRadius: 14,
};

function formatDateRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return `${fmt(s)} – ${fmt(e)}`;
}

export default function CohortsPage() {
  const [progress, setProgress] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setProgress(mockCohorts[0].completionRate), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div>
      {/* Title row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32 }}>
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
          Cohorts
        </h1>
        <div
          style={{ position: "relative" }}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <button
            disabled
            className="inline-flex items-center justify-center"
            style={{
              height: 40,
              padding: "0 16px",
              borderRadius: 10,
              backgroundColor: "var(--color-indigo)",
              color: "var(--color-text-on-accent)",
              fontFamily: font.body,
              fontSize: "14.5px",
              fontWeight: 500,
              border: "none",
              opacity: 0.4,
              cursor: "not-allowed",
              pointerEvents: "none",
            }}
          >
            New Cohort
          </button>
          {showTooltip && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                right: 0,
                marginTop: 4,
                backgroundColor: "var(--color-bg-surface-3)",
                border: "1px solid var(--color-border-subtle)",
                borderRadius: 10,
                padding: "6px 10px",
                whiteSpace: "nowrap",
                fontFamily: font.body,
                fontSize: 12,
                fontWeight: 400,
                color: "var(--color-text-tertiary)",
                zIndex: 10,
              }}
            >
              Coming in V2
            </div>
          )}
        </div>
      </div>

      {/* Cohort cards */}
      {mockCohorts.map((cohort) => (
        <div key={cohort.id} style={{ ...cardStyle, padding: 24, marginBottom: 16 }}>
          {/* Top row */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
            <div>
              <SectionLabel>{cohort.name.toUpperCase()}</SectionLabel>
              <p
                style={{
                  fontFamily: font.display,
                  fontSize: 18,
                  lineHeight: "24px",
                  fontWeight: 600,
                  color: "var(--color-text-primary)",
                  margin: 0,
                  marginTop: 4,
                }}
              >
                Bitcoin for Designers — {cohort.track}
              </p>
            </div>
            <StatusPill label="ACTIVE" variant="indigo" />
          </div>

          {/* Meta row */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 20, marginTop: 16 }}>
            {[
              { icon: Calendar, text: formatDateRange(cohort.startDate, cohort.endDate) },
              { icon: Users, text: `${cohort.learnerCount} learners · ${cohort.mentorCount} mentor` },
              { icon: BarChart3, text: `${cohort.completionRate}% completion rate` },
            ].map((meta) => (
              <div key={meta.text} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <meta.icon style={{ width: 14, height: 14, color: "var(--color-text-tertiary)" }} />
                <span
                  style={{
                    fontFamily: font.mono,
                    fontSize: 12,
                    lineHeight: "16px",
                    fontWeight: 500,
                    color: "var(--color-text-tertiary)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {meta.text}
                </span>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div style={{ marginTop: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontFamily: font.body, fontSize: 13, fontWeight: 400, color: "var(--color-text-secondary)" }}>
                Overall Progress
              </span>
              <span style={{ fontFamily: font.mono, fontSize: 12, fontWeight: 500, color: "var(--color-text-tertiary)", fontVariantNumeric: "tabular-nums" }}>
                {cohort.completionRate}%
              </span>
            </div>
            <div style={{ height: 4, width: "100%", borderRadius: 999, backgroundColor: "var(--color-bg-surface-2)", overflow: "hidden" }}>
              <div style={{ width: `${progress}%`, height: 4, borderRadius: 999, backgroundColor: "var(--color-indigo)", transition: "width 600ms cubic-bezier(0.4, 0, 0.2, 1)" }} />
            </div>
          </div>

          {/* Actions */}
          <div style={{ marginTop: 20, borderTop: "1px solid var(--color-border-subtle)", paddingTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <OutlineButton size="small">View Learners</OutlineButton>
            <OutlineButton size="small">View Missions</OutlineButton>
            <OutlineButton size="small">Manage</OutlineButton>
          </div>
        </div>
      ))}
    </div>
  );
}

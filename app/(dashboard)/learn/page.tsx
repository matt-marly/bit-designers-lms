"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronRight, Lock } from "lucide-react";
import { PageHeader } from "@/components/ui/custom/page-header";
import { SectionLabel } from "@/components/ui/custom/section-label";
import { StatusPill } from "@/components/ui/custom/status-pill";
import { mockUnits, getTotalProgress } from "@/lib/mock-learn-data";
import type { ModuleStatus } from "@/lib/mock-learn-data";

const font = {
  display: "var(--font-display), 'Space Grotesk', 'Inter', system-ui, sans-serif",
  body: "var(--font-body), 'Inter', system-ui, -apple-system, sans-serif",
  mono: "var(--font-mono), 'JetBrains Mono', 'SF Mono', monospace",
};

function getStatusPill(status: ModuleStatus) {
  switch (status) {
    case "passed":
      return <StatusPill label="Complete" variant="success" />;
    case "in-progress":
      return <StatusPill label="In Progress" variant="indigo" />;
    case "not-started":
      return <StatusPill label="Not Started" variant="neutral" />;
  }
}

export default function LearnPage() {
  const { total, complete } = getTotalProgress();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setProgress(Math.round((complete / total) * 100)), 100);
    return () => clearTimeout(timer);
  }, [complete, total]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 48 }}>
      {/* Page Header + Progress */}
      <div>
        <PageHeader title="Learn" context="Design Lab · Bitcoin Foundations" />

        <div style={{ marginTop: 24 }}>
          <p
            style={{
              fontFamily: font.mono,
              fontSize: 13,
              lineHeight: "18px",
              fontWeight: 500,
              color: "var(--color-text-tertiary)",
              textTransform: "uppercase",
              margin: 0,
            }}
          >
            {complete} of {total} modules complete
          </p>
          <div
            style={{
              marginTop: 8,
              height: 3,
              width: "100%",
              borderRadius: "var(--radius-full)",
              backgroundColor: "var(--color-bg-surface-3)",
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
        </div>
      </div>

      {/* Units */}
      {mockUnits.map((unit) => {
        const unitComplete = unit.modules.filter((m) => m.status === "passed").length;
        return (
          <section key={unit.id}>
            {/* Unit header */}
            <div
              style={{
                borderBottom: "1px solid var(--color-border-subtle)",
                paddingBottom: 16,
                marginBottom: 16,
              }}
            >
              <SectionLabel>{`Unit ${unit.number}`}</SectionLabel>
              <h2
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
                {unit.title}
              </h2>
              <span
                style={{
                  fontFamily: font.mono,
                  fontSize: 11,
                  lineHeight: "14px",
                  fontWeight: 600,
                  letterSpacing: "0.10em",
                  textTransform: "uppercase",
                  color: "var(--color-text-tertiary)",
                  marginTop: 4,
                  display: "block",
                }}
              >
                {unit.modules.length} Modules · {unitComplete} Complete
              </span>
            </div>

            {/* Advisory lock banner */}
            {unit.locked && unit.lockMessage && (
              <div
                style={{
                  backgroundColor: "var(--color-bg-surface-2)",
                  border: "1px solid var(--color-border-subtle)",
                  borderRadius: 14,
                  padding: "14px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 16,
                }}
              >
                <Lock
                  style={{ width: 16, height: 16, color: "var(--color-text-tertiary)", flexShrink: 0 }}
                />
                <p
                  style={{
                    fontFamily: font.body,
                    fontSize: 14,
                    lineHeight: "20px",
                    fontWeight: 400,
                    color: "var(--color-text-secondary)",
                    margin: 0,
                  }}
                >
                  {unit.lockMessage}
                </p>
              </div>
            )}

            {/* Module cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {unit.modules.map((mod) => (
                <Link
                  key={mod.slug}
                  href={`/learn/${mod.slug}`}
                  style={{ textDecoration: "none", display: "block" }}
                >
                  <div
                    style={{
                      backgroundColor: "var(--color-bg-surface)",
                      border: "1px solid var(--color-border-subtle)",
                      borderRadius: 14,
                      padding: 20,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 16,
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
                    <div style={{ minWidth: 0 }}>
                      <SectionLabel>{`Module ${mod.number}`}</SectionLabel>
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
                        {mod.title}
                      </p>
                      <span
                        style={{
                          fontFamily: font.mono,
                          fontSize: 11,
                          lineHeight: "14px",
                          fontWeight: 500,
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                          color: "var(--color-text-tertiary)",
                          marginTop: 6,
                          display: "block",
                        }}
                      >
                        Unit {unit.number} · {unit.title}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                      {getStatusPill(mod.status)}
                      <ChevronRight
                        style={{ width: 16, height: 16, color: "var(--color-text-tertiary)" }}
                      />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

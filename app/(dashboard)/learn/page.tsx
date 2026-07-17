"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Lock } from "lucide-react";
import { PageHeader } from "@/components/ui/custom/page-header";
import { SectionLabel } from "@/components/ui/custom/section-label";
import { StatusPill } from "@/components/ui/custom/status-pill";
import { mockUnits, getTotalProgress } from "@/lib/mock-learn-data";
import type { ModuleStatus, MockUnit } from "@/lib/mock-learn-data";

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

function getDefaultOpen(unit: MockUnit): boolean {
  const hasInProgress = unit.modules.some((m) => m.status === "in-progress");
  if (hasInProgress) return true;
  return false;
}

export default function LearnPage() {
  const { total, complete } = getTotalProgress();
  const [progress, setProgress] = useState(0);
  const [openUnits, setOpenUnits] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const unit of mockUnits) {
      initial[unit.id] = getDefaultOpen(unit);
    }
    return initial;
  });

  useEffect(() => {
    const timer = setTimeout(() => setProgress(Math.round((complete / total) * 100)), 100);
    return () => clearTimeout(timer);
  }, [complete, total]);

  // Build a flat list to check previous module status for soft gating
  const allModules = mockUnits.flatMap((unit) =>
    unit.modules.map((mod) => ({ ...mod, unitId: unit.id }))
  );

  function shouldShowGatingHint(moduleSlug: string): boolean {
    const idx = allModules.findIndex((m) => m.slug === moduleSlug);
    if (idx <= 0) return false;
    const prev = allModules[idx - 1];
    const current = allModules[idx];
    if (current.status !== "not-started") return false;
    return prev.status !== "passed";
  }

  function toggleUnit(unitId: string) {
    setOpenUnits((prev) => ({ ...prev, [unitId]: !prev[unitId] }));
  }

  return (
    <div style={{ maxWidth: 880, margin: "0 auto", display: "flex", flexDirection: "column", gap: 48 }}>
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
        const isOpen = !!openUnits[unit.id];
        return (
          <section key={unit.id}>
            {/* Unit header — clickable accordion toggle */}
            <div
              onClick={() => toggleUnit(unit.id)}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "16px 0",
                cursor: "pointer",
                borderBottom: "1px solid #242424",
                userSelect: "none",
              }}
            >
              {/* Left side */}
              <div>
                <span
                  style={{
                    fontFamily: font.mono,
                    fontSize: 11,
                    lineHeight: "14px",
                    fontWeight: 600,
                    letterSpacing: "0.10em",
                    textTransform: "uppercase",
                    color: "#737373",
                    display: "block",
                  }}
                >
                  Unit {unit.number}
                </span>
                <h2
                  style={{
                    fontFamily: font.display,
                    fontSize: 20,
                    lineHeight: "26px",
                    fontWeight: 600,
                    color: "#FFFFFF",
                    margin: 0,
                    marginTop: 4,
                  }}
                >
                  {unit.title}
                </h2>
              </div>

              {/* Right side */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                <span
                  style={{
                    fontFamily: font.mono,
                    fontSize: 12,
                    lineHeight: "16px",
                    fontWeight: 500,
                    textTransform: "uppercase",
                    color: "#737373",
                    whiteSpace: "nowrap",
                  }}
                >
                  {unitComplete} of {unit.modules.length} complete
                </span>
                <div
                  style={{
                    width: 80,
                    height: 3,
                    borderRadius: 999,
                    backgroundColor: "#242424",
                    overflow: "hidden",
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: unit.modules.length > 0 ? `${(unitComplete / unit.modules.length) * 100}%` : "0%",
                      height: 3,
                      backgroundColor: "#6366F1",
                      borderRadius: 999,
                    }}
                  />
                </div>
                <ChevronDown
                  style={{
                    width: 16,
                    height: 16,
                    color: "#737373",
                    transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 200ms ease",
                    flexShrink: 0,
                  }}
                />
              </div>
            </div>

            {/* Unit body — collapsible */}
            <div
              style={{
                maxHeight: isOpen ? 2000 : 0,
                overflow: "hidden",
                transition: "max-height 300ms ease-in-out",
              }}
            >
              <div style={{ paddingTop: 12, paddingBottom: 24 }}>
                {/* Advisory lock banner — only Unit 03 */}
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
                      marginBottom: 12,
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
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {unit.modules.map((mod) => {
                    const showGating = shouldShowGatingHint(mod.slug);
                    const isActive = mod.status === "in-progress";
                    return (
                      <Link
                        key={mod.slug}
                        href={`/learn/${mod.slug}`}
                        style={{ textDecoration: "none", display: "block" }}
                      >
                        <div
                          style={{
                            backgroundColor: "var(--color-bg-surface)",
                            border: isActive ? "1px solid #333333" : "1px solid var(--color-border-subtle)",
                            borderRadius: 14,
                            padding: "20px 24px",
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
                            e.currentTarget.style.borderColor = isActive ? "#333333" : "var(--color-border-subtle)";
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
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                marginTop: 6,
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
                                  color: "var(--color-text-tertiary)",
                                }}
                              >
                                Unit {unit.number} · {unit.title}
                              </span>
                              {showGating && (
                                <>
                                  <span
                                    style={{
                                      width: 1,
                                      height: 10,
                                      backgroundColor: "var(--color-border-subtle)",
                                      flexShrink: 0,
                                    }}
                                  />
                                  <span
                                    style={{
                                      fontFamily: font.mono,
                                      fontSize: 10,
                                      lineHeight: "12px",
                                      fontWeight: 500,
                                      letterSpacing: "0.06em",
                                      textTransform: "uppercase",
                                      color: "var(--color-text-tertiary)",
                                    }}
                                  >
                                    Complete previous module first
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                            {getStatusPill(mod.status)}
                            <ChevronRight
                              style={{
                                width: 16,
                                height: 16,
                                color: isActive ? "#6366F1" : "var(--color-text-tertiary)",
                              }}
                            />
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}

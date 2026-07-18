"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, ChevronDown, ChevronRight, Lock } from "lucide-react";
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
  const router = useRouter();
  const { total, complete } = getTotalProgress();
  const allComplete = complete === total && total > 0;
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
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {/* Row 1: breadcrumb */}
        <span
          style={{
            fontFamily: font.mono,
            fontSize: 11,
            lineHeight: "14px",
            fontWeight: 600,
            letterSpacing: "0.10em",
            textTransform: "uppercase",
            color: "#737373",
            marginBottom: 8,
          }}
        >
          Design Lab · Bitcoin Foundations
        </span>

        {/* Row 2: heading */}
        <h1
          style={{
            fontFamily: font.display,
            fontSize: 28,
            lineHeight: "34px",
            fontWeight: 700,
            color: "#FFFFFF",
            margin: 0,
          }}
        >
          Learn
        </h1>

        {/* Row 3: progress zone */}
        <div
          style={{
            marginTop: 24,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontFamily: font.mono,
              fontSize: 12,
              lineHeight: "16px",
              fontWeight: 500,
              textTransform: "uppercase",
              color: "#737373",
            }}
          >
            {complete} of {total} modules complete
          </span>
          <span
            style={{
              fontFamily: font.mono,
              fontSize: 12,
              lineHeight: "16px",
              fontWeight: 500,
              color: "#737373",
            }}
          >
            {progress}%
          </span>
        </div>

        {/* Row 4: progress bar */}
        <div
          style={{
            marginTop: 8,
            height: 4,
            width: "100%",
            borderRadius: 999,
            backgroundColor: "#1C1C1C",
            overflow: "hidden",
            marginBottom: 40,
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              transition: "width 600ms cubic-bezier(0.4, 0, 0.2, 1)",
              height: 4,
              backgroundColor: "#6366F1",
              borderRadius: 999,
            }}
          />
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
              role="button"
              tabIndex={0}
              onClick={() => toggleUnit(unit.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggleUnit(unit.id);
                }
              }}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "18px 0",
                cursor: "pointer",
                borderBottom: "1px solid #242424",
                userSelect: "none",
              }}
            >
              {/* Left side */}
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span
                  style={{
                    fontFamily: font.mono,
                    fontSize: 11,
                    lineHeight: "14px",
                    fontWeight: 600,
                    letterSpacing: "0.10em",
                    textTransform: "uppercase",
                    color: "#737373",
                    marginBottom: 4,
                  }}
                >
                  Unit {unit.number}
                </span>
                <h2
                  style={{
                    fontFamily: font.display,
                    fontSize: 18,
                    lineHeight: "24px",
                    fontWeight: 600,
                    color: "#FFFFFF",
                    margin: 0,
                  }}
                >
                  {unit.title}
                </h2>
              </div>

              {/* Right side */}
              <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
                <span
                  style={{
                    fontFamily: font.mono,
                    fontSize: 11,
                    lineHeight: "14px",
                    fontWeight: 500,
                    textTransform: "uppercase",
                    color: "#737373",
                    whiteSpace: "nowrap",
                  }}
                >
                  {unitComplete} of {unit.modules.length}
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
                <span
                  style={{
                    fontFamily: font.mono,
                    fontSize: 11,
                    lineHeight: "14px",
                    fontWeight: 500,
                    textTransform: "uppercase",
                    color: "#737373",
                    whiteSpace: "nowrap",
                  }}
                >
                  Complete
                </span>
                <ChevronDown
                  style={{
                    width: 16,
                    height: 16,
                    color: "#737373",
                    transform: isOpen ? "rotate(-180deg)" : "rotate(0deg)",
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
                {unit.modules.length === 0 ? (
                  <p
                    style={{
                      fontFamily: font.body,
                      fontSize: 14,
                      lineHeight: "22px",
                      color: "#737373",
                      padding: "20px 0",
                      margin: 0,
                    }}
                  >
                    No modules in this unit yet.
                  </p>
                ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {unit.modules.map((mod) => {
                    const showGating = shouldShowGatingHint(mod.slug);
                    const isActive = mod.status === "in-progress";
                    return (
                        <div
                          key={mod.slug}
                          role="button"
                          tabIndex={0}
                          onClick={() => router.push(`/learn/${mod.slug}`)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              router.push(`/learn/${mod.slug}`);
                            }
                          }}
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
                            transitionDuration: "120ms",
                            transitionTimingFunction: "ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#161616";
                            e.currentTarget.style.borderColor = isActive ? "rgba(99,102,241,0.40)" : "#333333";
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
                            {showGating && (
                              <span
                                style={{
                                  display: "block",
                                  marginTop: 4,
                                  fontFamily: font.mono,
                                  fontSize: 10,
                                  lineHeight: "12px",
                                  fontWeight: 500,
                                  letterSpacing: "0.06em",
                                  textTransform: "uppercase",
                                  color: "#737373",
                                }}
                              >
                                Complete previous module first
                              </span>
                            )}
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
                    );
                  })}
                </div>
                )}
              </div>
            </div>
          </section>
        );
      })}

      {/* All modules complete banner */}
      {allComplete && (
        <div
          style={{
            backgroundColor: "rgba(34,197,94,0.06)",
            border: "1px solid rgba(34,197,94,0.20)",
            borderRadius: 12,
            padding: "20px 24px",
            marginTop: 24,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <CheckCircle style={{ width: 20, height: 20, color: "#22C55E", flexShrink: 0 }} />
            <p
              style={{
                fontFamily: font.body,
                fontSize: 14,
                lineHeight: "22px",
                color: "#FFFFFF",
                margin: 0,
              }}
            >
              You&apos;ve completed all modules in this track. Outstanding work.
            </p>
          </div>
        </div>
      )}

      {/* Empty state hint when all units collapsed */}
      {!Object.values(openUnits).some(Boolean) && (
        <p
          style={{
            fontFamily: font.body,
            fontSize: 13,
            lineHeight: "19px",
            color: "#4A4A4A",
            textAlign: "center",
            marginTop: 32,
            margin: 0,
            marginBlockStart: 32,
          }}
        >
          Click any unit to expand its modules
        </p>
      )}
    </div>
  );
}

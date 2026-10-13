"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle, ChevronDown, ChevronRight } from "lucide-react";
import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { SectionLabel } from "@/components/ui/custom/section-label";
import { StatusPill } from "@/components/ui/custom/status-pill";
import {
  LoadingLine,
  PageMessage,
  ProgressBar,
  ProgressPill,
  TrackChips,
  font,
  monoLabelStyle,
} from "@/components/learn/ui";
import { useLearnerTrack } from "@/lib/use-learner-track";

type Overview = FunctionReturnType<typeof api.curriculum.overview>;
type Unit = Overview["units"][number];

export default function LearnPage() {
  const { loading, tracks, track, selectTrack } = useLearnerTrack();

  if (loading) return <LoadingLine>Loading…</LoadingLine>;
  if (track === null) {
    return (
      <PageMessage
        title="You're not in a track yet"
        body="Once you're added to a cohort, your track's modules show up here."
      />
    );
  }

  return (
    <div style={{ maxWidth: 880, margin: "0 auto" }}>
      <TrackChips tracks={tracks} selectedId={track.trackId} onSelect={selectTrack} />
      <TrackOverview key={track.trackId} trackId={track.trackId} />
    </div>
  );
}

function TrackOverview({ trackId }: { trackId: Id<"tracks"> }) {
  const overview = useQuery(api.curriculum.overview, { trackId });
  const [openUnits, setOpenUnits] = useState<Record<string, boolean>>({});

  if (overview === undefined) return <LoadingLine>Loading modules…</LoadingLine>;

  const { totals, units } = overview;
  const allComplete = totals.modules > 0 && totals.completedModules === totals.modules;
  const flat = units.flatMap((unit) => unit.modules.map((mod) => ({ ...mod, unitId: unit._id })));
  const current = flat.find((m) => m.status === "published" && m.progress !== "complete");

  function isOpen(unit: Unit) {
    const explicit = openUnits[unit._id];
    if (explicit !== undefined) return explicit;
    return current ? current.unitId === unit._id : unit === units[0];
  }

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .learn-heading { font-size: 24px !important; line-height: 30px !important; }
          .learn-unit-bar { display: none !important; }
          .learn-module-card { padding: 14px 16px !important; flex-direction: column !important; align-items: flex-start !important; gap: 10px !important; }
        }
      `}</style>

      <header style={{ marginBottom: 40 }}>
        <span style={{ ...monoLabelStyle, display: "block", marginBottom: 8 }}>{overview.track.name}</span>
        <h1
          className="learn-heading"
          style={{ fontFamily: font.display, fontSize: 28, lineHeight: "34px", fontWeight: 600, color: "#FFFFFF", margin: 0 }}
        >
          Learn
        </h1>
        {totals.modules > 0 && (
          <>
            <div style={{ marginTop: 24, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ ...monoLabelStyle, fontWeight: 500, fontSize: 12, letterSpacing: 0 }}>
                {totals.completedModules} of {totals.modules} modules complete
              </span>
              <span style={{ fontFamily: font.mono, fontSize: 12, color: "var(--color-text-tertiary)" }}>
                {Math.round((totals.completedModules / totals.modules) * 100)}%
              </span>
            </div>
            <ProgressBar value={totals.completedModules / totals.modules} label="Track progress" />
          </>
        )}
      </header>

      {units.length === 0 ? (
        <PageMessage
          title="No modules yet"
          body={
            overview.canEdit
              ? "Add units and modules on the Curriculum page in Admin."
              : "Your mentors are still preparing this track. Check back soon."
          }
          action={overview.canEdit ? { href: "/admin/curriculum", label: "Open Curriculum" } : undefined}
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {units.map((unit) => (
            <UnitSection
              key={unit._id}
              unit={unit}
              open={isOpen(unit)}
              onToggle={() => setOpenUnits((prev) => ({ ...prev, [unit._id]: !isOpen(unit) }))}
              currentModuleId={current?._id ?? null}
            />
          ))}
        </div>
      )}

      {allComplete && (
        <div
          role="status"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            backgroundColor: "rgba(34,197,94,0.06)",
            border: "1px solid rgba(34,197,94,0.20)",
            borderRadius: 14,
            padding: "20px 24px",
            marginTop: 40,
          }}
        >
          <CheckCircle aria-hidden style={{ width: 20, height: 20, color: "#22C55E", flexShrink: 0 }} />
          <p style={{ fontFamily: font.body, fontSize: 14, lineHeight: "22px", color: "#FFFFFF", margin: 0 }}>
            You&apos;ve completed every module in this track. Outstanding work.
          </p>
        </div>
      )}
    </>
  );
}

function UnitSection({
  unit,
  open,
  onToggle,
  currentModuleId,
}: {
  unit: Unit;
  open: boolean;
  onToggle: () => void;
  currentModuleId: Id<"modules"> | null;
}) {
  const published = unit.modules.filter((m) => m.status === "published");
  const done = published.filter((m) => m.progress === "complete").length;
  const panelId = `unit-panel-${unit._id}`;

  return (
    <section>
      <h2 style={{ margin: 0 }}>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            padding: "18px 0",
            border: "none",
            borderBottom: "1px solid #242424",
            background: "none",
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <span style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
            <span style={monoLabelStyle}>Unit {unit.number}</span>
            <span style={{ fontFamily: font.display, fontSize: 18, lineHeight: "24px", fontWeight: 600, color: "#FFFFFF" }}>
              {unit.title}
            </span>
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
            <span style={{ ...monoLabelStyle, fontWeight: 500, letterSpacing: 0 }}>
              {done} of {published.length}
            </span>
            <span className="learn-unit-bar" style={{ width: 80 }}>
              <ProgressBar value={published.length ? done / published.length : 0} height={3} label={`${unit.title} progress`} />
            </span>
            <ChevronDown
              aria-hidden
              style={{
                width: 16,
                height: 16,
                color: "#737373",
                transform: open ? "rotate(-180deg)" : "none",
                transition: "transform 200ms ease",
              }}
            />
          </span>
        </button>
      </h2>

      <div id={panelId} hidden={!open} style={{ paddingTop: 12 }}>
        {unit.description && (
          <p style={{ fontFamily: font.body, fontSize: 14, lineHeight: "22px", color: "var(--color-text-secondary)", margin: "4px 0 16px" }}>
            {unit.description}
          </p>
        )}
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
          {unit.modules.map((mod) => {
            const isCurrent = mod._id === currentModuleId;
            const draft = mod.status === "draft";
            return (
              <li key={mod._id}>
                <Link
                  href={`/learn/${mod.slug}`}
                  className="learn-module-card"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 16,
                    padding: "20px 24px",
                    backgroundColor: "var(--color-bg-surface)",
                    border: `1px solid ${isCurrent ? "rgba(99,102,241,0.40)" : "var(--color-border-subtle)"}`,
                    borderStyle: draft ? "dashed" : "solid",
                    borderRadius: 14,
                    textDecoration: "none",
                    transitionProperty: "background-color, border-color",
                    transitionDuration: "120ms",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#161616")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--color-bg-surface)")}
                >
                  <span style={{ minWidth: 0 }}>
                    <SectionLabel>{`Module ${mod.number}`}</SectionLabel>
                    <span
                      style={{
                        display: "block",
                        fontFamily: font.display,
                        fontSize: 16,
                        lineHeight: "22px",
                        fontWeight: 600,
                        color: "var(--color-text-primary)",
                        marginTop: 4,
                      }}
                    >
                      {mod.title}
                    </span>
                    <span style={{ display: "block", fontFamily: font.mono, fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 6 }}>
                      {mod.progress === "in_progress"
                        ? `${mod.completedLessons} of ${mod.lessonCount} lessons`
                        : `${mod.lessonCount} lesson${mod.lessonCount === 1 ? "" : "s"}`}
                    </span>
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                    {draft ? <StatusPill label="Draft" variant="warning" /> : <ProgressPill progress={mod.progress} />}
                    <ChevronRight
                      aria-hidden
                      style={{ width: 16, height: 16, color: isCurrent ? "#6366F1" : "var(--color-text-tertiary)" }}
                    />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

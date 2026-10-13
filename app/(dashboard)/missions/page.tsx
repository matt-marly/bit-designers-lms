"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle, CheckSquare, ChevronRight, Circle, GraduationCap } from "lucide-react";
import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { LoadingLine, PageMessage, TrackChips, font, monoLabelStyle } from "@/components/learn/ui";
import { MissionStatusIndicator, isOverdue, shortDate } from "@/components/learn/missions";
import { useLearnerTrack } from "@/lib/use-learner-track";

type MissionList = FunctionReturnType<typeof api.missions.list>;
type MissionRow = MissionList["missions"][number];
type FilterMode = "all" | "pending" | "done";

const FILTERS: { value: FilterMode; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "To do" },
  { value: "done", label: "Done" },
];

export default function MissionsPage() {
  const { loading, tracks, track, selectTrack } = useLearnerTrack();

  if (loading) return <LoadingLine>Loading…</LoadingLine>;
  if (track === null) {
    return (
      <PageMessage
        title="You're not in a track yet"
        body="Once you're added to a cohort, your track's missions show up here."
      />
    );
  }

  return (
    <div style={{ maxWidth: 960, margin: "0 auto" }}>
      <TrackChips tracks={tracks} selectedId={track.trackId} onSelect={selectTrack} />
      <TrackMissions key={track.trackId} trackId={track.trackId} />
    </div>
  );
}

function TrackMissions({ trackId }: { trackId: Id<"tracks"> }) {
  const data = useQuery(api.missions.list, { trackId });
  const [filter, setFilter] = useState<FilterMode>("all");

  if (data === undefined) return <LoadingLine>Loading missions…</LoadingLine>;

  const filtered = data.missions.filter((m) =>
    filter === "all" ? true : filter === "done" ? m.satisfied : !m.satisfied,
  );
  const { stats } = data;

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .missions-page-title { font-size: 32px !important; }
          .missions-tab-bar > button { flex: 1 !important; font-size: 13px !important; }
          .missions-cell-top { flex-wrap: wrap !important; gap: 6px !important; }
        }
      `}</style>
      <header>
        <p style={{ ...monoLabelStyle, fontWeight: 500, margin: 0, marginBottom: 12 }}>
          {data.track.name}
          {data.cohort && ` · ${data.cohort.name}`}
        </p>
        <h1
          className="missions-page-title"
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
        <p
          style={{
            fontFamily: font.body,
            fontSize: 15,
            lineHeight: "24px",
            color: "var(--color-text-secondary)",
            margin: 0,
            marginTop: 8,
            maxWidth: 560,
          }}
        >
          {stats.total === 0
            ? "Hands-on work for each module. Submit your work, get mentor feedback, and build your Bitcoin design portfolio."
            : `${stats.done} of ${stats.total} done` +
              (stats.needsRevision > 0 ? ` · ${stats.needsRevision} need${stats.needsRevision === 1 ? "s" : ""} revision` : "") +
              (stats.waiting > 0 ? ` · ${stats.waiting} waiting for review` : "")}
        </p>
        {!data.isStudent && stats.total > 0 && (
          <p style={{ fontFamily: font.body, fontSize: 13, color: "var(--color-text-tertiary)", margin: "8px 0 0" }}>
            You&apos;re viewing this track as staff. Only students can submit work.
          </p>
        )}

        <div
          role="tablist"
          aria-label="Filter missions"
          className="missions-tab-bar"
          style={{ display: "flex", alignItems: "center", marginTop: 20, borderBottom: "1px solid var(--color-border-subtle)" }}
        >
          {FILTERS.map((f) => {
            const active = filter === f.value;
            return (
              <button
                key={f.value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(f.value)}
                style={{
                  padding: "10px 20px",
                  fontFamily: font.body,
                  fontSize: 14,
                  fontWeight: 500,
                  color: active ? "var(--color-text-primary)" : "var(--color-text-tertiary)",
                  backgroundColor: "transparent",
                  border: "none",
                  borderBottom: active ? "2px solid var(--color-indigo)" : "2px solid transparent",
                  marginBottom: -1,
                  cursor: "pointer",
                  transitionProperty: "color",
                  transitionDuration: "var(--duration-fast)",
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </header>

      <div style={{ border: "1px solid var(--color-border-subtle)", borderRadius: 14, overflow: "hidden", marginTop: 24 }}>
        {filtered.length === 0 ? (
          <EmptyState filter={filter} hasMissions={stats.total > 0} />
        ) : (
          <div className="missions-dir-grid">
            {filtered.map((mission) => (
              <MissionCell key={mission._id} mission={mission} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function EmptyState({ filter, hasMissions }: { filter: FilterMode; hasMissions: boolean }) {
  const content =
    !hasMissions
      ? { icon: null, title: "No missions yet", body: "Your mentors haven't published any missions for this track." }
      : filter === "pending"
        ? { icon: <CheckCircle aria-hidden style={{ width: 32, height: 32, color: "#22C55E" }} />, title: "You're all caught up", body: "Nothing left to hand in right now." }
        : { icon: <Circle aria-hidden style={{ width: 32, height: 32, color: "#737373" }} />, title: "Nothing done yet", body: "Missions you finish show up here." };
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "64px 24px", textAlign: "center" }}>
      {content.icon}
      <p style={{ fontFamily: font.body, fontSize: 16, fontWeight: 500, color: "#FFFFFF", margin: 0, marginTop: content.icon ? 12 : 0 }}>
        {content.title}
      </p>
      <p style={{ fontFamily: font.body, fontSize: 14, color: "#737373", margin: 0, marginTop: 6 }}>{content.body}</p>
    </div>
  );
}

const cellMeta: React.CSSProperties = {
  fontFamily: font.mono,
  fontSize: 10,
  lineHeight: "12px",
  fontWeight: 600,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "var(--color-text-tertiary)",
  fontVariantNumeric: "tabular-nums",
};

function MissionCell({ mission }: { mission: MissionRow }) {
  const cardBg = mission.status === "not_started" ? "#0E0E0E" : "#111111";
  const overdue = isOverdue(mission.dueAt, mission.satisfied, mission.status);
  const showDue = mission.dueAt !== null && !mission.satisfied && mission.status !== "submitted" && mission.status !== "in_review";
  const TypeIcon = mission.reviewType === "reviewed" ? GraduationCap : CheckSquare;

  return (
    <Link href={`/missions/${mission.slug}`} style={{ textDecoration: "none", display: "block", height: "100%" }}>
      <div
        style={{
          backgroundColor: cardBg,
          padding: 20,
          display: "flex",
          flexDirection: "column",
          height: "100%",
          minHeight: 160,
          transitionProperty: "background-color",
          transitionDuration: "var(--duration-fast)",
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
        <div className="missions-cell-top" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <TypeIcon
              aria-label={mission.reviewType === "reviewed" ? "Reviewed by a mentor" : "Done on submit"}
              style={{ width: 12, height: 12, color: "var(--color-text-tertiary)", flexShrink: 0 }}
            />
            <span style={cellMeta}>Mission {mission.number}</span>
          </span>
          {overdue ? (
            <span
              style={{
                ...cellMeta,
                color: "#F87171",
                backgroundColor: "rgba(239,68,68,0.10)",
                border: "1px solid rgba(239,68,68,0.20)",
                padding: "3px 8px",
                borderRadius: 999,
              }}
            >
              Overdue
            </span>
          ) : showDue && mission.dueAt !== null ? (
            <span style={{ ...cellMeta, fontSize: 11, fontWeight: 500, letterSpacing: 0 }}>Due {shortDate(mission.dueAt)}</span>
          ) : null}
        </div>

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
        <p
          style={{
            ...cellMeta,
            fontSize: 11,
            lineHeight: "14px",
            fontWeight: 500,
            letterSpacing: 0,
            margin: 0,
            marginTop: 6,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {mission.module.title}
        </p>

        <div style={{ flex: 1 }} />

        <div
          style={{
            marginTop: 16,
            borderTop: "1px solid var(--color-border-subtle)",
            paddingTop: 12,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <MissionStatusIndicator status={mission.status} reviewType={mission.reviewType} />
            {mission.isLate && mission.status !== "not_started" && (
              <span style={{ ...cellMeta, color: "#FBBF24" }}>Late</span>
            )}
          </span>
          <ChevronRight aria-hidden style={{ width: 14, height: 14, color: "var(--color-text-tertiary)", flexShrink: 0 }} />
        </div>
      </div>
    </Link>
  );
}

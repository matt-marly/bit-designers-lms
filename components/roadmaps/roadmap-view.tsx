"use client";

import { Check, ChevronRight } from "lucide-react";
import { StatusPill } from "@/components/ui/custom/status-pill";
import { ProgressBar, ProgressPill, font, monoLabelStyle } from "@/components/learn/ui";

export type RoadmapNode = {
  _id: string;
  kind: string;
  title: string;
  description: string | null;
  url: string | null;
  lane: string;
  sortOrder: number;
  badge: "required" | "optional" | "alternative";
  progress: "complete" | "in_progress" | "not_started" | null;
  state: "learning" | "done" | "skipped";
  href: string | null;
  meta: string | null;
};

export type RoadmapLane = { name: string; nodes: RoadmapNode[] };

function BadgePill({ badge }: { badge: RoadmapNode["badge"] }) {
  if (badge === "optional") return <StatusPill label="Optional" variant="neutral" />;
  if (badge === "alternative") return <StatusPill label="Alternative" variant="indigo" />;
  return null;
}

function NodeCard({ node, index, onSelect }: { node: RoadmapNode; index: number; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={`${node.title} details`}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        width: "100%",
        padding: "16px 20px",
        backgroundColor: "var(--color-bg-surface)",
        border: "1px solid var(--color-border-subtle)",
        borderRadius: 14,
        transitionProperty: "background-color, border-color",
        transitionDuration: "120ms",
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      <span style={{ display: "flex", gap: 14, minWidth: 0 }}>
        <span
          aria-hidden
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 28,
            height: 28,
            borderRadius: 999,
            flexShrink: 0,
            marginTop: 2,
            border: "1px solid",
            borderColor: node.progress === "complete" ? "rgba(34,197,94,0.40)" : "var(--color-border-strong)",
            backgroundColor: node.progress === "complete" ? "rgba(34,197,94,0.12)" : "transparent",
            color: node.progress === "complete" ? "#22C55E" : "var(--color-text-tertiary)",
            fontFamily: font.mono,
            fontSize: 11,
          }}
        >
          {node.progress === "complete" ? <Check style={{ width: 14, height: 14 }} /> : <span>{String(index + 1).padStart(2, "0")}</span>}
        </span>
        <span style={{ minWidth: 0 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span
              style={{
                fontFamily: font.display,
                fontSize: 15,
                lineHeight: "21px",
                fontWeight: 600,
                color: "var(--color-text-primary)",
              }}
            >
              {node.title}
            </span>
            <BadgePill badge={node.badge} />
          </span>
          {node.meta && (
            <span style={{ display: "block", fontFamily: font.mono, fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 4 }}>
              {node.meta}{node.kind === "custom" ? "" : ` · ${node.kind}`}
            </span>
          )}
        </span>
      </span>
      <span style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        {node.progress ? <ProgressPill progress={node.progress} /> : null}
        <ChevronRight style={{ width: 16, height: 16, color: "var(--color-text-tertiary)" }} aria-hidden />
      </span>
    </button>
  );
}

export function RoadmapView({
  title,
  description,
  trackName,
  totals,
  lanes,
  onSelectNode,
}: {
  title: string;
  description: string | null;
  trackName: string | null;
  totals: { nodes: number; completedNodes: number };
  lanes: RoadmapLane[];
  onSelectNode: (nodeId: string) => void;
}) {
  const laneOffsets = lanes.reduce<number[]>((offsets, lane, i) => {
    const prev = i === 0 ? 0 : (offsets[i - 1] ?? 0) + lanes[i - 1].nodes.length;
    return [...offsets, prev];
  }, []);
  const numberedLanes = lanes.map((lane, laneIndex) =>
    lane.nodes.map((node, i) => ({ node, index: (laneOffsets[laneIndex] ?? 0) + i })),
  );
  return (
    <div style={{ maxWidth: 880, margin: "0 auto" }}>
      <header style={{ marginBottom: 32 }}>
        {trackName && (
          <span style={{ ...monoLabelStyle, display: "block", marginBottom: 8 }}>{trackName}</span>
        )}
        <h1 style={{ fontFamily: font.display, fontSize: 28, lineHeight: "34px", fontWeight: 600, color: "#FFFFFF", margin: 0 }}>
          {title}
        </h1>
        {description && (
          <p style={{ fontFamily: font.body, fontSize: 14, lineHeight: "22px", color: "var(--color-text-secondary)", margin: "8px 0 0" }}>
            {description}
          </p>
        )}
        {totals.nodes > 0 && (
          <>
            <div style={{ marginTop: 24, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ ...monoLabelStyle, fontWeight: 500, fontSize: 12, letterSpacing: 0 }}>
                {totals.completedNodes} of {totals.nodes} steps complete
              </span>
              <span style={{ fontFamily: font.mono, fontSize: 12, color: "var(--color-text-tertiary)" }}>
                {Math.round((totals.completedNodes / totals.nodes) * 100)}%
              </span>
            </div>
            <ProgressBar value={totals.completedNodes / totals.nodes} label="Roadmap progress" />
          </>
        )}
      </header>

      <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
        {numberedLanes.map((nodes, laneIndex) => {
          const lane = lanes[laneIndex];
          return (
          <section key={lane.name}>
            <h2 style={{ margin: "0 0 12px" }}>
              <span style={monoLabelStyle}>{lane.name}</span>
            </h2>
            <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              {nodes.map(({ node, index }) => (
                <li key={node._id}>
                  <NodeCard node={node} index={index} onSelect={() => onSelectNode(node._id)} />
                </li>
              ))}
            </ol>
          </section>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Minus, Plus, RotateCcw } from "lucide-react";
import { ProgressBar, font, monoLabelStyle } from "@/components/learn/ui";
import { layoutRoadmapGraph, type GraphPoint } from "./graph-layout";
import type { RoadmapLane, RoadmapNode } from "./roadmap-view";

function edgePath(points: GraphPoint[], r = 16): string {
  if (points.length === 0) return "";
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  }
  const sub = (a: GraphPoint, b: GraphPoint) => ({ x: a.x - b.x, y: a.y - b.y });
  const norm = (v: { x: number; y: number }) => {
    const len = Math.hypot(v.x, v.y) || 1;
    return { x: v.x / len, y: v.y / len };
  };
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const corner = points[i];
    const vIn = norm(sub(corner, points[i - 1]));
    const vOut = norm(sub(points[i + 1], corner));
    const a = { x: corner.x - vIn.x * r, y: corner.y - vIn.y * r };
    const b = { x: corner.x + vOut.x * r, y: corner.y + vOut.y * r };
    d += ` L ${a.x} ${a.y} Q ${corner.x} ${corner.y} ${b.x} ${b.y}`;
  }
  const last = points[points.length - 1];
  d += ` L ${last.x} ${last.y}`;
  return d;
}

export function RoadmapGraph({
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState({ x: 0, y: 8, k: 1 });
  const [containerWidth, setContainerWidth] = useState(0);
  const panRef = useRef<{ startX: number; startY: number; baseX: number; baseY: number; moved: boolean } | null>(null);
  const suppressClickRef = useRef(false);

  const layout = useMemo(
    () =>
      layoutRoadmapGraph(
        lanes.map((lane) => ({
          name: lane.name,
          nodes: lane.nodes.map((n) => ({ id: n._id, kind: n.kind, badge: n.badge })),
        })),
      ),
    [lanes],
  );

  const byId = useMemo(() => {
    const map = new Map<string, RoadmapNode>();
    for (const lane of lanes) for (const node of lane.nodes) map.set(node._id, node);
    return map;
  }, [lanes]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      setContainerWidth(w);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const fit = useMemo(() => {
    if (containerWidth <= 0) return null;
    const k = Math.min(1, containerWidth / layout.width);
    return { k, x: Math.max(0, (containerWidth - layout.width * k) / 2), y: 8 };
  }, [containerWidth, layout]);

  const didFitRef = useRef(false);
  useEffect(() => {
    if (fit && !didFitRef.current) {
      didFitRef.current = true;
      setView({ x: fit.x, y: fit.y, k: fit.k });
    }
  }, [fit]);

  function zoom(factor: number) {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    setView((v) => {
      const k = Math.min(2, Math.max(0.3, v.k * factor));
      const s = k / v.k;
      return { k, x: cx - (cx - v.x) * s, y: cy - (cy - v.y) * s };
    });
  }

  function reset() {
    if (!fit) return;
    setView({ x: fit.x, y: fit.y, k: fit.k });
  }

  const percent = totals.nodes === 0 ? 0 : Math.round((totals.completedNodes / totals.nodes) * 100);

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <header style={{ marginBottom: 20, maxWidth: 880 }}>
        {trackName && <span style={{ ...monoLabelStyle, display: "block", marginBottom: 8 }}>{trackName}</span>}
        <h1 style={{ fontFamily: font.display, fontSize: 28, lineHeight: "34px", fontWeight: 600, color: "#FFFFFF", margin: 0 }}>
          {title}
        </h1>
        {description && (
          <p style={{ fontFamily: font.body, fontSize: 14, lineHeight: "22px", color: "var(--color-text-secondary)", margin: "8px 0 0" }}>
            {description}
          </p>
        )}
        {totals.nodes > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{ marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ ...monoLabelStyle, fontWeight: 500, fontSize: 12, letterSpacing: 0 }}>
                {totals.completedNodes} of {totals.nodes} steps complete
              </span>
              <span style={{ fontFamily: font.mono, fontSize: 12, color: "var(--color-text-tertiary)" }}>{percent}%</span>
            </div>
            <ProgressBar value={totals.completedNodes / totals.nodes} label="Roadmap progress" />
          </div>
        )}
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 16 }}>
          <LegendSwatch color="var(--color-bg-surface-2)" label="Key topics to learn" border />
          <LegendSwatch color="rgba(99,102,241,0.10)" label="Checkpoints and missions" border />
          <LegendSwatch dotted label="Optional or alternative path" />
        </div>
      </header>

      <div style={{ position: "relative" }}>
        <div
          ref={containerRef}
          role="application"
          aria-label={`${title} roadmap graph. Drag to pan.`}
          onPointerDown={(e) => {
            (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
            panRef.current = { startX: e.clientX, startY: e.clientY, baseX: view.x, baseY: view.y, moved: false };
          }}
          onPointerMove={(e) => {
            const pan = panRef.current;
            if (!pan) return;
            const dx = e.clientX - pan.startX;
            const dy = e.clientY - pan.startY;
            if (Math.abs(dx) + Math.abs(dy) > 4) pan.moved = true;
            if (pan.moved) setView((v) => ({ ...v, x: pan.baseX + dx, y: pan.baseY + dy }));
          }}
          onPointerUp={() => {
            if (panRef.current?.moved) suppressClickRef.current = true;
            panRef.current = null;
          }}
          onClickCapture={(e) => {
            // A drag that ends on a node shouldn't follow its link.
            if (suppressClickRef.current) {
              suppressClickRef.current = false;
              e.preventDefault();
              e.stopPropagation();
            }
          }}
          style={{
            height: "68vh",
            minHeight: 480,
            overflow: "hidden",
            cursor: "grab",
            backgroundColor: "#0C0C0C",
            border: "1px solid var(--color-border-subtle)",
            borderRadius: 16,
            touchAction: "none",
            userSelect: "none",
          }}
        >
          <div
            style={{
              width: layout.width,
              height: layout.height,
              transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})`,
              transformOrigin: "0 0",
              position: "relative",
            }}
          >
            <svg
              width={layout.width}
              height={layout.height}
              viewBox={`0 0 ${layout.width} ${layout.height}`}
              aria-hidden="true"
              style={{ position: "absolute", inset: 0 }}
            >
              {layout.edges.map((edge) => (
                <path
                  key={edge.id}
                  d={edgePath(edge.points)}
                  fill="none"
                  stroke="var(--color-indigo)"
                  strokeOpacity={edge.dotted ? 0.55 : 0.9}
                  strokeWidth={edge.dotted ? 2 : 3}
                  strokeDasharray={edge.dotted ? "2 6" : undefined}
                  strokeLinecap="round"
                />
              ))}
            </svg>

            {layout.labels.map((label) => (
              <span
                key={label.text}
                aria-hidden="true"
                style={{
                  position: "absolute",
                  left: label.x,
                  top: label.y,
                  ...monoLabelStyle,
                  fontSize: 13,
                }}
              >
                {label.text}
              </span>
            ))}

            {layout.nodes.map((placed) => {
              const node = byId.get(placed.id);
              if (!node) return null;
              return <GraphNodeBox key={placed.id} placed={placed} node={node} onSelect={() => onSelectNode(node._id)} />;
            })}
          </div>
        </div>

        <div style={{ position: "absolute", right: 12, bottom: 12, display: "flex", gap: 8 }}>
          <GraphControl label="Zoom in" onClick={() => zoom(1.25)}>
            <Plus style={{ width: 16, height: 16 }} />
          </GraphControl>
          <GraphControl label="Zoom out" onClick={() => zoom(1 / 1.25)}>
            <Minus style={{ width: 16, height: 16 }} />
          </GraphControl>
          <GraphControl label="Reset view" onClick={reset}>
            <RotateCcw style={{ width: 16, height: 16 }} />
          </GraphControl>
        </div>
      </div>
    </div>
  );
}

function GraphNodeBox({
  placed,
  node,
  onSelect,
}: {
  placed: { x: number; y: number; w: number; h: number; role: "topic" | "checkpoint"; dotted: boolean };
  node: RoadmapNode;
  onSelect: () => void;
}) {
  const complete = node.progress === "complete";
  const inProgress = node.progress === "in_progress";
  const isCheckpoint = placed.role === "checkpoint";

  const style: React.CSSProperties = isCheckpoint
    ? {
        backgroundColor: "rgba(99,102,241,0.10)",
        border: `1px solid ${complete ? "rgba(34,197,94,0.55)" : "rgba(99,102,241,0.45)"}`,
        borderStyle: placed.dotted ? "dashed" : "solid",
        borderRadius: 10,
        color: "var(--color-text-primary)",
      }
    : {
        backgroundColor: complete ? "rgba(34,197,94,0.10)" : "var(--color-bg-surface-2)",
        border: `1px solid ${
          complete
            ? "rgba(34,197,94,0.45)"
            : inProgress
              ? "var(--color-indigo)"
              : "var(--color-border-strong)"
        }`,
        borderStyle: placed.dotted ? "dashed" : "solid",
        borderRadius: 10,
        color: "var(--color-text-primary)",
        opacity: placed.dotted ? 0.85 : 1,
      };

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={`${node.title} details`}
      style={{
        ...style,
        position: "absolute",
        left: placed.x,
        top: placed.y,
        width: placed.w,
        height: placed.h,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        padding: "0 12px",
        fontFamily: font.body,
        fontSize: isCheckpoint ? 14 : 13,
        fontWeight: 600,
        lineHeight: "18px",
        textAlign: "center",
        overflow: "hidden",
        cursor: "pointer",
        transitionProperty: "transform, box-shadow",
        transitionDuration: "120ms",
      }}
      title={node.title}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "none";
      }}
    >
      {isCheckpoint && (
        <span
          style={{
            fontFamily: font.mono,
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            opacity: 0.6,
            whiteSpace: "nowrap",
          }}
        >
          Checkpoint
        </span>
      )}
      {complete && <Check style={{ width: 14, height: 14, flexShrink: 0, color: "#22C55E" }} aria-label="Complete" />}
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{node.title}</span>
    </button>
  );
}

function LegendSwatch({ color, label, border, dotted }: { color?: string; label: string; border?: boolean; dotted?: boolean }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      {dotted ? (
        <span
          aria-hidden
          style={{ width: 20, height: 0, borderTop: "2px dotted var(--color-indigo)" }}
        />
      ) : (
        <span
          aria-hidden
          style={{
            width: 16,
            height: 16,
            borderRadius: 4,
            backgroundColor: color,
            border: border ? "1px solid var(--color-border-strong)" : "1px solid #09090B",
          }}
        />
      )}
      <span style={{ fontFamily: font.body, fontSize: 12, color: "var(--color-text-secondary)" }}>{label}</span>
    </span>
  );
}

function GraphControl({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--color-bg-surface-2)",
        border: "1px solid var(--color-border-strong)",
        color: "var(--color-text-secondary)",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

/**
 * Serpentine auto-layout for roadmap node graphs (roadmap.sh style).
 *
 * Pure function of lane + node order: lanes become rows, row direction
 * alternates (left→right, right→left), missions become full-width
 * checkpoint rows, and consecutive nodes are joined by edges. No stored
 * x/y — positions are derived every render.
 */

export type GraphNodeInput = {
  id: string;
  kind: string;
  badge: "required" | "optional" | "alternative";
};

export type GraphLaneInput = {
  name: string;
  nodes: GraphNodeInput[];
};

export type GraphNodeRole = "topic" | "checkpoint";

export type GraphPoint = { x: number; y: number };

export type PlacedNode = {
  id: string;
  lane: string;
  role: GraphNodeRole;
  dotted: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type GraphEdge = {
  id: string;
  fromId: string;
  toId: string;
  dotted: boolean;
  points: GraphPoint[];
};

export type GraphLaneLabel = { text: string; x: number; y: number };

export type GraphLayout = {
  width: number;
  height: number;
  nodes: PlacedNode[];
  edges: GraphEdge[];
  labels: GraphLaneLabel[];
};

export const GRAPH_WIDTH = 1200;
const PAD_X = 48;
const PAD_TOP = 16;
const PAD_BOTTOM = 24;
const TOPIC_W = 176;
const TOPIC_H = 50;
const CHECKPOINT_H = 58;
const GAP_X = 28;
const ROW_GAP = 60;
const LABEL_H = 30;

export const TOPICS_PER_ROW = Math.max(
  1,
  Math.floor((GRAPH_WIDTH - PAD_X * 2 + GAP_X) / (TOPIC_W + GAP_X)),
);

export function nodeRole(kind: string): GraphNodeRole {
  return kind === "mission" ? "checkpoint" : "topic";
}

type RowItem = { input: GraphNodeInput; role: GraphNodeRole };
type Row = { lane: string; firstOfLane: boolean; items: RowItem[]; checkpoint: boolean };

function buildRows(lanes: GraphLaneInput[]): Row[] {
  const rows: Row[] = [];
  for (const lane of lanes) {
    if (lane.nodes.length === 0) continue;
    let current: RowItem[] = [];
    let first = true;
    const flush = () => {
      if (current.length > 0) {
        rows.push({ lane: lane.name, firstOfLane: first, items: current, checkpoint: false });
        first = false;
        current = [];
      }
    };
    for (const node of lane.nodes) {
      const role = nodeRole(node.kind);
      if (role === "checkpoint") {
        flush();
        rows.push({ lane: lane.name, firstOfLane: first, items: [{ input: node, role }], checkpoint: true });
        first = false;
      } else {
        current.push({ input: node, role });
        if (current.length >= TOPICS_PER_ROW) flush();
      }
    }
    flush();
  }
  return rows;
}

export function layoutRoadmapGraph(lanes: GraphLaneInput[]): GraphLayout {
  const rows = buildRows(lanes);
  const nodes: PlacedNode[] = [];
  const labels: GraphLaneLabel[] = [];
  // Travel order of placed nodes (serpentine), used for edges.
  const sequence: PlacedNode[] = [];

  let y = PAD_TOP;
  rows.forEach((row, rowIndex) => {
    if (row.firstOfLane) {
      labels.push({ text: row.lane, x: PAD_X, y });
      y += LABEL_H;
    }
    const leftToRight = rowIndex % 2 === 0;
    let rowHeight: number;
    if (row.checkpoint) {
      const item = row.items[0];
      const w = GRAPH_WIDTH - PAD_X * 2;
      const placed: PlacedNode = {
        id: item.input.id,
        lane: row.lane,
        role: "checkpoint",
        dotted: item.input.badge !== "required",
        x: PAD_X,
        y,
        w,
        h: CHECKPOINT_H,
      };
      nodes.push(placed);
      sequence.push(placed);
      rowHeight = CHECKPOINT_H;
    } else {
      const n = row.items.length;
      const totalW = n * TOPIC_W + (n - 1) * GAP_X;
      const startX = leftToRight ? PAD_X : GRAPH_WIDTH - PAD_X - totalW;
      // Place in travel order so `sequence` matches visual flow.
      const travelItems = leftToRight ? row.items : [...row.items].reverse();
      travelItems.forEach((item, travelIndex) => {
        const visualIndex = leftToRight ? travelIndex : n - 1 - travelIndex;
        const placed: PlacedNode = {
          id: item.input.id,
          lane: row.lane,
          role: "topic",
          dotted: item.input.badge !== "required",
          x: startX + visualIndex * (TOPIC_W + GAP_X),
          y,
          w: TOPIC_W,
          h: TOPIC_H,
        };
        nodes.push(placed);
        sequence.push(placed);
      });
      rowHeight = TOPIC_H;
    }
    y += rowHeight + ROW_GAP;
  });

  const edges: GraphEdge[] = [];
  for (let i = 0; i + 1 < sequence.length; i++) {
    const a = sequence[i];
    const b = sequence[i + 1];
    const sameRow = Math.abs(a.y - b.y) < 1;
    let points: GraphPoint[];
    if (sameRow) {
      const aExitRight = a.x + a.w <= b.x + 1;
      const exit: GraphPoint = aExitRight
        ? { x: a.x + a.w, y: a.y + a.h / 2 }
        : { x: a.x, y: a.y + a.h / 2 };
      const entry: GraphPoint = aExitRight
        ? { x: b.x, y: b.y + b.h / 2 }
        : { x: b.x + b.w, y: b.y + b.h / 2 };
      points = [exit, entry];
    } else {
      const exit: GraphPoint = { x: a.x + a.w / 2, y: a.y + a.h };
      const entry: GraphPoint = { x: b.x + b.w / 2, y: b.y };
      const midY = (exit.y + entry.y) / 2;
      points = [exit, { x: exit.x, y: midY }, { x: entry.x, y: midY }, entry];
    }
    edges.push({ id: `e:${a.id}->${b.id}`, fromId: a.id, toId: b.id, dotted: b.dotted, points });
  }

  return {
    width: GRAPH_WIDTH,
    height: rows.length === 0 ? 1 : y - ROW_GAP + PAD_BOTTOM,
    nodes,
    edges,
    labels,
  };
}

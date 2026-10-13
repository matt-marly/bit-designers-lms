import { describe, expect, test } from "vitest";
import {
  layoutRoadmapGraph,
  nodeRole,
  TOPICS_PER_ROW,
  type GraphLaneInput,
} from "../components/roadmaps/graph-layout";

function lane(name: string, kinds: string[]): GraphLaneInput {
  return {
    name,
    nodes: kinds.map((kind, i) => ({ id: `${name}-${i}`, kind, badge: "required" as const })),
  };
}

describe("nodeRole", () => {
  test("missions are checkpoints, everything else is a topic", () => {
    expect(nodeRole("mission")).toBe("checkpoint");
    expect(nodeRole("module")).toBe("topic");
    expect(nodeRole("lesson")).toBe("topic");
    expect(nodeRole("custom")).toBe("topic");
  });
});

describe("layoutRoadmapGraph", () => {
  test("empty lanes produce an empty layout", () => {
    const layout = layoutRoadmapGraph([]);
    expect(layout.nodes).toEqual([]);
    expect(layout.edges).toEqual([]);
    expect(layout.labels).toEqual([]);
  });

  test("a single row flows left to right with straight edges", () => {
    const layout = layoutRoadmapGraph([lane("Start", ["module", "module", "lesson"])]);
    expect(layout.nodes).toHaveLength(3);
    const xs = layout.nodes.map((n) => n.x);
    expect(xs).toEqual([...xs].sort((a, b) => a - b));
    expect(layout.edges).toHaveLength(2);
    for (const edge of layout.edges) {
      expect(edge.points).toHaveLength(2);
      expect(edge.dotted).toBe(false);
    }
    expect(layout.labels.map((l) => l.text)).toEqual(["Start"]);
  });

  test("row direction alternates and row changes use elbow connectors", () => {
    const kinds = Array.from({ length: TOPICS_PER_ROW + 2 }, () => "module");
    const layout = layoutRoadmapGraph([lane("Long", kinds)]);
    // First row full, second row holds the remaining two — flowing right to left.
    expect(layout.nodes).toHaveLength(kinds.length);
    const rowYs = [...new Set(layout.nodes.map((n) => n.y))].sort((a, b) => a - b);
    expect(rowYs).toHaveLength(2);
    const secondRow = layout.nodes.filter((n) => n.y === rowYs[1]);
    const secondRowXs = secondRow.map((n) => n.x);
    // Travel order on the second row goes right → left.
    expect(secondRowXs[0]).toBeGreaterThan(secondRowXs[secondRowXs.length - 1]);
    const elbows = layout.edges.filter((e) => e.points.length === 4);
    expect(elbows.length).toBeGreaterThanOrEqual(1);
  });

  test("missions get their own full-width checkpoint row", () => {
    const layout = layoutRoadmapGraph([lane("Path", ["module", "mission", "module"])]);
    const checkpoint = layout.nodes.find((n) => n.role === "checkpoint");
    expect(checkpoint).toBeDefined();
    expect(checkpoint?.w).toBeGreaterThan(1000);
    const rowYs = [...new Set(layout.nodes.map((n) => n.y))].sort((a, b) => a - b);
    expect(rowYs).toHaveLength(3);
  });

  test("optional nodes produce dotted edges", () => {
    const layout = layoutRoadmapGraph([
      {
        name: "L",
        nodes: [
          { id: "a", kind: "module", badge: "required" },
          { id: "b", kind: "custom", badge: "optional" },
          { id: "c", kind: "module", badge: "alternative" },
        ],
      },
    ]);
    expect(layout.edges.map((e) => e.dotted)).toEqual([true, true]);
    expect(layout.nodes.find((n) => n.id === "b")?.dotted).toBe(true);
  });

  test("lanes after the first keep their labels and empty lanes are skipped", () => {
    const layout = layoutRoadmapGraph([
      lane("One", ["module"]),
      { name: "Empty", nodes: [] },
      lane("Two", ["module"]),
    ]);
    expect(layout.labels.map((l) => l.text)).toEqual(["One", "Two"]);
  });

  test("all nodes stay inside the canvas", () => {
    const layout = layoutRoadmapGraph([
      lane("A", ["module", "module", "mission", "lesson", "custom", "module", "mission"]),
      lane("B", ["module", "lesson", "lesson"]),
    ]);
    for (const node of layout.nodes) {
      expect(node.x).toBeGreaterThanOrEqual(0);
      expect(node.x + node.w).toBeLessThanOrEqual(layout.width);
      expect(node.y).toBeGreaterThanOrEqual(0);
      expect(node.y + node.h).toBeLessThanOrEqual(layout.height);
    }
    expect(layout.edges).toHaveLength(layout.nodes.length - 1);
  });
});

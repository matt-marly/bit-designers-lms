"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "@/convex/_generated/api";
import { LoadingLine, PageMessage, ProgressBar, font, monoLabelStyle } from "@/components/learn/ui";

type RoadmapList = FunctionReturnType<typeof api.roadmaps.list>;
type RoadmapItem = RoadmapList[number];

export default function RoadmapsPage() {
  const roadmaps = useQuery(api.roadmaps.list);

  if (roadmaps === undefined) return <LoadingLine>Loading roadmaps…</LoadingLine>;

  const trackRoadmaps = roadmaps.filter((r) => r.trackId !== null);
  const guides = roadmaps.filter((r) => r.trackId === null);

  if (roadmaps.length === 0) {
    return (
      <PageMessage
        title="No roadmaps yet"
        body="Your mentors are still preparing guided paths. Check back soon."
      />
    );
  }

  return (
    <div style={{ maxWidth: 880, margin: "0 auto" }}>
      <header style={{ marginBottom: 32 }}>
        <span style={{ ...monoLabelStyle, display: "block", marginBottom: 8 }}>Guided paths</span>
        <h1 style={{ fontFamily: font.display, fontSize: 28, lineHeight: "34px", fontWeight: 600, color: "#FFFFFF", margin: 0 }}>
          Roadmaps
        </h1>
        <p style={{ fontFamily: font.body, fontSize: 14, lineHeight: "22px", color: "var(--color-text-secondary)", margin: "8px 0 0" }}>
          Step-by-step paths through each track, plus standalone guides. Progress follows your lessons and missions.
        </p>
      </header>

      {trackRoadmaps.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ ...monoLabelStyle, margin: "0 0 12px" }}>Tracks</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {trackRoadmaps.map((roadmap) => (
              <RoadmapCard key={roadmap._id} roadmap={roadmap} />
            ))}
          </div>
        </section>
      )}

      {guides.length > 0 && (
        <section>
          <h2 style={{ ...monoLabelStyle, margin: "0 0 12px" }}>Guides</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {guides.map((roadmap) => (
              <RoadmapCard key={roadmap._id} roadmap={roadmap} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function RoadmapCard({ roadmap }: { roadmap: RoadmapItem }) {
  const percent = roadmap.nodeCount === 0 ? 0 : Math.round((roadmap.completedNodes / roadmap.nodeCount) * 100);
  return (
    <Link
      href={`/roadmaps/${roadmap.slug}`}
      style={{
        display: "block",
        padding: "20px 24px",
        backgroundColor: "var(--color-bg-surface)",
        border: "1px solid var(--color-border-subtle)",
        borderRadius: 14,
        textDecoration: "none",
      }}
    >
      <span style={{ ...monoLabelStyle, display: "block", marginBottom: 4 }}>
        {roadmap.trackName ?? "Guide"}
        {roadmap.status === "draft" ? " · Draft" : ""}
      </span>
      <span style={{ display: "block", fontFamily: font.display, fontSize: 16, fontWeight: 600, color: "var(--color-text-primary)" }}>
        {roadmap.title}
      </span>
      {roadmap.description && (
        <span style={{ display: "block", fontFamily: font.body, fontSize: 13, lineHeight: "20px", color: "var(--color-text-secondary)", marginTop: 4 }}>
          {roadmap.description}
        </span>
      )}
      <span style={{ display: "block", marginTop: 12 }}>
        <ProgressBar value={roadmap.nodeCount === 0 ? 0 : roadmap.completedNodes / roadmap.nodeCount} label={`${roadmap.title} progress`} />
      </span>
      <span style={{ display: "block", fontFamily: font.mono, fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 8 }}>
        {roadmap.completedNodes} of {roadmap.nodeCount} steps · {percent}%
      </span>
    </Link>
  );
}

"use client";

import { Suspense, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { LoadingLine, PageMessage, font } from "@/components/learn/ui";
import { RoadmapView } from "@/components/roadmaps/roadmap-view";
import { RoadmapGraph } from "@/components/roadmaps/roadmap-graph";
import { NodeDrawer } from "@/components/roadmaps/node-drawer";

type Mode = "graph" | "list";

export default function RoadmapDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  return (
    <Suspense fallback={<LoadingLine>Loading roadmap…</LoadingLine>}>
      <Detail slug={slug} />
    </Suspense>
  );
}

function Detail({ slug }: { slug: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roadmap = useQuery(api.roadmaps.getBySlug, { slug });
  const selectedNodeId = searchParams.get("node");

  function selectNode(nodeId: string | null) {
    const next = new URLSearchParams(searchParams.toString());
    if (nodeId) next.set("node", nodeId);
    else next.delete("node");
    const query = next.toString();
    router.replace(`/roadmaps/${slug}${query ? `?${query}` : ""}`, { scroll: false });
  }

  if (roadmap === undefined) return <LoadingLine>Loading roadmap…</LoadingLine>;
  if (roadmap === null) {
    return <PageMessage title="Roadmap not found" body="This path doesn't exist or isn't published yet." />;
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <ModeToggle slug={slug} />
      </div>

      {searchParams.get("view") === "list" ? (
        <RoadmapView
          title={roadmap.title}
          description={roadmap.description}
          trackName={roadmap.trackName}
          totals={roadmap.totals}
          lanes={roadmap.lanes}
          onSelectNode={(nodeId) => selectNode(nodeId)}
        />
      ) : (
        <RoadmapGraph
          title={roadmap.title}
          description={roadmap.description}
          trackName={roadmap.trackName}
          totals={roadmap.totals}
          lanes={roadmap.lanes}
          onSelectNode={(nodeId) => selectNode(nodeId)}
        />
      )}

      <NodeDrawer slug={slug} nodeId={selectedNodeId} onClose={() => selectNode(null)} />
    </div>
  );
}

function ModeToggle({ slug }: { slug: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobileDefaultList =
    typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches;
  const view = searchParams.get("view") ?? (isMobileDefaultList ? "list" : "graph");

  function setView(mode: Mode) {
    const next = new URLSearchParams(searchParams.toString());
    if (mode === "graph") next.delete("view");
    else next.set("view", "list");
    const query = next.toString();
    router.replace(`/roadmaps/${slug}${query ? `?${query}` : ""}`, { scroll: false });
  }

  return (
    <div
      role="group"
      aria-label="Roadmap view"
      style={{
        display: "inline-flex",
        border: "1px solid var(--color-border-strong)",
        borderRadius: 999,
        padding: 2,
        backgroundColor: "var(--color-bg-surface)",
      }}
    >
      {(["graph", "list"] as Mode[]).map((m) => {
        const selected = view === m;
        return (
          <button
            key={m}
            type="button"
            aria-pressed={selected}
            onClick={() => setView(m)}
            style={{
              border: "none",
              borderRadius: 999,
              padding: "6px 14px",
              fontFamily: font.body,
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              backgroundColor: selected ? "rgba(99,102,241,0.16)" : "transparent",
              color: selected ? "#A5B4FC" : "var(--color-text-secondary)",
              textTransform: "capitalize",
            }}
          >
            {m === "graph" ? "Graph" : "List"}
          </button>
        );
      })}
    </div>
  );
}

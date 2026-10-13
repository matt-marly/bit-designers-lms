"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Toast, cardStyle, errorMessage, font, useToast } from "@/components/admin/ui";

export default function RoadmapsAdminPage() {
  const roadmaps = useQuery(api.roadmapEditor.listEditable);
  const tracks = useQuery(api.curriculumEditor.listEditableTracks);
  const createRoadmap = useMutation(api.roadmapEditor.createRoadmap);
  const setStatus = useMutation(api.roadmapEditor.setStatus);
  const generateFromTrack = useMutation(api.roadmapEditor.generateFromTrack);
  const syncFromTrack = useMutation(api.roadmapEditor.syncFromTrack);
  const { toast, showToast } = useToast();
  const [title, setTitle] = useState("");
  const [trackId, setTrackId] = useState<string>("");
  const [busy, setBusy] = useState(false);

  async function handleCreate() {
    if (!title.trim()) {
      showToast("Enter a roadmap title", "error");
      return;
    }
    setBusy(true);
    try {
      const args: { title: string; trackId?: Id<"tracks"> } = { title: title.trim() };
      if (trackId) args.trackId = trackId as Id<"tracks">;
      const created = await createRoadmap(args);
      if (created && args.trackId) {
        await generateFromTrack({ roadmapId: created.roadmapId });
      }
      setTitle("");
      showToast("Roadmap created");
    } catch (err) {
      showToast(errorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: font.display, fontSize: 36, lineHeight: "42px", fontWeight: 600, letterSpacing: "-0.02em", color: "var(--color-text-primary)", margin: 0 }}>
          Roadmaps
        </h1>
        <p style={{ fontFamily: font.body, fontSize: 14, lineHeight: "22px", color: "var(--color-text-secondary)", margin: "6px 0 0" }}>
          Guided paths generated from a track&apos;s outline, plus standalone guides. Track roadmaps need a track you can edit; guides need platform content access.
        </p>
      </div>

      <div style={{ ...cardStyle, padding: 20, marginBottom: 16 }}>
        <p style={{ fontFamily: font.body, fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)", margin: "0 0 12px" }}>
          New roadmap
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Roadmap title, e.g. Design Lab path"
            aria-label="Roadmap title"
            style={{ flex: "1 1 240px", height: 38, padding: "0 12px", borderRadius: 10, border: "1px solid var(--color-border-strong)", backgroundColor: "transparent", color: "var(--color-text-primary)", fontFamily: font.body, fontSize: 14 }}
          />
          <select
            value={trackId}
            onChange={(e) => setTrackId(e.target.value)}
            aria-label="Track"
            style={{ height: 38, padding: "0 12px", borderRadius: 10, border: "1px solid var(--color-border-strong)", backgroundColor: "var(--color-bg-surface-2)", color: "var(--color-text-primary)", fontFamily: font.body, fontSize: 14 }}
          >
            <option value="">Standalone guide</option>
            {(tracks ?? []).map((t) => (
              <option key={t._id} value={t._id}>{t.name}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleCreate}
            disabled={busy}
            style={{ height: 38, padding: "0 16px", borderRadius: 10, border: "none", backgroundColor: "#6366F1", color: "#fff", fontFamily: font.body, fontSize: 14, fontWeight: 600, cursor: busy ? "wait" : "pointer", opacity: busy ? 0.7 : 1 }}
          >
            {busy ? "Creating…" : "Create"}
          </button>
        </div>
      </div>

      {roadmaps === undefined ? (
        <p style={{ fontFamily: font.body, fontSize: 14, color: "var(--color-text-tertiary)" }}>Loading…</p>
      ) : roadmaps.length === 0 ? (
        <div style={{ ...cardStyle, padding: 32, textAlign: "center" }}>
          <p style={{ fontFamily: font.body, fontSize: 14, color: "var(--color-text-secondary)", margin: 0 }}>
            No roadmaps you can edit yet.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {roadmaps.map((roadmap) => (
            <div key={roadmap._id} style={{ ...cardStyle, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontFamily: font.body, fontSize: 11, color: "var(--color-text-tertiary)", margin: 0, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  {roadmap.trackName ?? "Guide"} · {roadmap.nodeCount} steps · {roadmap.status}
                </p>
                <Link href={`/admin/roadmaps/${roadmap._id}`} style={{ fontFamily: font.display, fontSize: 16, fontWeight: 600, color: "var(--color-text-primary)", textDecoration: "none" }}>
                  {roadmap.title}
                </Link>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {roadmap.trackId && (
                  <>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const r = await generateFromTrack({ roadmapId: roadmap._id });
                          showToast(`Added ${r.nodes} steps`);
                        } catch (err) {
                          showToast(errorMessage(err), "error");
                        }
                      }}
                      style={ghostButton}
                    >
                      Generate
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const r = await syncFromTrack({ roadmapId: roadmap._id });
                          showToast(`Sync: +${r.added} / −${r.removed}`);
                        } catch (err) {
                          showToast(errorMessage(err), "error");
                        }
                      }}
                      style={ghostButton}
                    >
                      Sync
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await setStatus({ roadmapId: roadmap._id, status: roadmap.status === "published" ? "draft" : "published" });
                      showToast(roadmap.status === "published" ? "Unpublished" : "Published");
                    } catch (err) {
                      showToast(errorMessage(err), "error");
                    }
                  }}
                  style={ghostButton}
                >
                  {roadmap.status === "published" ? "Unpublish" : "Publish"}
                </button>
                <Link href={`/roadmaps/${roadmap.slug}`} style={{ ...ghostButton, textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
                  Preview
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <Toast toast={toast} />
    </div>
  );
}

const ghostButton: React.CSSProperties = {
  height: 34,
  padding: "0 14px",
  borderRadius: 999,
  border: "1px solid var(--color-border-strong)",
  backgroundColor: "transparent",
  color: "var(--color-text-secondary)",
  fontFamily: font.body,
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
};

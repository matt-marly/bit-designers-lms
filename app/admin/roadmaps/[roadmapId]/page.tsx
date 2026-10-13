"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { ConfirmStrip, Toast, cardStyle, errorMessage, font, useToast } from "@/components/admin/ui";

type Badge = "required" | "optional" | "alternative";

export default function RoadmapEditorPage({ params }: { params: Promise<{ roadmapId: string }> }) {
  const { roadmapId } = use(params);
  return <Editor roadmapId={roadmapId as Id<"roadmaps">} />;
}

function Editor({ roadmapId }: { roadmapId: Id<"roadmaps"> }) {
  const roadmaps = useQuery(api.roadmapEditor.listEditable);
  const roadmap = roadmaps?.find((r) => r._id === roadmapId) ?? null;
  const detail = useQuery(api.roadmaps.getBySlug, roadmap ? { slug: roadmap.slug } : "skip");
  const updateNode = useMutation(api.roadmapEditor.updateNode);
  const moveNode = useMutation(api.roadmapEditor.moveNode);
  const removeNode = useMutation(api.roadmapEditor.removeNode);
  const addCustomNode = useMutation(api.roadmapEditor.addCustomNode);
  const setStatus = useMutation(api.roadmapEditor.setStatus);
  const deleteRoadmap = useMutation(api.roadmapEditor.deleteRoadmap);
  const { toast, showToast } = useToast();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [form, setForm] = useState({ title: "", lane: "", url: "", badge: "required" as Badge });
  const [busy, setBusy] = useState(false);

  if (roadmaps === undefined || detail === undefined) {
    return <p style={{ fontFamily: font.body, fontSize: 14, color: "var(--color-text-tertiary)" }}>Loading…</p>;
  }
  if (!roadmap || !detail) {
    return <p style={{ fontFamily: font.body, fontSize: 14, color: "var(--color-text-secondary)" }}>Roadmap not found.</p>;
  }

  async function handleAdd() {
    if (!form.title.trim()) {
      showToast("Enter a step title", "error");
      return;
    }
    setBusy(true);
    try {
      await addCustomNode({
        roadmapId,
        title: form.title.trim(),
        lane: form.lane.trim() || undefined,
        url: form.url.trim() || undefined,
        badge: form.badge,
      });
      setForm({ title: "", lane: "", url: "", badge: "required" });
      showToast("Step added");
    } catch (err) {
      showToast(errorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <Link href="/admin/roadmaps" style={{ fontFamily: font.body, fontSize: 13, color: "#A5B4FC", textDecoration: "none" }}>
        ← All roadmaps
      </Link>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, margin: "12px 0 20px", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontFamily: font.display, fontSize: 28, fontWeight: 600, color: "var(--color-text-primary)", margin: 0 }}>
            {roadmap.title}
          </h1>
          <p style={{ fontFamily: font.body, fontSize: 13, color: "var(--color-text-secondary)", margin: "4px 0 0" }}>
            {roadmap.trackName ?? "Standalone guide"} · {detail.totals.nodes} steps · {roadmap.status}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={async () => {
              try {
                await setStatus({ roadmapId, status: roadmap.status === "published" ? "draft" : "published" });
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

      <div style={{ ...cardStyle, padding: 20, marginBottom: 16 }}>
        <p style={{ fontFamily: font.body, fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)", margin: "0 0 12px" }}>
          Add custom step
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Title, e.g. Read the Bitcoin whitepaper"
            aria-label="Step title"
            style={inputStyle}
          />
          <input
            value={form.lane}
            onChange={(e) => setForm((f) => ({ ...f, lane: e.target.value }))}
            placeholder="Lane, e.g. Foundations"
            aria-label="Lane"
            style={{ ...inputStyle, flex: "0 1 180px" }}
          />
          <input
            value={form.url}
            onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
            placeholder="Link (https://…)"
            aria-label="Link"
            style={{ ...inputStyle, flex: "1 1 220px" }}
          />
          <select
            value={form.badge}
            onChange={(e) => setForm((f) => ({ ...f, badge: e.target.value as Badge }))}
            aria-label="Badge"
            style={{ ...inputStyle, flex: "0 1 150px" }}
          >
            <option value="required">Required</option>
            <option value="optional">Optional</option>
            <option value="alternative">Alternative</option>
          </select>
          <button type="button" onClick={handleAdd} disabled={busy} style={primaryButton(busy)}>
            {busy ? "Adding…" : "Add step"}
          </button>
        </div>
      </div>

      {detail.lanes.length === 0 ? (
        <div style={{ ...cardStyle, padding: 32, textAlign: "center" }}>
          <p style={{ fontFamily: font.body, fontSize: 14, color: "var(--color-text-secondary)", margin: 0 }}>
            No steps yet. Generate from the track on the roadmaps page, or add a custom step above.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {detail.lanes.map((lane) => (
            <section key={lane.name} style={{ ...cardStyle, padding: 16 }}>
              <h2 style={{ fontFamily: font.mono, fontSize: 11, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--color-text-tertiary)", margin: "0 0 12px" }}>
                {lane.name}
              </h2>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                {lane.nodes.map((node, i) => (
                  <li key={node._id} style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontFamily: font.mono, fontSize: 11, color: "var(--color-text-tertiary)", width: 28 }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span style={{ flex: "1 1 200px", fontFamily: font.body, fontSize: 14, color: "var(--color-text-primary)" }}>
                      {node.title}
                      <span style={{ color: "var(--color-text-tertiary)", fontSize: 12 }}> · {node.kind} · {node.badge}</span>
                    </span>
                    <select
                      value={node.badge}
                      onChange={async (e) => {
                        try {
                          await updateNode({ nodeId: node._id as Id<"roadmapNodes">, badge: e.target.value as Badge });
                        } catch (err) {
                          showToast(errorMessage(err), "error");
                        }
                      }}
                      aria-label={`Badge for ${node.title}`}
                      style={{ ...inputStyle, flex: "0 1 140px", height: 32 }}
                    >
                      <option value="required">Required</option>
                      <option value="optional">Optional</option>
                      <option value="alternative">Alternative</option>
                    </select>
                    <button
                      type="button"
                      aria-label={`Move ${node.title} up`}
                      onClick={() => moveNode({ nodeId: node._id as Id<"roadmapNodes">, direction: "up" }).catch((err) => showToast(errorMessage(err), "error"))}
                      style={ghostButton}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      aria-label={`Move ${node.title} down`}
                      onClick={() => moveNode({ nodeId: node._id as Id<"roadmapNodes">, direction: "down" }).catch((err) => showToast(errorMessage(err), "error"))}
                      style={ghostButton}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => removeNode({ nodeId: node._id as Id<"roadmapNodes"> }).catch((err) => showToast(errorMessage(err), "error"))}
                      style={dangerButton}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <div style={{ marginTop: 24 }}>
        {confirmDelete ? (
          <ConfirmStrip
            message="Delete this roadmap and all its steps?"
            confirmLabel="Delete"
            danger
            busy={false}
            onConfirm={() => {
              deleteRoadmap({ roadmapId }).then(
                () => {
                  window.location.href = "/admin/roadmaps";
                },
                (err: unknown) => {
                  showToast(errorMessage(err), "error");
                },
              );
            }}
            onCancel={() => setConfirmDelete(false)}
          />
        ) : (
          <button type="button" onClick={() => setConfirmDelete(true)} style={dangerButton}>
            Delete roadmap
          </button>
        )}
      </div>

      <Toast toast={toast} />
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  flex: "1 1 200px",
  height: 38,
  padding: "0 12px",
  borderRadius: 10,
  border: "1px solid var(--color-border-strong)",
  backgroundColor: "transparent",
  color: "var(--color-text-primary)",
  fontFamily: font.body,
  fontSize: 14,
};

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

const dangerButton: React.CSSProperties = {
  ...ghostButton,
  borderColor: "rgba(239,68,68,0.40)",
  color: "#FCA5A5",
};

function primaryButton(busy: boolean): React.CSSProperties {
  return {
    height: 38,
    padding: "0 16px",
    borderRadius: 10,
    border: "none",
    backgroundColor: "#6366F1",
    color: "#fff",
    fontFamily: font.body,
    fontSize: 14,
    fontWeight: 600,
    cursor: busy ? "wait" : "pointer",
    opacity: busy ? 0.7 : 1,
  };
}

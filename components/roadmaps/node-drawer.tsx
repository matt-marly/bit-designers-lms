"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, BookOpen, Check, Sparkles, X } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { font } from "@/components/learn/ui";
import {
  Sheet,
  SheetContent,
  SheetOverlay,
  SheetTitle,
} from "@/components/ui/sheet";

type NodeState = "learning" | "done" | "skipped";

export function NodeDrawer({
  slug,
  nodeId,
  onClose,
}: {
  slug: string;
  nodeId: string | null;
  onClose: () => void;
}) {
  return (
    <Sheet
      open={nodeId !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetOverlay style={{ backgroundColor: "rgba(0,0,0,0.6)" }} />
      <SheetContent
        side="right"
        aria-label="Roadmap step details"
        className="w-full sm:max-w-2xl"
        style={{
          backgroundColor: "var(--color-bg-surface)",
          color: "var(--color-text-primary)",
          borderLeft: "1px solid var(--color-border-subtle)",
          padding: 0,
          gap: 0,
          overflowY: "auto",
        }}
      >
        {nodeId && <DrawerBody slug={slug} nodeId={nodeId as Id<"roadmapNodes">} onClose={onClose} />}
      </SheetContent>
    </Sheet>
  );
}

function DrawerBody({ slug, nodeId, onClose }: { slug: string; nodeId: Id<"roadmapNodes">; onClose: () => void }) {
  const detail = useQuery(api.roadmapProgress.getNodeDetail, { roadmapSlug: slug, nodeId });
  const setState = useMutation(api.roadmapProgress.setNodeState);
  const [saving, setSaving] = useState(false);

  async function handleState(state: NodeState) {
    setSaving(true);
    try {
      await setState({ nodeId, state });
    } finally {
      setSaving(false);
    }
  }

  if (detail === undefined) {
    return <p style={{ padding: 32, fontFamily: font.body, fontSize: 14, color: "var(--color-text-tertiary)" }}>Loading…</p>;
  }
  if (detail === null) {
    return (
      <div style={{ padding: 32 }}>
        <p style={{ fontFamily: font.body, fontSize: 14, color: "var(--color-text-secondary)", margin: "0 0 16px" }}>
          This step isn&apos;t available.
        </p>
        <button type="button" onClick={onClose} style={ghostButton}>
          Close
        </button>
      </div>
    );
  }

  const { node, detail: target, related } = detail;
  const state: NodeState = node.state;

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%" }}>
      {/* Header: tabs + state control + close */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "16px 20px", flexWrap: "wrap" }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            backgroundColor: "rgba(99,102,241,0.16)",
            color: "#A5B4FC",
            borderRadius: 8,
            padding: "8px 14px",
            fontFamily: font.body,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          Resources
        </span>
        <span
          title="AI Tutor is coming soon"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            border: "1px solid var(--color-border-strong)",
            color: "var(--color-text-tertiary)",
            borderRadius: 8,
            padding: "8px 14px",
            fontFamily: font.body,
            fontSize: 13,
            fontWeight: 500,
            cursor: "not-allowed",
          }}
        >
          <Sparkles style={{ width: 14, height: 14 }} /> AI Tutor
        </span>
        <span style={{ flex: 1 }} />
        <div
          role="group"
          aria-label="Your progress on this step"
          style={{ display: "inline-flex", border: "1px solid var(--color-border-strong)", borderRadius: 8, overflow: "hidden" }}
        >
          <StateButton active={state === "learning"} disabled={saving} onClick={() => handleState("learning")} icon={<BookOpen style={{ width: 13, height: 13 }} />} label="Learning" />
          <StateButton active={state === "done"} disabled={saving} onClick={() => handleState("done")} icon={<Check style={{ width: 13, height: 13 }} />} label="Done" />
          <StateButton active={state === "skipped"} disabled={saving} onClick={() => handleState("skipped")} icon={<X style={{ width: 13, height: 13 }} />} label="Skip" />
        </div>
        <button type="button" onClick={onClose} aria-label="Close details" style={iconButton}>
          <X style={{ width: 16, height: 16 }} />
        </button>
      </div>

      <div style={{ padding: "8px 28px 24px", flex: 1 }}>
        <SheetTitle
          style={{
            fontFamily: font.display,
            fontSize: 36,
            lineHeight: "42px",
            fontWeight: 700,
            color: "var(--color-text-primary)",
            margin: "0 0 12px",
          }}
        >
          {node.title}
        </SheetTitle>
        {(node.description ?? target?.description) && (
          <p style={{ fontFamily: font.body, fontSize: 15, lineHeight: "26px", color: "var(--color-text-secondary)", margin: "0 0 24px" }}>
            {node.description ?? target?.description}
          </p>
        )}

        {/* Recommended: the linked curriculum item */}
        {target?.href && (
          <section
            aria-label="Recommended"
            style={{ border: "1px solid rgba(99,102,241,0.35)", borderRadius: 12, padding: 20, marginBottom: 16, backgroundColor: "rgba(99,102,241,0.06)" }}
          >
            <p style={{ fontFamily: font.body, fontSize: 13, fontWeight: 600, color: "#A5B4FC", margin: "0 0 12px" }}>
              ★ Recommended · {targetLabel(target.kind)}
            </p>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
              <div>
                <p style={{ fontFamily: font.body, fontSize: 16, fontWeight: 700, color: "var(--color-text-primary)", margin: "0 0 4px" }}>
                  {target.title}
                </p>
                {target.meta && (
                  <p style={{ fontFamily: font.body, fontSize: 13, color: "var(--color-text-tertiary)", margin: 0 }}>{target.meta}</p>
                )}
              </div>
              {target.href.startsWith("http") ? (
                <a href={target.href} target="_blank" rel="noreferrer" style={startButton}>
                  Start <ArrowUpRight style={{ width: 14, height: 14 }} />
                </a>
              ) : (
                <Link href={target.href} style={startButton}>
                  Start <ArrowUpRight style={{ width: 14, height: 14 }} />
                </Link>
              )}
            </div>
            {target.lessons.length > 0 && (
              <ul style={{ listStyle: "none", margin: "16px 0 0", padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                {target.lessons.map((lesson) => (
                  <li key={lesson.href}>
                    <Link
                      href={lesson.href}
                      style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: font.body, fontSize: 14, color: "var(--color-text-secondary)", textDecoration: "none" }}
                    >
                      <span
                        aria-hidden
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 999,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: lesson.completed ? "#16A34A" : "var(--color-bg-surface-3)",
                          border: lesson.completed ? "none" : "1px solid var(--color-border-strong)",
                          color: "#fff",
                          flexShrink: 0,
                        }}
                      >
                        {lesson.completed && <Check style={{ width: 11, height: 11 }} />}
                      </span>
                      {lesson.title}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {target.rubric.length > 0 && (
              <ul style={{ margin: "16px 0 0", padding: "0 0 0 20px", display: "flex", flexDirection: "column", gap: 6 }}>
                {target.rubric.map((criterion) => (
                  <li key={criterion} style={{ fontFamily: font.body, fontSize: 14, color: "var(--color-text-secondary)" }}>
                    {criterion}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {/* Free resources */}
        {related.length > 0 && (
          <section
            aria-label="Free resources"
            style={{ border: "1px solid var(--color-border-subtle)", borderRadius: 12, padding: 20, marginBottom: 16 }}
          >
            <p style={{ fontFamily: font.body, fontSize: 14, fontWeight: 700, color: "#4ADE80", margin: "0 0 12px" }}>
              ♥ Free Resources
            </p>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              {related.map((r) => (
                <li key={`${r.kind}-${r.title}`} style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <span
                    style={{
                      fontFamily: font.body,
                      fontSize: 11,
                      fontWeight: 600,
                      backgroundColor: "rgba(99,102,241,0.12)",
                      border: "1px solid rgba(99,102,241,0.35)",
                      color: "#A5B4FC",
                      borderRadius: 6,
                      padding: "3px 8px",
                    }}
                  >
                    {r.kind === "resource" ? "Link" : r.kind}
                  </span>
                  {r.href && r.href.startsWith("http") ? (
                    <a href={r.href} target="_blank" rel="noreferrer" style={resourceLink}>
                      {r.title}
                    </a>
                  ) : r.href ? (
                    <Link href={r.href} style={resourceLink}>
                      {r.title}
                    </Link>
                  ) : (
                    <span style={{ fontFamily: font.body, fontSize: 14, color: "var(--color-text-primary)" }}>{r.title}</span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {/* Bottom ask bar (disabled until the AI Tutor lands) */}
      <div style={{ padding: 16, borderTop: "1px solid var(--color-border-subtle)", position: "sticky", bottom: 0, backgroundColor: "var(--color-bg-surface)" }}>
        <div
          title="AI Tutor is coming soon"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            border: "1px solid var(--color-border-strong)",
            borderRadius: 12,
            padding: "12px 12px 12px 16px",
            color: "var(--color-text-tertiary)",
            fontFamily: font.body,
            fontSize: 14,
            cursor: "not-allowed",
          }}
        >
          <Sparkles style={{ width: 15, height: 15, flexShrink: 0 }} />
          <span style={{ flex: 1 }}>Ask anything about {node.title}…</span>
          <span
            aria-hidden
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: "#6366F1",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 700,
            }}
          >
            ↑
          </span>
        </div>
      </div>
    </div>
  );
}

function targetLabel(kind: string): string {
  if (kind === "module") return "Official module by mentors";
  if (kind === "lesson") return "Official lesson by mentors";
  if (kind === "mission") return "Mission brief";
  if (kind === "workshop") return "Live session";
  if (kind === "resource") return "Curated resource";
  return "Mentor-curated link";
}

function StateButton({
  active,
  disabled,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  disabled: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        border: "none",
        borderLeft: "1px solid var(--color-border-strong)",
        backgroundColor: active ? "rgba(99,102,241,0.16)" : "transparent",
        color: active ? "#A5B4FC" : "var(--color-text-tertiary)",
        padding: "8px 10px",
        fontFamily: font.body,
        fontSize: 12,
        fontWeight: 500,
        cursor: disabled ? "wait" : "pointer",
      }}
    >
      {icon} {label}
    </button>
  );
}

const iconButton: React.CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 8,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "var(--color-bg-surface-2)",
  border: "1px solid var(--color-border-strong)",
  color: "var(--color-text-secondary)",
  cursor: "pointer",
  flexShrink: 0,
};

const ghostButton: React.CSSProperties = {
  border: "1px solid var(--color-border-strong)",
  backgroundColor: "transparent",
  color: "var(--color-text-secondary)",
  borderRadius: 8,
  padding: "8px 16px",
  fontFamily: font.body,
  fontSize: 14,
  cursor: "pointer",
};

const startButton: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  backgroundColor: "#6366F1",
  color: "#fff",
  borderRadius: 8,
  padding: "8px 14px",
  fontFamily: font.body,
  fontSize: 13,
  fontWeight: 700,
  textDecoration: "none",
  whiteSpace: "nowrap",
  flexShrink: 0,
};

const resourceLink: React.CSSProperties = {
  fontFamily: font.body,
  fontSize: 14,
  fontWeight: 500,
  color: "var(--color-text-primary)",
  textDecoration: "underline",
  textUnderlineOffset: 3,
};

"use client";

import Link from "next/link";
import { StatusPill } from "@/components/ui/custom/status-pill";

export const font = {
  display: "var(--font-display), 'Space Grotesk', 'Inter', system-ui, sans-serif",
  body: "var(--font-body), 'Inter', system-ui, -apple-system, sans-serif",
  mono: "var(--font-mono), 'JetBrains Mono', 'SF Mono', monospace",
};

export const monoLabelStyle: React.CSSProperties = {
  fontFamily: font.mono,
  fontSize: 11,
  lineHeight: "14px",
  fontWeight: 600,
  letterSpacing: "0.10em",
  textTransform: "uppercase",
  color: "var(--color-text-tertiary)",
};

export type Progress = "complete" | "in_progress" | "not_started";

export function ProgressPill({ progress }: { progress: Progress }) {
  if (progress === "complete") return <StatusPill label="Complete" variant="success" />;
  if (progress === "in_progress") return <StatusPill label="In progress" variant="indigo" />;
  return <StatusPill label="Not started" variant="neutral" />;
}

export function ProgressBar({ value, height = 4, label }: { value: number; height?: number; label: string }) {
  const percent = Math.max(0, Math.min(100, Math.round(value * 100)));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      style={{ height, width: "100%", borderRadius: 999, backgroundColor: "#1C1C1C", overflow: "hidden" }}
    >
      <div
        style={{
          width: `${percent}%`,
          height,
          backgroundColor: "var(--color-indigo)",
          borderRadius: 999,
          transition: "width 600ms cubic-bezier(0.25, 1, 0.5, 1)",
        }}
      />
    </div>
  );
}

export function PageMessage({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: { href: string; label: string };
}) {
  return (
    <div
      style={{
        maxWidth: 560,
        margin: "48px auto",
        padding: 32,
        textAlign: "center",
        backgroundColor: "var(--color-bg-surface)",
        border: "1px solid var(--color-border-subtle)",
        borderRadius: 14,
      }}
    >
      <p style={{ fontFamily: font.display, fontSize: 18, fontWeight: 600, color: "var(--color-text-primary)", margin: 0 }}>
        {title}
      </p>
      {body && (
        <p style={{ fontFamily: font.body, fontSize: 14, lineHeight: "22px", color: "var(--color-text-secondary)", margin: "8px 0 0" }}>
          {body}
        </p>
      )}
      {action && (
        <Link
          href={action.href}
          style={{ display: "inline-block", marginTop: 16, fontFamily: font.body, fontSize: 14, fontWeight: 500, color: "#A5B4FC" }}
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}

export function TrackChips<T extends { trackId: string; name: string }>({
  tracks,
  selectedId,
  onSelect,
}: {
  tracks: T[];
  selectedId: string;
  onSelect: (trackId: T["trackId"]) => void;
}) {
  if (tracks.length < 2) return null;
  return (
    <div role="group" aria-label="Track" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
      {tracks.map((t) => {
        const selected = t.trackId === selectedId;
        return (
          <button
            key={t.trackId}
            type="button"
            aria-pressed={selected}
            onClick={() => onSelect(t.trackId)}
            style={{
              height: 32,
              padding: "0 14px",
              borderRadius: 999,
              border: `1px solid ${selected ? "rgba(99,102,241,0.55)" : "var(--color-border-strong)"}`,
              backgroundColor: selected ? "rgba(99,102,241,0.12)" : "transparent",
              color: selected ? "#A5B4FC" : "var(--color-text-secondary)",
              fontFamily: font.body,
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            {t.name}
          </button>
        );
      })}
    </div>
  );
}

export function LoadingLine({ children }: { children: string }) {
  return (
    <p role="status" style={{ fontFamily: font.body, fontSize: 14, color: "var(--color-text-tertiary)", margin: 0 }}>
      {children}
    </p>
  );
}

export function DraftNotice() {
  return (
    <div
      role="note"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 14px",
        borderRadius: 10,
        border: "1px solid rgba(245,158,11,0.30)",
        backgroundColor: "rgba(245,158,11,0.08)",
        fontFamily: font.body,
        fontSize: 13,
        color: "#FBBF24",
      }}
    >
      This module is a draft. Only curriculum editors can see it.
    </div>
  );
}

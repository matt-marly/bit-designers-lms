"use client";

import { useCallback, useEffect, useState } from "react";
import { ConvexError } from "convex/values";

export const font = {
  display: "var(--font-display), 'Space Grotesk', 'Inter', system-ui, sans-serif",
  body: "var(--font-body), 'Inter', system-ui, -apple-system, sans-serif",
  mono: "var(--font-mono), 'JetBrains Mono', 'SF Mono', monospace",
};

export const cardStyle: React.CSSProperties = {
  backgroundColor: "var(--color-bg-surface)",
  border: "1px solid var(--color-border-subtle)",
  borderRadius: 14,
};

export const fieldLabelStyle: React.CSSProperties = {
  fontFamily: font.mono,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.10em",
  textTransform: "uppercase",
  color: "var(--color-text-secondary)",
  display: "block",
  marginBottom: 8,
};

export const controlStyle: React.CSSProperties = {
  height: 40,
  width: "100%",
  backgroundColor: "var(--color-bg-surface-2)",
  border: "1px solid var(--color-border-strong)",
  borderRadius: 10,
  padding: "0 14px",
  fontFamily: font.body,
  fontSize: 14,
  color: "var(--color-text-primary)",
  outline: "none",
  boxSizing: "border-box",
  colorScheme: "dark",
};

export const smallButtonStyle: React.CSSProperties = {
  height: 30,
  padding: "0 12px",
  borderRadius: 10,
  backgroundColor: "transparent",
  color: "var(--color-text-primary)",
  border: "1px solid var(--color-border-strong)",
  fontFamily: font.body,
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

export const ghostButtonStyle: React.CSSProperties = {
  ...smallButtonStyle,
  border: "1px solid transparent",
  color: "var(--color-text-tertiary)",
};

export const dangerButtonStyle: React.CSSProperties = {
  ...smallButtonStyle,
  borderColor: "rgba(239,68,68,0.55)",
  backgroundColor: "rgba(239,68,68,0.10)",
  color: "#F87171",
};

export const focusHandlers = {
  onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = "rgba(99,102,241,0.70)";
    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.15)";
  },
  onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = "var(--color-border-strong)";
    e.currentTarget.style.boxShadow = "none";
  },
};

export function errorMessage(err: unknown) {
  return err instanceof ConvexError ? String(err.data) : "Something went wrong. Please try again.";
}

export type ToastData = { message: string; type: "success" | "error" };
export type ShowToast = (message: string, type?: ToastData["type"]) => void;

export function useToast() {
  const [toast, setToast] = useState<ToastData | null>(null);
  const showToast = useCallback<ShowToast>((message, type = "success") => {
    setToast({ message, type });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), toast.type === "error" ? 5000 : 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  return { toast, showToast };
}

export function Toast({ toast }: { toast: ToastData | null }) {
  return (
    <>
      <style>{`
        @keyframes admin-toast-enter {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          [data-admin-toast] { animation: none !important; }
        }
      `}</style>
      {toast && (
        <div
          data-admin-toast
          role={toast.type === "error" ? "alert" : "status"}
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 50,
            background: "#1C1C1C",
            border: "1px solid var(--color-border-strong)",
            borderRadius: 10,
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            minWidth: 280,
            maxWidth: 360,
            boxShadow: "0 16px 40px rgba(0,0,0,0.55)",
            animation: "admin-toast-enter 240ms cubic-bezier(0.25, 1, 0.5, 1)",
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              backgroundColor: toast.type === "error" ? "#EF4444" : "#22C55E",
              flexShrink: 0,
            }}
          />
          <span style={{ fontFamily: font.body, fontSize: 14, color: "var(--color-text-primary)" }}>
            {toast.message}
          </span>
        </div>
      )}
    </>
  );
}

export type BadgeTone = "indigo" | "success" | "warning" | "neutral";

const badgeTones: Record<BadgeTone, { color: string; background: string; border: string }> = {
  indigo: { color: "#A5B4FC", background: "rgba(99,102,241,0.12)", border: "rgba(99,102,241,0.35)" },
  success: { color: "#4ADE80", background: "rgba(34,197,94,0.10)", border: "rgba(34,197,94,0.30)" },
  warning: { color: "#FBBF24", background: "rgba(245,158,11,0.10)", border: "rgba(245,158,11,0.30)" },
  neutral: { color: "var(--color-text-tertiary)", background: "transparent", border: "var(--color-border-strong)" },
};

export function StatusBadge({ tone, children }: { tone: BadgeTone; children: React.ReactNode }) {
  const t = badgeTones[tone];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        height: 20,
        padding: "0 8px",
        borderRadius: 999,
        backgroundColor: t.background,
        border: `1px solid ${t.border}`,
        color: t.color,
        fontFamily: font.mono,
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.10em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      {children}
    </span>
  );
}

export function Avatar({ name, size = 32, src }: { name: string; size?: number; src?: string | null }) {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <div
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        flexShrink: 0,
        overflow: "hidden",
        backgroundColor: "var(--color-bg-surface-3)",
        border: "1px solid var(--color-border-subtle)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: font.mono,
        fontSize: size >= 48 ? Math.round(size / 3.2) : size >= 32 ? 11 : 10,
        fontWeight: 500,
        color: "var(--color-text-secondary)",
      }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      ) : (
        letters || "?"
      )}
    </div>
  );
}

export function SectionHeader({
  title,
  meta,
  action,
}: {
  title: string;
  meta?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        marginBottom: 12,
        flexWrap: "wrap",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        <h2
          style={{
            fontFamily: font.display,
            fontSize: 18,
            lineHeight: "24px",
            fontWeight: 600,
            color: "var(--color-text-primary)",
            margin: 0,
          }}
        >
          {title}
        </h2>
        {meta && (
          <span style={{ fontFamily: font.mono, fontSize: 12, color: "var(--color-text-tertiary)" }}>{meta}</span>
        )}
      </div>
      {action}
    </div>
  );
}

export function ConfirmStrip({
  message,
  confirmLabel,
  danger,
  busy,
  onConfirm,
  onCancel,
  style,
}: {
  message: string;
  confirmLabel: string;
  danger?: boolean;
  busy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        padding: "4px 20px 16px",
        backgroundColor: "#141414",
        display: "flex",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap",
        ...style,
      }}
    >
      <p style={{ fontFamily: font.body, fontSize: 13, color: "var(--color-text-secondary)", margin: 0, flex: "1 1 320px" }}>
        {message}
      </p>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          style={{
            ...(danger
              ? dangerButtonStyle
              : { ...smallButtonStyle, borderColor: "rgba(99,102,241,0.55)", backgroundColor: "rgba(99,102,241,0.12)", color: "#A5B4FC" }),
            opacity: busy ? 0.5 : 1,
            cursor: busy ? "not-allowed" : "pointer",
          }}
        >
          {busy ? "Working…" : confirmLabel}
        </button>
        <button type="button" onClick={onCancel} disabled={busy} style={ghostButtonStyle}>
          Cancel
        </button>
      </div>
    </div>
  );
}

/** Formats a timestamp as YYYY-MM-DD in local time, for `<input type="date">`. */
export function toDateInput(ms: number | undefined) {
  if (ms === undefined) return "";
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromDateInput(value: string): number | undefined {
  if (!value) return undefined;
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d).getTime();
}

export function formatDate(ms: number) {
  return new Date(ms).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

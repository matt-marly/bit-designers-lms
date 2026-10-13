"use client";

import { useEffect, useState } from "react";
import type { FunctionReturnType } from "convex/server";
import { api } from "@/convex/_generated/api";
import { Markdown } from "@/components/markdown";
import { cardStyle, controlStyle, fieldLabelStyle, focusHandlers, font, ghostButtonStyle, smallButtonStyle } from "../ui";

export type CurriculumOutline = FunctionReturnType<typeof api.curriculumEditor.outline>;
export type OutlineUnit = CurriculumOutline[number];
export type OutlineModule = OutlineUnit["modules"][number];

export const primarySmallButtonStyle: React.CSSProperties = {
  ...smallButtonStyle,
  height: 34,
  border: "none",
  backgroundColor: "var(--color-indigo)",
};

export function padNumber(n: number) {
  return String(n).padStart(2, "0");
}

export function IconButton({
  label,
  icon: Icon,
  onClick,
  disabled,
  tone = "neutral",
}: {
  label: string;
  icon: React.ElementType;
  onClick: () => void;
  disabled?: boolean;
  tone?: "neutral" | "danger";
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 30,
        height: 30,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 8,
        border: "1px solid transparent",
        backgroundColor: "transparent",
        color: tone === "danger" ? "#F87171" : "var(--color-text-tertiary)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.3 : 1,
        flexShrink: 0,
        transitionProperty: "background-color, color",
        transitionDuration: "var(--duration-fast)",
      }}
      onMouseEnter={(e) => {
        if (disabled) return;
        e.currentTarget.style.backgroundColor = "var(--color-bg-surface-3)";
        if (tone === "neutral") e.currentTarget.style.color = "var(--color-text-primary)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "transparent";
        if (tone === "neutral") e.currentTarget.style.color = "var(--color-text-tertiary)";
      }}
    >
      <Icon size={15} aria-hidden />
    </button>
  );
}

/** A one-field form for adding or renaming something. */
export function InlineTitleForm({
  id,
  label,
  placeholder,
  initial = "",
  submitLabel,
  busyLabel,
  onSubmit,
  onCancel,
}: {
  id: string;
  label: string;
  placeholder?: string;
  initial?: string;
  submitLabel: string;
  busyLabel: string;
  onSubmit: (title: string) => Promise<boolean>;
  onCancel?: () => void;
}) {
  const [title, setTitle] = useState(initial);
  const [saving, setSaving] = useState(false);
  const unchanged = title.trim() === initial.trim();
  const disabled = !title.trim() || saving || (initial !== "" && unchanged);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (disabled) return;
    setSaving(true);
    const ok = await onSubmit(title);
    setSaving(false);
    if (ok && initial === "") setTitle("");
  }

  return (
    <form onSubmit={submit} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        id={id}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape" && onCancel) onCancel();
        }}
        placeholder={placeholder}
        maxLength={120}
        autoFocus={initial !== ""}
        style={{ ...controlStyle, height: 34, flex: "1 1 240px", width: "auto", fontSize: 13 }}
        {...focusHandlers}
      />
      <button
        type="submit"
        disabled={disabled}
        style={{
          ...primarySmallButtonStyle,
          opacity: disabled ? 0.4 : 1,
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        {saving ? busyLabel : submitLabel}
      </button>
      {onCancel && (
        <button type="button" onClick={onCancel} style={ghostButtonStyle}>
          Cancel
        </button>
      )}
    </form>
  );
}

export const textareaStyle: React.CSSProperties = {
  ...controlStyle,
  height: "auto",
  padding: "10px 14px",
  resize: "vertical",
  lineHeight: "22px",
};

/** A Markdown textarea with Write / Preview tabs and a character count. */
export function MarkdownField({
  id,
  label,
  value,
  onChange,
  limit,
  placeholder,
  minHeight = 420,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  limit: number;
  placeholder?: string;
  minHeight?: number;
}) {
  const [tab, setTab] = useState<"write" | "preview">("write");
  const overLimit = value.length > limit;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
        <span id={`${id}-label`} style={{ ...fieldLabelStyle, marginBottom: 0 }}>
          {label}
        </span>
        <div
          role="tablist"
          aria-labelledby={`${id}-label`}
          style={{ display: "inline-flex", border: "1px solid var(--color-border-strong)", borderRadius: 10, overflow: "hidden" }}
        >
          {(["write", "preview"] as const).map((option, i) => {
            const selected = tab === option;
            return (
              <button
                key={option}
                type="button"
                role="tab"
                id={`${id}-tab-${option}`}
                aria-selected={selected}
                aria-controls={`${id}-panel-${option}`}
                onClick={() => setTab(option)}
                style={{
                  height: 30,
                  padding: "0 14px",
                  border: "none",
                  borderRight: i === 0 ? "1px solid var(--color-border-strong)" : "none",
                  backgroundColor: selected ? "rgba(99,102,241,0.12)" : "transparent",
                  color: selected ? "#A5B4FC" : "var(--color-text-tertiary)",
                  fontFamily: font.body,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                {option === "write" ? "Write" : "Preview"}
              </button>
            );
          })}
        </div>
      </div>

      {tab === "write" ? (
        <div role="tabpanel" id={`${id}-panel-write`} aria-labelledby={`${id}-tab-write`}>
          <textarea
            aria-labelledby={`${id}-label`}
            aria-describedby={`${id}-hint`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={Math.round(minHeight / 20)}
            spellCheck
            placeholder={placeholder}
            style={{ ...textareaStyle, minHeight, fontFamily: font.mono, fontSize: 13, lineHeight: "22px", tabSize: 2 }}
            {...focusHandlers}
          />
        </div>
      ) : (
        <div
          role="tabpanel"
          id={`${id}-panel-preview`}
          aria-labelledby={`${id}-tab-preview`}
          style={{ ...cardStyle, padding: "28px 32px", minHeight }}
        >
          {value.trim() ? (
            <div style={{ maxWidth: "68ch" }}>
              <Markdown>{value}</Markdown>
            </div>
          ) : (
            <p style={{ fontFamily: font.body, fontSize: 14, color: "var(--color-text-tertiary)", margin: 0 }}>
              Nothing to preview yet.
            </p>
          )}
        </div>
      )}
      <div
        id={`${id}-hint`}
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          marginTop: 6,
          fontFamily: font.body,
          fontSize: 12,
          color: "var(--color-text-tertiary)",
          flexWrap: "wrap",
        }}
      >
        <span>Markdown: # headings, **bold**, - lists, &gt; callouts, | tables |, [text](link). HTML isn&apos;t rendered.</span>
        <span style={{ fontFamily: font.mono, color: overLimit ? "#F87171" : undefined, fontVariantNumeric: "tabular-nums" }}>
          {value.length.toLocaleString("en-US")} / {limit.toLocaleString("en-US")}
        </span>
      </div>
    </div>
  );
}

/** Floating save bar, plus ⌘S / Ctrl+S and a leave-page warning while there are unsaved changes. */
export function UnsavedBar({
  dirty,
  saving,
  canSave,
  saveLabel,
  onSave,
  onDiscard,
}: {
  dirty: boolean;
  saving: boolean;
  canSave: boolean;
  saveLabel: string;
  onSave: () => void;
  onDiscard: () => void;
}) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (canSave) onSave();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [canSave, onSave]);

  useEffect(() => {
    if (!dirty) return;
    function onBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  if (!dirty) return null;
  return (
    <div
      role="region"
      aria-label="Unsaved changes"
      style={{
        position: "fixed",
        left: "50%",
        bottom: 24,
        transform: "translateX(-50%)",
        zIndex: 40,
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 12px 10px 18px",
        backgroundColor: "#1C1C1C",
        border: "1px solid var(--color-border-strong)",
        borderRadius: 14,
        boxShadow: "0 16px 40px rgba(0,0,0,0.55)",
        maxWidth: "calc(100vw - 32px)",
      }}
    >
      <span style={{ fontFamily: font.body, fontSize: 13, color: "var(--color-text-secondary)", whiteSpace: "nowrap" }}>
        Unsaved changes
      </span>
      <button type="button" onClick={onDiscard} disabled={saving} style={ghostButtonStyle}>
        Discard
      </button>
      <button
        type="button"
        onClick={onSave}
        disabled={!canSave}
        aria-keyshortcuts="Meta+S Control+S"
        style={{
          ...primarySmallButtonStyle,
          opacity: canSave ? 1 : 0.4,
          cursor: canSave ? "pointer" : "not-allowed",
        }}
      >
        {saving ? "Saving…" : saveLabel}
      </button>
    </div>
  );
}

export function MonoLabel({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <span
      style={{
        fontFamily: font.mono,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.10em",
        textTransform: "uppercase",
        color: color ?? "var(--color-text-tertiary)",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {children}
    </span>
  );
}

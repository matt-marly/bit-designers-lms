"use client";

import { useState } from "react";
import { CheckCircle, MoreHorizontal } from "lucide-react";
import { SectionLabel } from "@/components/ui/custom/section-label";
import { PrimaryButton } from "@/components/ui/custom/buttons";
import { mockAnnouncements } from "@/lib/mock-admin-data";

const font = {
  display: "var(--font-display), 'Space Grotesk', 'Inter', system-ui, sans-serif",
  body: "var(--font-body), 'Inter', system-ui, -apple-system, sans-serif",
  mono: "var(--font-mono), 'JetBrains Mono', 'SF Mono', monospace",
};

const cardStyle: React.CSSProperties = {
  backgroundColor: "var(--color-bg-surface)",
  border: "1px solid var(--color-border-subtle)",
  borderRadius: 14,
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function TogglePill({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "8px 16px",
        borderRadius: 10,
        border: `1px solid ${selected ? "var(--color-indigo-border)" : "var(--color-border-subtle)"}`,
        backgroundColor: selected ? "var(--color-indigo-subtle)" : "var(--color-bg-surface-2)",
        color: selected ? "var(--color-indigo-text)" : "var(--color-text-tertiary)",
        fontFamily: font.body,
        fontSize: 13,
        fontWeight: 500,
        cursor: "pointer",
        transitionProperty: "background-color, border-color, color",
        transitionDuration: "var(--duration-fast)",
        transitionTimingFunction: "var(--ease-out-quart)",
      }}
    >
      {label}
    </button>
  );
}

interface AnnouncementItem {
  id: string;
  title: string;
  body: string;
  scope: "global" | "cohort";
  cohortId: string | null;
  createdAt: string;
  createdBy: string;
  status: "published";
}

export default function AnnouncementsPage() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [scope, setScope] = useState<"global" | "cohort">("cohort");
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>(mockAnnouncements as AnnouncementItem[]);
  const [showSuccess, setShowSuccess] = useState(false);

  const canPublish = title.trim() !== "" && message.trim() !== "";

  function handlePublish() {
    if (!canPublish) return;

    const newAnn: AnnouncementItem = {
      id: `ann-${Date.now()}`,
      title: title.trim(),
      body: message.trim(),
      scope,
      cohortId: scope === "cohort" ? "cohort-01" : null,
      createdAt: new Date().toISOString(),
      createdBy: "Adeyemi Matthew",
      status: "published",
    };

    setAnnouncements((prev) => [newAnn, ...prev]);
    setShowSuccess(true);

    setTimeout(() => {
      setShowSuccess(false);
      setTitle("");
      setMessage("");
      setScope("cohort");
    }, 2000);
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    height: 40,
    padding: "0 14px",
    borderRadius: 10,
    backgroundColor: "var(--color-bg-surface-2)",
    border: "1px solid var(--color-border-strong)",
    color: "var(--color-text-primary)",
    fontFamily: font.body,
    fontSize: "14.5px",
    lineHeight: "22px",
    fontWeight: 400,
    outline: "none",
    boxSizing: "border-box" as const,
  };

  return (
    <div>
      {/* Title */}
      <h1
        style={{
          fontFamily: font.display,
          fontSize: 36,
          lineHeight: "42px",
          fontWeight: 600,
          letterSpacing: "-0.02em",
          color: "var(--color-text-primary)",
          margin: 0,
          marginBottom: 32,
        }}
      >
        Announcements
      </h1>

      {/* Compose card */}
      <div style={{ ...cardStyle, padding: 24, marginBottom: 32 }}>
        <SectionLabel>NEW ANNOUNCEMENT</SectionLabel>

        {showSuccess ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 20 }}>
            <CheckCircle style={{ width: 16, height: 16, color: "var(--color-success-text)" }} />
            <span
              style={{
                fontFamily: font.body,
                fontSize: 14,
                fontWeight: 500,
                color: "var(--color-success-text)",
              }}
            >
              Announcement published
            </span>
          </div>
        ) : (
          <>
            {/* Title field */}
            <div style={{ marginTop: 20 }}>
              <label
                style={{
                  fontFamily: font.body,
                  fontSize: 14,
                  fontWeight: 500,
                  color: "var(--color-text-primary)",
                  display: "block",
                  marginBottom: 8,
                }}
              >
                Title
              </label>
              <input
                type="text"
                placeholder="Announcement title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={inputStyle}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "rgba(99,102,241,0.70)";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.15)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--color-border-strong)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Message field */}
            <div style={{ marginTop: 20 }}>
              <label
                style={{
                  fontFamily: font.body,
                  fontSize: 14,
                  fontWeight: 500,
                  color: "var(--color-text-primary)",
                  display: "block",
                  marginBottom: 8,
                }}
              >
                Message
              </label>
              <textarea
                rows={5}
                placeholder="Write your announcement..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                style={{
                  ...inputStyle,
                  height: "auto",
                  padding: "12px 14px",
                  minHeight: 120,
                  resize: "vertical",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "rgba(99,102,241,0.70)";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.15)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--color-border-strong)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Scope */}
            <div style={{ marginTop: 20 }}>
              <label
                style={{
                  fontFamily: font.body,
                  fontSize: 14,
                  fontWeight: 500,
                  color: "var(--color-text-primary)",
                  display: "block",
                  marginBottom: 8,
                }}
              >
                Send to
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <TogglePill label="All cohorts" selected={scope === "global"} onClick={() => setScope("global")} />
                <TogglePill label="Cohort 01 only" selected={scope === "cohort"} onClick={() => setScope("cohort")} />
              </div>
            </div>

            {/* Publish */}
            <div style={{ marginTop: 20 }}>
              <PrimaryButton fullWidth disabled={!canPublish} onClick={handlePublish}>
                Publish Announcement
              </PrimaryButton>
            </div>
          </>
        )}
      </div>

      {/* Published list */}
      <SectionLabel>PUBLISHED</SectionLabel>
      <div
        style={{
          marginTop: 16,
          border: "1px solid var(--color-border-subtle)",
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        {announcements.map((ann, i) => (
          <div
            key={ann.id}
            style={{
              padding: "16px 20px",
              borderBottom: i < announcements.length - 1 ? "1px solid var(--color-border-subtle)" : "none",
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 16,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontFamily: font.body,
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--color-text-primary)",
                  margin: 0,
                }}
              >
                {ann.title}
              </p>
              <p
                style={{
                  fontFamily: font.body,
                  fontSize: 13,
                  fontWeight: 400,
                  color: "var(--color-text-secondary)",
                  margin: 0,
                  marginTop: 4,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {ann.body}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                <span
                  style={{
                    fontFamily: font.mono,
                    fontSize: 10,
                    fontWeight: 500,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: "var(--color-text-tertiary)",
                    backgroundColor: "var(--color-bg-surface-3)",
                    border: "1px solid var(--color-border-subtle)",
                    borderRadius: 999,
                    padding: "2px 6px",
                  }}
                >
                  {ann.scope === "global" ? "GLOBAL" : "COHORT 01"}
                </span>
                <span
                  style={{
                    fontFamily: font.mono,
                    fontSize: 11,
                    fontWeight: 500,
                    letterSpacing: "0.06em",
                    color: "var(--color-text-tertiary)",
                  }}
                >
                  · {formatDate(ann.createdAt)} · by {ann.createdBy}
                </span>
              </div>
            </div>
            <button
              style={{
                background: "none",
                border: "none",
                padding: 4,
                cursor: "pointer",
                color: "var(--color-text-tertiary)",
                flexShrink: 0,
                transitionProperty: "color",
                transitionDuration: "var(--duration-fast)",
                transitionTimingFunction: "var(--ease-out-quart)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-text-primary)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-tertiary)")}
            >
              <MoreHorizontal style={{ width: 18, height: 18 }} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

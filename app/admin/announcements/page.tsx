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
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const labelStyle: React.CSSProperties = {
  fontFamily: font.mono,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.10em",
  textTransform: "uppercase",
  color: "#B5B5B5",
  display: "block",
  marginBottom: 8,
};

interface AnnouncementItem {
  id: string; title: string; body: string; scope: "global" | "cohort"; cohortId: string | null; createdAt: string; createdBy: string; status: "published";
}

export default function AnnouncementsPage() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [scope, setScope] = useState<"global" | "cohort">("global");
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>(mockAnnouncements as AnnouncementItem[]);
  const [showSuccess, setShowSuccess] = useState(false);
  const canPublish = title.trim() !== "" && message.trim() !== "";

  function handlePublish() {
    if (!canPublish) return;
    const newAnn: AnnouncementItem = { id: `ann-${Date.now()}`, title: title.trim(), body: message.trim(), scope, cohortId: scope === "cohort" ? "cohort-01" : null, createdAt: new Date().toISOString(), createdBy: "Adeyemi Matthew", status: "published" };
    setAnnouncements((prev) => [newAnn, ...prev]);
    setShowSuccess(true);
    setTimeout(() => { setShowSuccess(false); setTitle(""); setMessage(""); setScope("global"); }, 2000);
  }

  const inputStyle: React.CSSProperties = { width: "100%", height: 40, padding: "0 14px", borderRadius: 10, backgroundColor: "#181818", border: "1px solid #333333", color: "#FFFFFF", fontFamily: font.body, fontSize: 14, fontWeight: 400, outline: "none", boxSizing: "border-box" as const };

  return (
    <div>
      <h1 style={{ fontFamily: font.display, fontSize: 36, lineHeight: "42px", fontWeight: 600, letterSpacing: "-0.02em", color: "var(--color-text-primary)", margin: 0, marginBottom: 32 }}>Announcements</h1>

      <div style={{ ...cardStyle, padding: 24, marginBottom: 32 }}>
        <SectionLabel>NEW ANNOUNCEMENT</SectionLabel>
        {showSuccess ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 20 }}>
            <CheckCircle style={{ width: 16, height: 16, color: "var(--color-success-text)" }} />
            <span style={{ fontFamily: font.body, fontSize: 14, fontWeight: 500, color: "var(--color-success-text)" }}>Announcement published</span>
          </div>
        ) : (
          <>
            <div style={{ marginTop: 20 }}>
              <label style={labelStyle}>Title</label>
              <input type="text" placeholder="Announcement title..." value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle}
                onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.70)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.15)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#333333"; e.currentTarget.style.boxShadow = "none"; }}
              />
            </div>
            <div style={{ marginTop: 20 }}>
              <label style={labelStyle}>Message</label>
              <textarea rows={5} placeholder="Write your announcement..." value={message} onChange={(e) => setMessage(e.target.value)}
                style={{ ...inputStyle, height: "auto", padding: "12px 14px", minHeight: 120, resize: "vertical" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.70)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.15)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#333333"; e.currentTarget.style.boxShadow = "none"; }}
              />
            </div>
            <div style={{ marginTop: 20 }}>
              <label style={labelStyle}>Send to</label>
              <div style={{ display: "flex", border: "1px solid #333333", borderRadius: 8, overflow: "hidden", width: "fit-content" }}>
                <button
                  onClick={() => setScope("global")}
                  style={{
                    height: 36, padding: "0 20px", border: "none", borderRight: "1px solid #333333", borderRadius: 0,
                    fontFamily: font.body, fontSize: 14, cursor: "pointer",
                    backgroundColor: scope === "global" ? "rgba(99,102,241,0.12)" : "transparent",
                    color: scope === "global" ? "#A5B4FC" : "#737373",
                    fontWeight: scope === "global" ? 500 : 400,
                    transition: "background-color 120ms ease",
                  }}
                >
                  All cohorts
                </button>
                <button
                  onClick={() => setScope("cohort")}
                  style={{
                    height: 36, padding: "0 20px", border: "none", borderRadius: 0,
                    fontFamily: font.body, fontSize: 14, cursor: "pointer",
                    backgroundColor: scope === "cohort" ? "rgba(99,102,241,0.12)" : "transparent",
                    color: scope === "cohort" ? "#A5B4FC" : "#737373",
                    fontWeight: scope === "cohort" ? 500 : 400,
                    transition: "background-color 120ms ease",
                  }}
                >
                  Cohort 01 only
                </button>
              </div>
            </div>
            <div style={{ marginTop: 20 }}>
              <PrimaryButton fullWidth disabled={!canPublish} onClick={handlePublish}>Publish Announcement</PrimaryButton>
            </div>
          </>
        )}
      </div>

      <div style={{ fontFamily: font.mono, fontSize: 11, fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", color: "#737373", marginBottom: 16 }}>PUBLISHED</div>
      <div style={{ border: "1px solid #242424", borderRadius: 12, overflow: "hidden" }}>
        {announcements.map((ann, i) => (
          <div key={ann.id} style={{ padding: "16px 20px", borderBottom: i < announcements.length - 1 ? "1px solid #242424" : "none", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: font.body, fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)", margin: 0 }}>{ann.title}</p>
              <p style={{ fontFamily: font.body, fontSize: 13, fontWeight: 400, color: "var(--color-text-secondary)", margin: 0, marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ann.body}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                <span style={{
                  fontFamily: font.mono, fontSize: 10, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", borderRadius: 999, padding: "2px 6px",
                  ...(ann.scope === "global"
                    ? { color: "var(--color-indigo-text)", backgroundColor: "var(--color-indigo-subtle)", border: "1px solid var(--color-indigo-border)" }
                    : { color: "var(--color-text-tertiary)", backgroundColor: "var(--color-bg-surface-3)", border: "1px solid var(--color-border-subtle)" }
                  ),
                }}>
                  {ann.scope === "global" ? "GLOBAL" : "COHORT 01"}
                </span>
                <span style={{ fontFamily: font.mono, fontSize: 11, fontWeight: 500, letterSpacing: "0.06em", color: "var(--color-text-tertiary)" }}>· {formatDate(ann.createdAt)} · by {ann.createdBy}</span>
              </div>
            </div>
            <button
              style={{ background: "none", border: "none", padding: 4, cursor: "pointer", color: "var(--color-text-tertiary)", flexShrink: 0, transitionProperty: "color", transitionDuration: "var(--duration-fast)", transitionTimingFunction: "var(--ease-out-quart)" }}
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

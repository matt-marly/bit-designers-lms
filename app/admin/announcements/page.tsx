"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { MoreHorizontal } from "lucide-react";
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

type ToastData = {
  message: string;
  type: "success" | "error";
};

const toastDotColor: Record<ToastData["type"], string> = {
  success: "#22C55E",
  error: "#EF4444",
};

function AnnouncementMenu({ onDelete }: { onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative", flexShrink: 0 }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{ background: "none", border: "none", padding: 4, cursor: "pointer", color: "var(--color-text-tertiary)", transitionProperty: "color", transitionDuration: "var(--duration-fast)", transitionTimingFunction: "var(--ease-out-quart)" }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-text-primary)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-tertiary)")}
      >
        <MoreHorizontal style={{ width: 18, height: 18 }} />
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            right: 0,
            marginTop: 4,
            background: "#1C1C1C",
            border: "1px solid #333333",
            borderRadius: 10,
            padding: "4px 0",
            boxShadow: "0 16px 40px rgba(0,0,0,0.55)",
            zIndex: 20,
            minWidth: 120,
          }}
        >
          <button
            onClick={() => { setOpen(false); onDelete(); }}
            style={{
              display: "block",
              width: "100%",
              padding: "8px 14px",
              background: "none",
              border: "none",
              textAlign: "left",
              fontFamily: font.body,
              fontSize: 13,
              color: "#F87171",
              cursor: "pointer",
              transitionProperty: "background-color",
              transitionDuration: "var(--duration-fast)",
              transitionTimingFunction: "var(--ease-out-quart)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

export default function AnnouncementsPage() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [scope, setScope] = useState<"global" | "cohort">("global");
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>(mockAnnouncements as AnnouncementItem[]);
  const [toast, setToast] = useState<ToastData | null>(null);
  const canPublish = title.trim() !== "" && message.trim() !== "";

  const showToast = useCallback((message: string, type: ToastData["type"] = "success") => {
    setToast({ message, type });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), toast.type === "error" ? 5000 : 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  function handlePublish() {
    if (!canPublish) return;
    const newAnn: AnnouncementItem = { id: `ann-${Date.now()}`, title: title.trim(), body: message.trim(), scope, cohortId: scope === "cohort" ? "cohort-01" : null, createdAt: new Date().toISOString(), createdBy: "Adeyemi Matthew", status: "published" };
    setAnnouncements((prev) => [newAnn, ...prev]);
    setTitle("");
    setMessage("");
    setScope("global");
    showToast("Announcement published");
  }

  function handleDelete(id: string) {
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    showToast("Announcement deleted");
  }

  const inputStyle: React.CSSProperties = { width: "100%", height: 40, padding: "0 14px", borderRadius: 10, backgroundColor: "#181818", border: "1px solid #333333", color: "#FFFFFF", fontFamily: font.body, fontSize: 14, fontWeight: 400, outline: "none", boxSizing: "border-box" as const };

  return (
    <div>
      <style>{`
        @keyframes toast-enter {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <h1 style={{ fontFamily: font.display, fontSize: 36, lineHeight: "42px", fontWeight: 600, letterSpacing: "-0.02em", color: "var(--color-text-primary)", margin: 0, marginBottom: 32 }}>Announcements</h1>

      <div style={{ ...cardStyle, padding: 24, marginBottom: 32 }}>
        <SectionLabel>NEW ANNOUNCEMENT</SectionLabel>
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
      </div>

      <div style={{ fontFamily: font.mono, fontSize: 11, fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", color: "#737373", marginBottom: 16 }}>PUBLISHED</div>
      <div style={{ border: "1px solid #242424", borderRadius: 12, overflow: "hidden" }}>
        {announcements.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center" }}>
            <p style={{ fontFamily: font.body, fontSize: 14, color: "#737373", margin: 0 }}>
              No announcements published yet.
            </p>
          </div>
        ) : (
          announcements.map((ann, i) => (
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
              <AnnouncementMenu onDelete={() => handleDelete(ann.id)} />
            </div>
          ))
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div
          role={toast.type === "error" ? "alert" : "status"}
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 50,
            background: "#1C1C1C",
            border: "1px solid #333333",
            borderRadius: 10,
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            minWidth: 280,
            maxWidth: 360,
            boxShadow: "0 16px 40px rgba(0,0,0,0.55)",
            animation: "toast-enter 240ms cubic-bezier(0.25, 1, 0.5, 1)",
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              backgroundColor: toastDotColor[toast.type],
              flexShrink: 0,
            }}
          />
          <span style={{ fontFamily: font.body, fontSize: 14, color: "#FFFFFF" }}>
            {toast.message}
          </span>
        </div>
      )}
    </div>
  );
}

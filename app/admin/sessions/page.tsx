"use client";

import { useState } from "react";
import { CheckCircle } from "lucide-react";
import { SectionLabel } from "@/components/ui/custom/section-label";
import { PrimaryButton, OutlineButton } from "@/components/ui/custom/buttons";
import { mockSessions } from "@/lib/mock-live-data";
import type { LiveSession } from "@/lib/mock-live-data";

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

function TogglePill({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "8px 16px", borderRadius: 10,
        border: `1px solid ${selected ? "var(--color-indigo-border)" : "var(--color-border-strong)"}`,
        backgroundColor: selected ? "var(--color-indigo-subtle)" : "var(--color-bg-surface-2)",
        color: selected ? "var(--color-indigo-text)" : "var(--color-text-tertiary)",
        fontFamily: font.body, fontSize: 13, fontWeight: 500, cursor: "pointer",
        transitionProperty: "background-color, border-color, color", transitionDuration: "var(--duration-fast)", transitionTimingFunction: "var(--ease-out-quart)",
      }}
    >
      {label}
    </button>
  );
}

function formatSessionDate(date: string, time: string, tz: string): string {
  const d = new Date(date + "T" + time);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }) + " · " + time + " " + tz;
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    upcoming: { bg: "var(--color-indigo-subtle)", text: "var(--color-indigo-text)", border: "var(--color-indigo-border)", label: "UPCOMING", dot: false },
    recorded: { bg: "var(--color-bg-surface-3)", text: "var(--color-text-tertiary)", border: "var(--color-border-subtle)", label: "RECORDED", dot: false },
    live: { bg: "var(--color-success-subtle)", text: "var(--color-success-text)", border: "var(--color-success-border)", label: "LIVE", dot: true },
  }[status] ?? { bg: "var(--color-bg-surface-3)", text: "var(--color-text-tertiary)", border: "var(--color-border-subtle)", label: status.toUpperCase(), dot: false };

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4, height: 20, padding: "0 8px", borderRadius: 999,
      backgroundColor: styles.bg, border: `1px solid ${styles.border}`,
      fontFamily: font.mono, fontSize: 10, fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", color: styles.text,
    }}>
      {styles.dot && (
        <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: styles.text, animation: "pulse 2s infinite" }} />
      )}
      {styles.label}
    </span>
  );
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<LiveSession[]>(mockSessions);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState(90);
  const [link, setLink] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const canSchedule = title.trim() !== "" && date !== "" && time !== "" && link.trim() !== "";

  function handleSchedule() {
    if (!canSchedule) return;
    const newSession: LiveSession = {
      slug: `session-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      host: "Adeyemi Matthew",
      cohort: "Cohort 01",
      date,
      time,
      timezone: "WAT",
      duration,
      joinUrl: link.trim(),
      recordingUrl: null,
      status: "upcoming",
      module: "",
      tags: [],
    };
    setSessions((prev) => [newSession, ...prev]);
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setTitle(""); setDescription(""); setDate(""); setTime(""); setDuration(90); setLink("");
    }, 2000);
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", height: 40, padding: "0 14px", borderRadius: 10,
    backgroundColor: "var(--color-bg-surface-2)", border: "1px solid var(--color-border-strong)",
    color: "var(--color-text-primary)", fontFamily: font.body, fontSize: "14.5px", lineHeight: "22px", fontWeight: 400,
    outline: "none", boxSizing: "border-box",
  };

  return (
    <div>
      <h1 style={{ fontFamily: font.display, fontSize: 36, lineHeight: "42px", fontWeight: 600, letterSpacing: "-0.02em", color: "var(--color-text-primary)", margin: 0 }}>Sessions</h1>
      <p style={{ fontFamily: font.body, fontSize: 14, lineHeight: "22px", fontWeight: 400, color: "var(--color-text-secondary)", margin: 0, marginTop: 6, marginBottom: 32 }}>Schedule and manage live sessions</p>

      {/* Schedule form */}
      <div style={{ ...cardStyle, padding: 24, marginBottom: 32 }}>
        <SectionLabel>SCHEDULE NEW SESSION</SectionLabel>

        {showSuccess ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 20 }}>
            <CheckCircle style={{ width: 16, height: 16, color: "var(--color-success-text)" }} />
            <span style={{ fontFamily: font.body, fontSize: 14, fontWeight: 500, color: "var(--color-success-text)" }}>Session scheduled</span>
          </div>
        ) : (
          <>
            <div style={{ marginTop: 20 }}>
              <label style={{ fontFamily: font.body, fontSize: 14, fontWeight: 500, color: "var(--color-text-primary)", display: "block", marginBottom: 8 }}>Title</label>
              <input type="text" placeholder="Session title..." value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle}
                onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.70)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.15)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "var(--color-border-strong)"; e.currentTarget.style.boxShadow = "none"; }}
              />
            </div>

            <div style={{ marginTop: 16 }}>
              <label style={{ fontFamily: font.body, fontSize: 14, fontWeight: 500, color: "var(--color-text-primary)", display: "block", marginBottom: 8 }}>Description</label>
              <textarea rows={3} placeholder="Session description..." value={description} onChange={(e) => setDescription(e.target.value)}
                style={{ ...inputStyle, height: "auto", padding: "12px 14px", minHeight: 80, resize: "vertical" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.70)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.15)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "var(--color-border-strong)"; e.currentTarget.style.boxShadow = "none"; }}
              />
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 140px" }}>
                <label style={{ fontFamily: font.body, fontSize: 14, fontWeight: 500, color: "var(--color-text-primary)", display: "block", marginBottom: 8 }}>Date</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ ...inputStyle, colorScheme: "dark" }} />
              </div>
              <div style={{ flex: "1 1 140px" }}>
                <label style={{ fontFamily: font.body, fontSize: 14, fontWeight: 500, color: "var(--color-text-primary)", display: "block", marginBottom: 8 }}>Time</label>
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)} style={{ ...inputStyle, colorScheme: "dark" }} />
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <label style={{ fontFamily: font.body, fontSize: 14, fontWeight: 500, color: "var(--color-text-primary)", display: "block", marginBottom: 8 }}>Duration</label>
              <div style={{ display: "flex", gap: 8 }}>
                {[60, 90, 120].map((d) => (
                  <TogglePill key={d} label={`${d} min`} selected={duration === d} onClick={() => setDuration(d)} />
                ))}
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <label style={{ fontFamily: font.body, fontSize: 14, fontWeight: 500, color: "var(--color-text-primary)", display: "block", marginBottom: 8 }}>Cohort</label>
              <TogglePill label="Cohort 01" selected onClick={() => {}} />
            </div>

            <div style={{ marginTop: 16 }}>
              <label style={{ fontFamily: font.body, fontSize: 14, fontWeight: 500, color: "var(--color-text-primary)", display: "block", marginBottom: 8 }}>Meeting link</label>
              <input type="url" placeholder="https://zoom.us/..." value={link} onChange={(e) => setLink(e.target.value)} style={inputStyle}
                onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.70)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.15)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "var(--color-border-strong)"; e.currentTarget.style.boxShadow = "none"; }}
              />
            </div>

            <div style={{ marginTop: 20 }}>
              <PrimaryButton fullWidth disabled={!canSchedule} onClick={handleSchedule}>Schedule Session</PrimaryButton>
              {!canSchedule && (
                <p
                  style={{
                    fontFamily: font.mono,
                    fontSize: 11,
                    lineHeight: "14px",
                    fontWeight: 500,
                    color: "var(--color-text-tertiary)",
                    textAlign: "center",
                    margin: 0,
                    marginTop: 8,
                  }}
                >
                  Fill in title, date, time, and meeting link
                </p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Sessions list */}
      <SectionLabel>ALL SESSIONS</SectionLabel>
      <div style={{ marginTop: 16, border: "1px solid var(--color-border-subtle)", borderRadius: 14, overflow: "hidden" }}>
        {sessions.map((session, i) => (
          <div
            key={session.slug}
            style={{
              padding: "16px 20px",
              borderBottom: i < sessions.length - 1 ? "1px solid var(--color-border-subtle)" : "none",
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap",
              transitionProperty: "background-color", transitionDuration: "var(--duration-fast)", transitionTimingFunction: "var(--ease-out-quart)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1C1C1C")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            {/* Left */}
            <div style={{ flex: "1 1 200px", minWidth: 0 }}>
              <p style={{ fontFamily: font.body, fontSize: 14, fontWeight: 500, color: "var(--color-text-primary)", margin: 0 }}>{session.title}</p>
              <p style={{ fontFamily: font.mono, fontSize: 12, fontWeight: 500, color: "var(--color-text-tertiary)", margin: 0, marginTop: 4, fontVariantNumeric: "tabular-nums" }}>
                {formatSessionDate(session.date, session.time, session.timezone)}
              </p>
              <p style={{ fontFamily: font.body, fontSize: 13, fontWeight: 400, color: "var(--color-text-secondary)", margin: 0, marginTop: 2 }}>
                {session.host} · {session.duration} min
              </p>
            </div>

            {/* Center: status */}
            <StatusBadge status={session.status} />

            {/* Right: actions */}
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              {session.status === "upcoming" && (
                <>
                  <OutlineButton size="small">Edit</OutlineButton>
                  <button
                    className="inline-flex items-center justify-center"
                    style={{
                      height: 32, padding: "0 12px", borderRadius: 10, backgroundColor: "transparent",
                      color: "var(--color-text-primary)", border: "1px solid var(--color-border-strong)",
                      fontFamily: font.body, fontSize: "14.5px", fontWeight: 500, cursor: "pointer",
                      transitionProperty: "background-color, border-color, color", transitionDuration: "var(--duration-fast)", transitionTimingFunction: "var(--ease-out-quart)",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--color-danger-border)"; e.currentTarget.style.color = "var(--color-danger-text)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-border-strong)"; e.currentTarget.style.color = "var(--color-text-primary)"; }}
                  >
                    Cancel
                  </button>
                </>
              )}
              {session.status === "recorded" && (
                <OutlineButton size="small">Add Recording</OutlineButton>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

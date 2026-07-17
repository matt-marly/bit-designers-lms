"use client";

import { useState } from "react";
import { CheckCircle } from "lucide-react";
import { SectionLabel } from "@/components/ui/custom/section-label";
import { PrimaryButton } from "@/components/ui/custom/buttons";
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

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 40,
  padding: "0 14px",
  borderRadius: 10,
  backgroundColor: "#181818",
  border: "1px solid #333333",
  color: "#FFFFFF",
  fontFamily: font.body,
  fontSize: 14,
  fontWeight: 400,
  outline: "none",
  boxSizing: "border-box",
  appearance: "none",
  WebkitAppearance: "none",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: "pointer",
};

function formatSessionDate(date: string, time: string, tz: string): string {
  const d = new Date(date + "T" + time);
  const weekday = d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
  const month = d.toLocaleDateString("en-US", { month: "long" }).toUpperCase();
  const day = d.getDate();
  const [h, m] = time.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${weekday}, ${month} ${day} · ${hour12}:${m} ${ampm} ${tz}`;
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    upcoming: {
      bg: "rgba(99,102,241,0.12)",
      text: "#A5B4FC",
      border: "rgba(99,102,241,0.35)",
      label: "UPCOMING",
    },
    recorded: {
      bg: "#202020",
      text: "#737373",
      border: "#242424",
      label: "RECORDED",
    },
    live: {
      bg: "rgba(34,197,94,0.10)",
      text: "#4ADE80",
      border: "rgba(34,197,94,0.30)",
      label: "LIVE",
    },
  }[status] ?? {
    bg: "#202020",
    text: "#737373",
    border: "#242424",
    label: status.toUpperCase(),
  };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "3px 8px",
        borderRadius: 999,
        backgroundColor: styles.bg,
        border: `1px solid ${styles.border}`,
        fontFamily: font.mono,
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.10em",
        textTransform: "uppercase",
        color: styles.text,
      }}
    >
      {styles.label}
    </span>
  );
}

function handleFocus(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
  e.currentTarget.style.borderColor = "rgba(99,102,241,0.70)";
  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.15)";
}

function handleBlur(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
  e.currentTarget.style.borderColor = "#333333";
  e.currentTarget.style.boxShadow = "none";
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<LiveSession[]>([...mockSessions]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState(60);
  const [cohort, setCohort] = useState("Cohort 01");
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
      cohort,
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
      setTitle("");
      setDescription("");
      setDate("");
      setTime("");
      setDuration(60);
      setCohort("Cohort 01");
      setLink("");
    }, 2000);
  }

  return (
    <div>
      <style>{`
        input[type="date"]::-webkit-calendar-picker-indicator,
        input[type="time"]::-webkit-calendar-picker-indicator,
        input[type="date"]::-webkit-inner-spin-button,
        input[type="time"]::-webkit-inner-spin-button {
          display: none;
          -webkit-appearance: none;
        }
      `}</style>

      <h1
        style={{
          fontFamily: font.display,
          fontSize: 36,
          lineHeight: "42px",
          fontWeight: 600,
          letterSpacing: "-0.02em",
          color: "var(--color-text-primary)",
          margin: 0,
        }}
      >
        Sessions
      </h1>
      <div style={{ marginBottom: 32 }} />

      {/* Schedule form */}
      <div style={{ ...cardStyle, padding: 24, marginBottom: 32 }}>
        <SectionLabel>SCHEDULE NEW SESSION</SectionLabel>

        {showSuccess ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 20 }}>
            <CheckCircle style={{ width: 16, height: 16, color: "var(--color-success-text)" }} />
            <span style={{ fontFamily: font.body, fontSize: 14, fontWeight: 500, color: "var(--color-success-text)" }}>
              Session scheduled
            </span>
          </div>
        ) : (
          <>
            <div style={{ marginTop: 20 }}>
              <label style={labelStyle}>Title</label>
              <input
                type="text"
                placeholder="Session title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={inputStyle}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
            </div>

            <div style={{ marginTop: 16 }}>
              <label style={labelStyle}>Description</label>
              <textarea
                rows={3}
                placeholder="Session description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{
                  ...inputStyle,
                  height: "auto",
                  padding: "12px 14px",
                  minHeight: 80,
                  resize: "vertical",
                }}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 140px" }}>
                <label style={labelStyle}>Date</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="DD / MM / YYYY"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  style={inputStyle}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </div>
              <div style={{ flex: "1 1 140px" }}>
                <label style={labelStyle}>Time</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="00:00"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  style={inputStyle}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <label style={labelStyle}>Duration</label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                style={selectStyle}
                onFocus={handleFocus}
                onBlur={handleBlur}
              >
                <option value={60}>60 min</option>
                <option value={90}>90 min</option>
                <option value={120}>120 min</option>
              </select>
            </div>

            <div style={{ marginTop: 16 }}>
              <label style={labelStyle}>Cohort</label>
              <select
                value={cohort}
                onChange={(e) => setCohort(e.target.value)}
                style={selectStyle}
                onFocus={handleFocus}
                onBlur={handleBlur}
              >
                <option value="Cohort 01">Cohort 01</option>
                <option value="Cohort 02">Cohort 02</option>
              </select>
            </div>

            <div style={{ marginTop: 16 }}>
              <label style={labelStyle}>Meeting link</label>
              <input
                type="url"
                placeholder="https://zoom.us/..."
                value={link}
                onChange={(e) => setLink(e.target.value)}
                style={inputStyle}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
            </div>

            <div style={{ marginTop: 20 }}>
              <PrimaryButton fullWidth disabled={!canSchedule} onClick={handleSchedule}>
                Schedule Session
              </PrimaryButton>
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
      <div
        style={{
          fontFamily: font.mono,
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.10em",
          textTransform: "uppercase",
          color: "#737373",
          marginBottom: 16,
        }}
      >
        ALL SESSIONS
      </div>

      <div
        style={{
          border: "1px solid #242424",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        {sessions.map((session, i) => (
          <div
            key={session.slug}
            style={{
              padding: "16px 20px",
              borderBottom: i < sessions.length - 1 ? "1px solid #242424" : "none",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            {/* Left */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0, flex: 1 }}>
              <span
                style={{
                  fontFamily: font.body,
                  fontSize: 14,
                  fontWeight: 500,
                  color: "#FFFFFF",
                }}
              >
                {session.title}
              </span>
              <span
                style={{
                  fontFamily: font.mono,
                  fontSize: 12,
                  fontWeight: 500,
                  color: "#737373",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {formatSessionDate(session.date, session.time, session.timezone)}
              </span>
              <span
                style={{
                  fontFamily: font.body,
                  fontSize: 13,
                  fontWeight: 400,
                  color: "#B5B5B5",
                }}
              >
                with {session.host} · {session.duration} min
              </span>
            </div>

            {/* Center: status */}
            <StatusBadge status={session.status} />

            {/* Right: actions */}
            <div style={{ display: "flex", gap: 8, flexShrink: 0, marginLeft: 16 }}>
              {session.status === "upcoming" && (
                <>
                  <button
                    style={{
                      height: 28,
                      padding: "0 12px",
                      borderRadius: 8,
                      backgroundColor: "transparent",
                      border: "1px solid #333333",
                      color: "#FFFFFF",
                      fontFamily: font.body,
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: "pointer",
                      transitionProperty: "background-color, border-color, color",
                      transitionDuration: "var(--duration-fast)",
                      transitionTimingFunction: "var(--ease-out-quart)",
                    }}
                  >
                    Edit
                  </button>
                  <button
                    style={{
                      height: 28,
                      padding: "0 12px",
                      borderRadius: 8,
                      backgroundColor: "transparent",
                      border: "1px solid #333333",
                      color: "#FFFFFF",
                      fontFamily: font.body,
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: "pointer",
                      transitionProperty: "background-color, border-color, color",
                      transitionDuration: "var(--duration-fast)",
                      transitionTimingFunction: "var(--ease-out-quart)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "rgba(239,68,68,0.55)";
                      e.currentTarget.style.color = "#F87171";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#333333";
                      e.currentTarget.style.color = "#FFFFFF";
                    }}
                  >
                    Cancel
                  </button>
                </>
              )}
              {session.status === "recorded" && (
                <button
                  style={{
                    height: 28,
                    padding: "0 12px",
                    borderRadius: 8,
                    backgroundColor: "transparent",
                    border: "1px solid #333333",
                    color: "#FFFFFF",
                    fontFamily: font.body,
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: "pointer",
                    transitionProperty: "background-color, border-color, color",
                    transitionDuration: "var(--duration-fast)",
                    transitionTimingFunction: "var(--ease-out-quart)",
                  }}
                >
                  Add Recording
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

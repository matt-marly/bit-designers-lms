"use client";

import { useState, useEffect, useCallback } from "react";
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

type ToastData = {
  message: string;
  type: "success" | "error";
};

const toastDotColor: Record<ToastData["type"], string> = {
  success: "#22C55E",
  error: "#EF4444",
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

function isValidUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

function isValidYouTubeUrl(url: string): boolean {
  return /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(url);
}

function isDateInPast(dateStr: string): boolean {
  if (!dateStr) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const parts = dateStr.split("/").map((s) => s.trim());
  let parsed: Date | null = null;
  if (parts.length === 3) {
    const [dd, mm, yyyy] = parts;
    parsed = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  } else {
    parsed = new Date(dateStr);
  }
  if (!parsed || isNaN(parsed.getTime())) return false;
  return parsed < today;
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
  const [linkError, setLinkError] = useState<string | null>(null);
  const [dateWarning, setDateWarning] = useState<string | null>(null);
  const [confirmingSlug, setConfirmingSlug] = useState<string | null>(null);
  const [recordingSlug, setRecordingSlug] = useState<string | null>(null);
  const [recordingUrl, setRecordingUrl] = useState("");
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastData | null>(null);

  const canSchedule = title.trim() !== "" && date !== "" && time !== "" && link.trim() !== "";

  const showToast = useCallback((message: string, type: ToastData["type"] = "success") => {
    setToast({ message, type });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), toast.type === "error" ? 5000 : 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  function handleDateChange(value: string) {
    setDate(value);
    setDateWarning(isDateInPast(value) ? "This date is in the past" : null);
  }

  function handleLinkBlur() {
    if (link.trim() !== "" && !isValidUrl(link.trim())) {
      setLinkError("Please enter a valid URL");
    } else {
      setLinkError(null);
    }
  }

  function handleSchedule() {
    if (!canSchedule) return;
    if (link.trim() !== "" && !isValidUrl(link.trim())) {
      setLinkError("Please enter a valid URL");
      return;
    }
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
    setTitle("");
    setDescription("");
    setDate("");
    setTime("");
    setDuration(60);
    setCohort("Cohort 01");
    setLink("");
    setLinkError(null);
    setDateWarning(null);
    showToast("Session scheduled");
  }

  function handleCancelSession(slug: string) {
    setSessions((prev) => prev.filter((s) => s.slug !== slug));
    setConfirmingSlug(null);
    showToast("Session cancelled");
  }

  function handleSaveRecording(slug: string) {
    if (!isValidYouTubeUrl(recordingUrl.trim())) {
      setRecordingError("Please enter a valid YouTube URL");
      return;
    }
    setSessions((prev) =>
      prev.map((s) =>
        s.slug === slug
          ? { ...s, recordingUrl: recordingUrl.trim(), status: "recorded" as const }
          : s
      )
    );
    setRecordingSlug(null);
    setRecordingUrl("");
    setRecordingError(null);
    showToast("Recording added");
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
        @keyframes toast-enter {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
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
                onChange={(e) => handleDateChange(e.target.value)}
                style={inputStyle}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
              {dateWarning && (
                <p style={{ fontFamily: font.body, fontSize: 12, color: "#F59E0B", margin: 0, marginTop: 6 }}>
                  {dateWarning}
                </p>
              )}
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
              onChange={(e) => { setLink(e.target.value); if (linkError) setLinkError(null); }}
              style={{
                ...inputStyle,
                borderColor: linkError ? "rgba(239,68,68,0.55)" : "#333333",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = linkError ? "rgba(239,68,68,0.55)" : "rgba(99,102,241,0.70)";
                e.currentTarget.style.boxShadow = linkError ? "0 0 0 3px rgba(239,68,68,0.15)" : "0 0 0 3px rgba(99,102,241,0.15)";
              }}
              onBlur={(e) => {
                handleLinkBlur();
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.borderColor = (link.trim() !== "" && !isValidUrl(link.trim())) ? "rgba(239,68,68,0.55)" : "#333333";
              }}
            />
            {linkError && (
              <p style={{ fontFamily: font.body, fontSize: 12, color: "#F87171", margin: 0, marginTop: 6 }}>
                {linkError}
              </p>
            )}
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
        {sessions.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center" }}>
            <p style={{ fontFamily: font.body, fontSize: 14, color: "#737373", margin: 0 }}>
              No sessions scheduled yet.
            </p>
          </div>
        ) : (
          sessions.map((session, i) => (
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
              <div style={{ display: "flex", gap: 8, flexShrink: 0, marginLeft: 16, alignItems: "center" }}>
                {session.status === "upcoming" && (
                  confirmingSlug === session.slug ? (
                    <>
                      <span style={{ fontFamily: font.body, fontSize: 13, color: "#737373" }}>
                        Cancel this session?
                      </span>
                      <button
                        onClick={() => handleCancelSession(session.slug)}
                        style={{
                          height: 28,
                          padding: "0 12px",
                          borderRadius: 10,
                          backgroundColor: "transparent",
                          border: "1px solid rgba(239,68,68,0.35)",
                          color: "#F87171",
                          fontFamily: font.body,
                          fontSize: 13,
                          fontWeight: 500,
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Yes, cancel
                      </button>
                      <button
                        onClick={() => setConfirmingSlug(null)}
                        style={{
                          height: 28,
                          padding: "0 12px",
                          borderRadius: 0,
                          backgroundColor: "transparent",
                          border: "none",
                          color: "var(--color-text-secondary)",
                          fontFamily: font.body,
                          fontSize: 13,
                          fontWeight: 500,
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Keep
                      </button>
                    </>
                  ) : (
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
                        onClick={() => setConfirmingSlug(session.slug)}
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
                  )
                )}
                {session.status === "recorded" && (
                  recordingSlug === session.slug ? (
                    <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                      <div>
                        <input
                          type="url"
                          placeholder="https://youtube.com/..."
                          value={recordingUrl}
                          onChange={(e) => { setRecordingUrl(e.target.value); if (recordingError) setRecordingError(null); }}
                          style={{
                            ...inputStyle,
                            width: 240,
                            borderColor: recordingError ? "rgba(239,68,68,0.55)" : "#333333",
                          }}
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = recordingError ? "rgba(239,68,68,0.55)" : "rgba(99,102,241,0.70)";
                            e.currentTarget.style.boxShadow = recordingError ? "0 0 0 3px rgba(239,68,68,0.15)" : "0 0 0 3px rgba(99,102,241,0.15)";
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = recordingError ? "rgba(239,68,68,0.55)" : "#333333";
                            e.currentTarget.style.boxShadow = "none";
                          }}
                        />
                        {recordingError && (
                          <p style={{ fontFamily: font.body, fontSize: 12, color: "#F87171", margin: 0, marginTop: 6 }}>
                            {recordingError}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleSaveRecording(session.slug)}
                        style={{
                          height: 32,
                          padding: "0 12px",
                          borderRadius: 10,
                          backgroundColor: "#6366F1",
                          border: "none",
                          color: "#FFFFFF",
                          fontFamily: font.body,
                          fontSize: 13,
                          fontWeight: 500,
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                          transitionProperty: "background-color",
                          transitionDuration: "var(--duration-fast)",
                          transitionTimingFunction: "var(--ease-out-quart)",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#777AF5")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#6366F1")}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => { setRecordingSlug(null); setRecordingUrl(""); setRecordingError(null); }}
                        style={{
                          height: 32,
                          padding: "0 12px",
                          borderRadius: 0,
                          backgroundColor: "transparent",
                          border: "none",
                          color: "var(--color-text-secondary)",
                          fontFamily: font.body,
                          fontSize: 13,
                          fontWeight: 500,
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setRecordingSlug(session.slug); setRecordingUrl(session.recordingUrl || ""); setRecordingError(null); }}
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
                  )
                )}
              </div>
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

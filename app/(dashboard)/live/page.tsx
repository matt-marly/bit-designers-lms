"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { Calendar, User, BookOpen, PlayCircle, X, CalendarPlus, CheckCircle, AlertCircle } from "lucide-react";
import { PrimaryButton, OutlineButton } from "@/components/ui/custom";
import { api } from "@/convex/_generated/api";
import { workshopPhase } from "@/convex/lib/workshops";
import { generateICS } from "@/lib/ics-helper";
import { useLearnerTrack } from "@/lib/use-learner-track";
import { useNow } from "@/lib/use-now";
import { hostTimeLabel, sessionDay, sessionTime } from "@/lib/sessions";
import { videoEmbedUrl } from "@/lib/video";
import { LoadingLine, PageMessage, TrackChips } from "@/components/learn/ui";

type LiveSession = NonNullable<FunctionReturnType<typeof api.workshops.listForLearner>>["sessions"][number];

// ---------------------------------------------------------------------------
// Font shortcuts
// ---------------------------------------------------------------------------
const font = {
  display: "var(--font-display), 'Space Grotesk', 'Inter', system-ui, sans-serif",
  body: "var(--font-body), 'Inter', system-ui, -apple-system, sans-serif",
  mono: "var(--font-mono), 'JetBrains Mono', 'SF Mono', monospace",
};

const cardStyle: React.CSSProperties = {
  backgroundColor: "var(--color-bg-surface)",
  border: "1px solid var(--color-border-subtle)",
  borderRadius: 14,
  padding: 24,
  transitionProperty: "border-color, background-color",
  transitionDuration: "var(--duration-fast)",
  transitionTimingFunction: "var(--ease-out-quart)",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatSessionDate(ms: number): string {
  return `${sessionDay(ms)} · ${sessionTime(ms)}`;
}

function formatRecordingDate(ms: number): string {
  return new Date(ms).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }).toUpperCase();
}

type CountdownResult =
  | null
  | "starting-soon"
  | { days: number; hours: number; minutes: number; seconds: number };

function getCountdown(target: number): CountdownResult {
  const now = Date.now();
  const diff = target - now;

  if (diff <= 0) return null;

  // Within 15 minutes = "starting soon"
  const totalMin = Math.floor(diff / 60000);
  if (totalMin <= 15) return "starting-soon";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return { days, hours, minutes, seconds };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function DurationBadge({ minutes }: { minutes: number }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        backgroundColor: "var(--color-bg-surface-2)",
        border: "1px solid var(--color-border-subtle)",
        borderRadius: 999,
        padding: "4px 10px",
        fontFamily: font.mono,
        fontSize: 11,
        lineHeight: "14px",
        fontWeight: 600,
        letterSpacing: "0.10em",
        textTransform: "uppercase",
        color: "var(--color-text-tertiary)",
      }}
    >
      {minutes} MIN
    </span>
  );
}

function ModuleLink({ module: mod }: { module: LiveSession["module"] }) {
  if (!mod) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <BookOpen style={{ width: 13, height: 13, color: "var(--color-text-tertiary)", flexShrink: 0 }} />
      <Link
        href={`/learn/${mod.slug}`}
        style={{
          fontFamily: font.mono,
          fontSize: 11,
          lineHeight: "14px",
          fontWeight: 500,
          textTransform: "uppercase",
          color: "var(--color-text-tertiary)",
          textDecoration: "none",
        }}
      >
        {mod.title}
      </Link>
    </div>
  );
}

function CountdownBlock({ value, label }: { value: number; label: string }) {
  return (
    <div
      className="live-countdown-block"
      style={{
        backgroundColor: "var(--color-bg-surface-2)",
        border: "1px solid var(--color-border-subtle)",
        borderRadius: 10,
        padding: "8px 12px",
        textAlign: "center",
        minWidth: 52,
      }}
    >
      <div
        className="live-countdown-value"
        style={{
          fontFamily: font.display,
          fontSize: 20,
          lineHeight: "26px",
          fontWeight: 600,
          color: "var(--color-text-primary)",
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontFamily: font.mono,
          fontSize: 10,
          lineHeight: "12px",
          fontWeight: 500,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "var(--color-text-tertiary)",
          marginTop: 2,
        }}
      >
        {label}
      </div>
    </div>
  );
}

function CountdownTimer({ session }: { session: LiveSession }) {
  const [countdown, setCountdown] = useState<CountdownResult>(() => getCountdown(session.scheduledAt));

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(getCountdown(session.scheduledAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [session.scheduledAt]);

  if (!countdown) return null;

  if (countdown === "starting-soon") {
    return (
      <div style={{ marginTop: 16 }}>
        <span
          style={{
            fontFamily: font.mono,
            fontSize: 12,
            lineHeight: "14px",
            fontWeight: 500,
            textTransform: "uppercase",
            color: "var(--color-text-secondary)",
          }}
        >
          STARTING SOON
        </span>
      </div>
    );
  }

  const cd = countdown;

  return (
    <div style={{ marginTop: 16 }}>
      <span
        style={{
          fontFamily: font.mono,
          fontSize: 10,
          lineHeight: "12px",
          fontWeight: 500,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "var(--color-text-tertiary)",
        }}
      >
        STARTS IN
      </span>
      <div className="live-countdown-blocks" style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <CountdownBlock value={cd.days} label="DAYS" />
        <CountdownBlock value={cd.hours} label="HRS" />
        <CountdownBlock value={cd.minutes} label="MIN" />
        <CountdownBlock value={cd.seconds} label="SEC" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab
// ---------------------------------------------------------------------------

type TabId = "upcoming" | "recordings";

function TabButton({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "10px 20px",
        fontFamily: font.body,
        fontSize: 14,
        fontWeight: 500,
        color: active ? "var(--color-text-primary)" : "var(--color-text-tertiary)",
        backgroundColor: "transparent",
        border: "none",
        borderBottom: active
          ? "2px solid var(--color-indigo)"
          : "2px solid transparent",
        marginBottom: -1,
        cursor: "pointer",
        transitionProperty: "color",
        transitionDuration: "var(--duration-fast)",
        transitionTimingFunction: "var(--ease-out-quart)",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.color = "var(--color-text-secondary)";
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.color = "var(--color-text-tertiary)";
      }}
    >
      {label}
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          minWidth: 20,
          height: 20,
          borderRadius: 999,
          backgroundColor: "var(--color-bg-surface-3)",
          border: "1px solid var(--color-border-subtle)",
          fontFamily: font.mono,
          fontSize: 10,
          lineHeight: "12px",
          fontWeight: 500,
          letterSpacing: "0.06em",
          color: "var(--color-text-tertiary)",
          padding: "0 5px",
        }}
      >
        {count}
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Upcoming Session Card (no StatusDot — tab communicates context)
// ---------------------------------------------------------------------------

function UpcomingCard({
  session,
  isLive,
  onToast,
}: {
  session: LiveSession;
  isLive: boolean;
  onToast: (message: string, type: "success" | "error") => void;
}) {
  const hostTime = hostTimeLabel(session.scheduledAt, session.timezone);

  return (
    <div
      style={cardStyle}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--color-border-strong)";
        e.currentTarget.style.backgroundColor = "var(--color-bg-surface-2)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--color-border-subtle)";
        e.currentTarget.style.backgroundColor = "var(--color-bg-surface)";
      }}
    >
      <div style={{ display: "flex", justifyContent: isLive ? "space-between" : "flex-end", alignItems: "center" }}>
        {isLive && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontFamily: font.mono,
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.10em",
              textTransform: "uppercase",
              color: "#4ADE80",
            }}
          >
            <span
              aria-hidden
              style={{ width: 6, height: 6, borderRadius: 999, backgroundColor: "#22C55E", animation: "livePulse 1.6s ease-in-out infinite" }}
            />
            Open now
          </span>
        )}
        <DurationBadge minutes={session.durationMinutes} />
      </div>

      {/* Title */}
      <h3
        style={{
          fontFamily: font.display,
          fontSize: 20,
          lineHeight: "26px",
          fontWeight: 600,
          letterSpacing: "-0.01em",
          color: "var(--color-text-primary)",
          margin: 0,
          marginTop: 12,
        }}
      >
        {session.title}
      </h3>

      {session.description && (
        <p
          className="line-clamp-2"
          style={{
            fontFamily: font.body,
            fontSize: "14.5px",
            lineHeight: "22px",
            fontWeight: 400,
            color: "var(--color-text-secondary)",
            margin: 0,
            marginTop: 8,
          }}
        >
          {session.description}
        </p>
      )}

      {/* Meta row */}
      <div className="live-meta-row" style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 20, marginTop: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Calendar style={{ width: 13, height: 13, color: "var(--color-text-tertiary)", flexShrink: 0 }} />
          <span
            style={{
              fontFamily: font.mono,
              fontSize: 12,
              lineHeight: "14px",
              fontWeight: 500,
              textTransform: "uppercase",
              color: "var(--color-text-tertiary)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {formatSessionDate(session.scheduledAt)}
            {hostTime && <span style={{ textTransform: "none" }}> ({hostTime})</span>}
          </span>
        </div>

        {session.hostName && (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <User style={{ width: 13, height: 13, color: "var(--color-text-tertiary)", flexShrink: 0 }} />
            <span
              style={{
                fontFamily: font.body,
                fontSize: 13,
                lineHeight: "19px",
                fontWeight: 400,
                color: "var(--color-text-secondary)",
              }}
            >
              with {session.hostName}
            </span>
          </div>
        )}

        <ModuleLink module={session.module} />
      </div>

      {!isLive && <CountdownTimer session={session} />}

      {/* Action row */}
      <div
        className="live-action-row"
        style={{
          marginTop: 20,
          borderTop: "1px solid var(--color-border-subtle)",
          paddingTop: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <PrimaryButton
          onClick={() => window.open(session.meetingUrl, "_blank", "noopener,noreferrer")}
        >
          {isLive ? "Join now \u2192" : "Join Session"}
        </PrimaryButton>
        <OutlineButton
          icon={CalendarPlus}
          onClick={() => {
            generateICS({
              id: session._id,
              title: session.title,
              description: session.description,
              startsAt: session.scheduledAt,
              endsAt: session.endsAt,
              url: session.meetingUrl,
            });
            onToast("Calendar file downloaded", "success");
          }}
        >
          Add to Calendar
        </OutlineButton>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Recording Card
// ---------------------------------------------------------------------------

function RecordingCard({
  session,
  onWatch,
}: {
  session: LiveSession;
  onWatch: (session: LiveSession) => void;
}) {
  return (
    <div
      style={{
        backgroundColor: "var(--color-bg-surface)",
        border: "1px solid var(--color-border-subtle)",
        borderRadius: 14,
        overflow: "hidden",
        transitionProperty: "border-color, background-color",
        transitionDuration: "var(--duration-fast)",
        transitionTimingFunction: "var(--ease-out-quart)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--color-border-strong)";
        e.currentTarget.style.backgroundColor = "var(--color-bg-surface-2)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--color-border-subtle)";
        e.currentTarget.style.backgroundColor = "var(--color-bg-surface)";
      }}
    >
      {/* Thumbnail */}
      <button
        onClick={() => onWatch(session)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          aspectRatio: "16 / 9",
          backgroundColor: "var(--color-bg-surface-2)",
          cursor: "pointer",
          border: "none",
          borderBottom: "1px solid var(--color-border-subtle)",
          padding: 0,
        }}
        aria-label={`Watch recording: ${session.title}`}
      >
        <PlayCircle
          className="recording-play-icon"
          style={{
            width: 36,
            height: 36,
            color: "var(--color-text-tertiary)",
            transitionProperty: "color",
            transitionDuration: "var(--duration-fast)",
          }}
        />
      </button>

      {/* Card body */}
      <div style={{ padding: 16 }}>
        {/* Top row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span
            style={{
              fontFamily: font.mono,
              fontSize: 10,
              lineHeight: "12px",
              fontWeight: 500,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "var(--color-text-tertiary)",
            }}
          >
            RECORDED
          </span>
          <DurationBadge minutes={session.durationMinutes} />
        </div>

        {/* Title */}
        <h3
          style={{
            fontFamily: font.display,
            fontSize: 15,
            lineHeight: "20px",
            fontWeight: 600,
            color: "var(--color-text-primary)",
            margin: 0,
            marginTop: 8,
          }}
        >
          {session.title}
        </h3>

        {/* Date */}
        <p
          style={{
            fontFamily: font.mono,
            fontSize: 11,
            lineHeight: "14px",
            fontWeight: 500,
            textTransform: "uppercase",
            color: "var(--color-text-tertiary)",
            margin: 0,
            marginTop: 6,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {formatRecordingDate(session.scheduledAt)}
        </p>

        {session.hostName && (
          <p
            style={{
              fontFamily: font.body,
              fontSize: 13,
              lineHeight: "19px",
              fontWeight: 400,
              color: "var(--color-text-secondary)",
              margin: 0,
              marginTop: 4,
            }}
          >
            with {session.hostName}
          </p>
        )}

        {/* Action */}
        <div
          style={{
            marginTop: 12,
            borderTop: "1px solid var(--color-border-subtle)",
            paddingTop: 12,
          }}
        >
          <OutlineButton fullWidth onClick={() => onWatch(session)}>
            Watch Recording
          </OutlineButton>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Recording Modal
// ---------------------------------------------------------------------------

function RecordingModal({
  session,
  onClose,
}: {
  session: LiveSession;
  onClose: () => void;
}) {
  const embedUrl = session.recordingUrl ? videoEmbedUrl(session.recordingUrl) : null;

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.85)",
        zIndex: 50,
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        paddingTop: "5vh",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 860,
          width: "90vw",
          backgroundColor: "var(--color-bg-surface)",
          border: "1px solid var(--color-border-subtle)",
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        {/* Modal header */}
        <div
          style={{
            padding: "14px 20px",
            borderBottom: "1px solid var(--color-border-subtle)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontFamily: font.body,
              fontSize: 14,
              fontWeight: 500,
              color: "var(--color-text-primary)",
            }}
          >
            {session.title}
          </span>
          <button
            onClick={onClose}
            aria-label="Close modal"
            style={{
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "transparent",
              border: "none",
              borderRadius: 10,
              cursor: "pointer",
              color: "var(--color-text-tertiary)",
              transitionProperty: "background-color, color",
              transitionDuration: "var(--duration-fast)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)";
              e.currentTarget.style.color = "var(--color-text-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "var(--color-text-tertiary)";
            }}
          >
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        <div style={{ aspectRatio: "16 / 9", width: "100%", backgroundColor: "#000" }}>
          {embedUrl ? (
            <iframe
              src={embedUrl}
              title={session.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ width: "100%", height: "100%", border: "none" }}
            />
          ) : (
            <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <a
                href={session.recordingUrl ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontFamily: font.body, fontSize: 14, color: "#A5B4FC" }}
              >
                Open the recording in a new tab
              </a>
            </div>
          )}
        </div>

        {/* Modal footer */}
        <div style={{ padding: "16px 20px" }}>
          {session.description && (
            <p
              style={{
                fontFamily: font.body,
                fontSize: "14.5px",
                lineHeight: "22px",
                fontWeight: 400,
                color: "var(--color-text-secondary)",
                margin: "0 0 12px",
              }}
            >
              {session.description}
            </p>
          )}
          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Calendar style={{ width: 13, height: 13, color: "var(--color-text-tertiary)" }} />
              <span
                style={{
                  fontFamily: font.mono,
                  fontSize: 11,
                  lineHeight: "14px",
                  fontWeight: 500,
                  textTransform: "uppercase",
                  color: "var(--color-text-tertiary)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {formatRecordingDate(session.scheduledAt)}
              </span>
            </div>
            {session.hostName && (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <User style={{ width: 13, height: 13, color: "var(--color-text-tertiary)" }} />
                <span
                  style={{
                    fontFamily: font.body,
                    fontSize: 13,
                    lineHeight: "19px",
                    fontWeight: 400,
                    color: "var(--color-text-secondary)",
                  }}
                >
                  with {session.hostName}
                </span>
              </div>
            )}
            <ModuleLink module={session.module} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function LivePage() {
  const [activeTab, setActiveTab] = useState<TabId>("upcoming");
  const [modalSession, setModalSession] = useState<LiveSession | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const handleCloseModal = useCallback(() => setModalSession(null), []);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const { loading, tracks, track, selectTrack } = useLearnerTrack();
  const data = useQuery(api.workshops.listForLearner, track ? { trackId: track.trackId } : "skip");
  const now = useNow(30_000);

  if (loading || (track && data === undefined)) {
    return (
      <div className="px-8 py-12 max-md:px-5 max-md:py-6" style={{ maxWidth: 880, margin: "0 auto" }}>
        <LoadingLine>Loading sessions…</LoadingLine>
      </div>
    );
  }
  if (!track || !data) {
    return <PageMessage title="No live sessions yet" body="Sessions appear here once you're part of a track." />;
  }

  const sessions = data.sessions;
  const upcoming = sessions
    .filter((s) => workshopPhase(s.scheduledAt, s.endsAt, now) !== "past")
    .sort((a, b) => a.scheduledAt - b.scheduledAt);
  const recordings = sessions
    .filter((s) => s.recordingUrl !== null && workshopPhase(s.scheduledAt, s.endsAt, now) === "past")
    .sort((a, b) => b.scheduledAt - a.scheduledAt);
  const subtitle = [data.cohort?.name, track.name].filter(Boolean).join(" · ");

  return (
    <>
      <style>{`
        @keyframes livePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .recording-play-icon {
          transition: color var(--duration-fast) ease;
        }
        button:hover .recording-play-icon {
          color: var(--color-text-primary) !important;
        }
        @media (max-width: 768px) {
          .live-page-title { font-size: 32px !important; }
          .live-tab-bar { display: flex !important; }
          .live-tab-bar > button { flex: 1 !important; font-size: 13px !important; }
          .live-action-row { flex-direction: column !important; gap: 10px !important; }
          .live-action-row > * { width: 100%; }
          .live-countdown-blocks { gap: 6px !important; }
          .live-countdown-block { min-width: 44px !important; padding: 6px 8px !important; }
          .live-countdown-value { font-size: 16px !important; line-height: 22px !important; }
          .live-meta-row { flex-direction: column !important; gap: 8px !important; }
        }
      `}</style>

      <div
        className="px-8 py-12 md:px-8 md:py-12 max-md:px-5 max-md:py-6"
        style={{ maxWidth: 880, margin: "0 auto" }}
      >
        {/* ── PAGE HEADER — 44px title like Missions ── */}
        <header>
          <h1
            className="live-page-title"
            style={{
              fontFamily: font.display,
              fontSize: 44,
              lineHeight: 1.1,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: "var(--color-text-primary)",
              margin: 0,
            }}
          >
            Live
          </h1>
          <p
            style={{
              fontFamily: font.mono,
              fontSize: 13,
              lineHeight: "18px",
              fontWeight: 500,
              letterSpacing: "0",
              textTransform: "uppercase",
              color: "var(--color-text-tertiary)",
              marginTop: 10,
            }}
          >
            {subtitle}
          </p>
        </header>

        {tracks.length > 1 && (
          <div style={{ marginTop: 20 }}>
            <TrackChips tracks={tracks} selectedId={track.trackId} onSelect={selectTrack} />
          </div>
        )}

        {/* ── TAB BAR ── */}
        <div
          className="live-tab-bar"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 0,
            marginTop: 24,
            borderBottom: "1px solid var(--color-border-subtle)",
          }}
        >
          <TabButton
            label="Upcoming"
            count={upcoming.length}
            active={activeTab === "upcoming"}
            onClick={() => setActiveTab("upcoming")}
          />
          <TabButton
            label="Recordings"
            count={recordings.length}
            active={activeTab === "recordings"}
            onClick={() => setActiveTab("recordings")}
          />
        </div>

        {/* ── TAB CONTENT ── */}
        <div style={{ marginTop: 32 }}>
          {activeTab === "upcoming" && (
            upcoming.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {upcoming.map((session) => (
                  <UpcomingCard
                    key={session._id}
                    session={session}
                    isLive={workshopPhase(session.scheduledAt, session.endsAt, now) === "live"}
                    onToast={showToast}
                  />
                ))}
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "48px 24px",
                  maxWidth: 360,
                  margin: "0 auto",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: "50%",
                    backgroundColor: "var(--color-bg-surface-2)",
                    border: "1px solid var(--color-border-subtle)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Calendar style={{ width: 32, height: 32, color: "var(--color-text-tertiary)" }} />
                </div>
                <p
                  style={{
                    fontFamily: font.body,
                    fontSize: 16,
                    lineHeight: "22px",
                    fontWeight: 500,
                    color: "var(--color-text-primary)",
                    margin: 0,
                    marginTop: 20,
                  }}
                >
                  No sessions scheduled
                </p>
                <p
                  style={{
                    fontFamily: font.body,
                    fontSize: 14,
                    lineHeight: "22px",
                    fontWeight: 400,
                    color: "var(--color-text-tertiary)",
                    margin: 0,
                    marginTop: 8,
                  }}
                >
                  Check back soon for upcoming live sessions.
                </p>
              </div>
            )
          )}

          {activeTab === "recordings" && (
            recordings.length > 0 ? (
              <div
                className="grid grid-cols-1 md:grid-cols-2"
                style={{ gap: 16 }}
              >
                {recordings.map((session) => (
                  <RecordingCard
                    key={session._id}
                    session={session}
                    onWatch={setModalSession}
                  />
                ))}
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "48px 24px",
                  maxWidth: 360,
                  margin: "0 auto",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: "50%",
                    backgroundColor: "var(--color-bg-surface-2)",
                    border: "1px solid var(--color-border-subtle)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <PlayCircle style={{ width: 32, height: 32, color: "var(--color-text-tertiary)" }} />
                </div>
                <p
                  style={{
                    fontFamily: font.body,
                    fontSize: 16,
                    lineHeight: "22px",
                    fontWeight: 500,
                    color: "var(--color-text-primary)",
                    margin: 0,
                    marginTop: 20,
                  }}
                >
                  No recordings yet
                </p>
                <p
                  style={{
                    fontFamily: font.body,
                    fontSize: 14,
                    lineHeight: "22px",
                    fontWeight: 400,
                    color: "var(--color-text-tertiary)",
                    margin: 0,
                    marginTop: 8,
                  }}
                >
                  Recordings will appear here after sessions end.
                </p>
              </div>
            )
          )}
        </div>
      </div>

      {/* Recording Modal */}
      {modalSession && (
        <RecordingModal session={modalSession} onClose={handleCloseModal} />
      )}

      {/* Toast notification */}
      {toast && (
        <div
          role={toast.type === "error" ? "alert" : "status"}
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            backgroundColor: "#181818",
            border: "1px solid #333333",
            borderRadius: 10,
            padding: "14px 16px",
            boxShadow: "0 16px 40px rgba(0,0,0,0.55)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            gap: 10,
            maxWidth: 360,
          }}
        >
          {toast.type === "success" ? (
            <CheckCircle
              style={{ width: 18, height: 18, color: "#22C55E", flexShrink: 0 }}
            />
          ) : (
            <AlertCircle
              style={{ width: 18, height: 18, color: "#EF4444", flexShrink: 0 }}
            />
          )}
          <span
            style={{
              fontFamily: font.body,
              fontSize: "14.5px",
              lineHeight: "22px",
              fontWeight: 500,
              color: "#FFFFFF",
            }}
          >
            {toast.message}
          </span>
        </div>
      )}
    </>
  );
}

"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { workshopPhase, WORKSHOP_LIMITS, type WorkshopPhase } from "@/convex/lib/workshops";
import {
  ConfirmStrip,
  SectionHeader,
  StatusBadge,
  Toast,
  cardStyle,
  controlStyle,
  errorMessage,
  fieldLabelStyle,
  focusHandlers,
  font,
  ghostButtonStyle,
  smallButtonStyle,
  toDateInput,
  useToast,
  type ShowToast,
} from "@/components/admin/ui";
import { useNow } from "@/lib/use-now";
import {
  durationLabel,
  fromDateTimeInputs,
  hostTimeLabel,
  sessionDay,
  sessionTime,
  toTimeInput,
  viewerTimezone,
} from "@/lib/sessions";

type AdminData = FunctionReturnType<typeof api.workshops.listForAdmin>;
type AdminSession = AdminData["sessions"][number];
type AdminTrack = AdminData["tracks"][number];

const DURATIONS = [30, 45, 60, 90, 120, 180];

const phaseBadge: Record<WorkshopPhase, { tone: "indigo" | "success" | "neutral"; label: string }> = {
  upcoming: { tone: "indigo", label: "Upcoming" },
  live: { tone: "success", label: "Live" },
  past: { tone: "neutral", label: "Past" },
};

type FormState = {
  cohortId: string;
  title: string;
  description: string;
  date: string;
  time: string;
  durationMinutes: number;
  hostName: string;
  moduleId: string;
  meetingUrl: string;
};

const emptyForm = (cohortId = ""): FormState => ({
  cohortId,
  title: "",
  description: "",
  date: "",
  time: "",
  durationMinutes: 60,
  hostName: "",
  moduleId: "",
  meetingUrl: "",
});

function formFromSession(s: AdminSession): FormState {
  return {
    cohortId: s.cohortId,
    title: s.title,
    description: s.description ?? "",
    date: toDateInput(s.scheduledAt),
    time: toTimeInput(s.scheduledAt),
    durationMinutes: s.durationMinutes,
    hostName: s.hostName ?? "",
    moduleId: s.module?._id ?? "",
    meetingUrl: s.meetingUrl,
  };
}

function schedulableCohorts(track: AdminTrack) {
  return track.cohorts.filter((c) => c.status === "draft" || c.status === "active");
}

export default function SessionsPage() {
  const data = useQuery(api.workshops.listForAdmin, {});
  const { toast, showToast } = useToast();
  const [editing, setEditing] = useState<AdminSession | null>(null);
  const now = useNow(30_000);

  if (data === undefined) {
    return <p style={{ fontFamily: font.body, fontSize: 14, color: "var(--color-text-tertiary)" }}>Loading sessions…</p>;
  }

  const upcoming = data.sessions
    .filter((s) => workshopPhase(s.scheduledAt, s.endsAt, now) !== "past")
    .sort((a, b) => a.scheduledAt - b.scheduledAt);
  const past = data.sessions.filter((s) => workshopPhase(s.scheduledAt, s.endsAt, now) === "past");
  const showTrack = data.tracks.length > 1;

  return (
    <div>
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
      <p style={{ fontFamily: font.body, fontSize: 15, color: "var(--color-text-secondary)", margin: "8px 0 32px" }}>
        Schedule live sessions for a cohort. Learners see them on their Live page in their own timezone.
      </p>

      {data.tracks.length === 0 ? (
        <div style={{ ...cardStyle, padding: 24 }}>
          <p style={{ fontFamily: font.body, fontSize: 14, color: "var(--color-text-secondary)", margin: 0 }}>
            You can&apos;t schedule sessions for any track yet.
          </p>
        </div>
      ) : (
        <SessionForm
          key={editing?._id ?? "new"}
          tracks={data.tracks}
          editing={editing}
          onDone={() => setEditing(null)}
          showToast={showToast}
        />
      )}

      <section style={{ marginTop: 40 }}>
        <SectionHeader title="Upcoming" meta={upcoming.length} />
        <SessionList
          sessions={upcoming}
          now={now}
          showTrack={showTrack}
          empty="No upcoming sessions."
          onEdit={(s) => {
            setEditing(s);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          showToast={showToast}
        />
      </section>

      <section style={{ marginTop: 40 }}>
        <SectionHeader title="Past" meta={past.length} />
        <SessionList
          sessions={past}
          now={now}
          showTrack={showTrack}
          empty="Past sessions will appear here. Add a recording link once one is ready."
          onEdit={(s) => {
            setEditing(s);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          showToast={showToast}
        />
      </section>

      <Toast toast={toast} />
    </div>
  );
}

function SessionForm({
  tracks,
  editing,
  onDone,
  showToast,
}: {
  tracks: AdminTrack[];
  editing: AdminSession | null;
  onDone: () => void;
  showToast: ShowToast;
}) {
  const create = useMutation(api.workshops.create);
  const update = useMutation(api.workshops.update);
  const firstCohort = tracks.flatMap(schedulableCohorts)[0]?._id ?? "";
  const [form, setForm] = useState<FormState>(() => (editing ? formFromSession(editing) : emptyForm(firstCohort)));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));
  const track = tracks.find((t) => t.cohorts.some((c) => c._id === form.cohortId));
  const scheduledAt = fromDateTimeInputs(form.date, form.time);
  const canSave = form.cohortId !== "" && form.title.trim() !== "" && scheduledAt !== null && form.meetingUrl.trim() !== "";
  const timezone = viewerTimezone();

  async function save() {
    if (!canSave || scheduledAt === null) return;
    setSaving(true);
    setError(null);
    const fields = {
      cohortId: form.cohortId as Id<"cohorts">,
      title: form.title,
      description: form.description,
      scheduledAt,
      durationMinutes: form.durationMinutes,
      timezone,
      meetingUrl: form.meetingUrl,
      hostName: form.hostName,
      moduleId: form.moduleId ? (form.moduleId as Id<"modules">) : undefined,
    };
    try {
      if (editing) {
        await update({ workshopId: editing._id, ...fields });
        showToast("Session updated");
        onDone();
      } else {
        await create(fields);
        showToast("Session scheduled. The cohort has been notified.");
        setForm(emptyForm(form.cohortId));
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ ...cardStyle, padding: 24 }}>
      <h2 style={{ ...fieldLabelStyle, color: "var(--color-text-tertiary)", marginBottom: 20 }}>
        {editing ? "Edit session" : "Schedule new session"}
      </h2>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
        <Field label="Cohort" htmlFor="session-cohort">
          <select
            id="session-cohort"
            value={form.cohortId}
            onChange={(e) => setForm((f) => ({ ...f, cohortId: e.target.value, moduleId: "" }))}
            style={{ ...controlStyle, cursor: "pointer" }}
            {...focusHandlers}
          >
            {form.cohortId === "" && <option value="">Pick a cohort</option>}
            {tracks.map((t) => {
              const cohorts = schedulableCohorts(t);
              const current = editing && t.cohorts.find((c) => c._id === editing.cohortId && !cohorts.includes(c));
              const options = current ? [...cohorts, current] : cohorts;
              if (options.length === 0) return null;
              return (
                <optgroup key={t._id} label={t.name}>
                  {options.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </optgroup>
              );
            })}
          </select>
        </Field>
        <Field label="Title" htmlFor="session-title">
          <input
            id="session-title"
            value={form.title}
            maxLength={WORKSHOP_LIMITS.title}
            placeholder="Critique: wireframes"
            onChange={(e) => set("title", e.target.value)}
            style={controlStyle}
            {...focusHandlers}
          />
        </Field>
      </div>

      <div style={{ marginTop: 16 }}>
        <Field label="Description" htmlFor="session-description">
          <textarea
            id="session-description"
            rows={3}
            value={form.description}
            maxLength={WORKSHOP_LIMITS.description}
            placeholder="What you'll cover and anything to prepare"
            onChange={(e) => set("description", e.target.value)}
            style={{ ...controlStyle, height: "auto", padding: "10px 14px", lineHeight: "22px", resize: "vertical" }}
            {...focusHandlers}
          />
        </Field>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginTop: 16 }}>
        <Field label="Date" htmlFor="session-date">
          <input
            id="session-date"
            type="date"
            value={form.date}
            onChange={(e) => set("date", e.target.value)}
            style={controlStyle}
            {...focusHandlers}
          />
        </Field>
        <Field label="Start time" htmlFor="session-time">
          <input
            id="session-time"
            type="time"
            value={form.time}
            onChange={(e) => set("time", e.target.value)}
            style={controlStyle}
            {...focusHandlers}
          />
        </Field>
        <Field label="Duration" htmlFor="session-duration">
          <select
            id="session-duration"
            value={form.durationMinutes}
            onChange={(e) => set("durationMinutes", Number(e.target.value))}
            style={{ ...controlStyle, cursor: "pointer" }}
            {...focusHandlers}
          >
            {(DURATIONS.includes(form.durationMinutes) ? DURATIONS : [...DURATIONS, form.durationMinutes].sort((a, b) => a - b)).map(
              (d) => (
                <option key={d} value={d}>
                  {durationLabel(d)}
                </option>
              ),
            )}
          </select>
        </Field>
      </div>
      <p style={{ fontFamily: font.body, fontSize: 12, color: "var(--color-text-tertiary)", margin: "8px 0 0" }}>
        Times are in your timezone ({timezone}).
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginTop: 16 }}>
        <Field label="Host (optional)" htmlFor="session-host">
          <input
            id="session-host"
            value={form.hostName}
            maxLength={WORKSHOP_LIMITS.hostName}
            placeholder="Who's leading it"
            onChange={(e) => set("hostName", e.target.value)}
            style={controlStyle}
            {...focusHandlers}
          />
        </Field>
        <Field label="Related module (optional)" htmlFor="session-module">
          <select
            id="session-module"
            value={form.moduleId}
            onChange={(e) => set("moduleId", e.target.value)}
            style={{ ...controlStyle, cursor: "pointer" }}
            disabled={!track}
            {...focusHandlers}
          >
            <option value="">None</option>
            {track?.modules.map((m) => (
              <option key={m._id} value={m._id}>
                {m.title}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div style={{ marginTop: 16 }}>
        <Field label="Meeting link" htmlFor="session-link">
          <input
            id="session-link"
            type="url"
            inputMode="url"
            value={form.meetingUrl}
            placeholder="https://meet.google.com/..."
            onChange={(e) => set("meetingUrl", e.target.value)}
            style={controlStyle}
            {...focusHandlers}
          />
        </Field>
      </div>

      {error && (
        <p role="alert" style={{ fontFamily: font.body, fontSize: 13, color: "#F87171", margin: "16px 0 0" }}>
          {error}
        </p>
      )}

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", alignItems: "center", marginTop: 20, flexWrap: "wrap" }}>
        {!canSave && (
          <span style={{ fontFamily: font.body, fontSize: 12, color: "var(--color-text-tertiary)", marginRight: "auto" }}>
            Add a cohort, title, date, time and meeting link.
          </span>
        )}
        {editing && (
          <button type="button" style={ghostButtonStyle} onClick={onDone} disabled={saving}>
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={save}
          disabled={!canSave || saving}
          style={{
            ...smallButtonStyle,
            height: 36,
            padding: "0 16px",
            backgroundColor: "var(--color-indigo)",
            borderColor: "var(--color-indigo)",
            color: "#fff",
            opacity: !canSave || saving ? 0.5 : 1,
            cursor: !canSave || saving ? "not-allowed" : "pointer",
          }}
        >
          {saving ? "Saving…" : editing ? "Save changes" : "Schedule session"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} style={fieldLabelStyle}>
        {label}
      </label>
      {children}
    </div>
  );
}

function SessionList({
  sessions,
  now,
  showTrack,
  empty,
  onEdit,
  showToast,
}: {
  sessions: AdminSession[];
  now: number;
  showTrack: boolean;
  empty: string;
  onEdit: (session: AdminSession) => void;
  showToast: ShowToast;
}) {
  if (sessions.length === 0) {
    return (
      <div style={{ ...cardStyle, padding: 20 }}>
        <p style={{ fontFamily: font.body, fontSize: 14, color: "var(--color-text-tertiary)", margin: 0 }}>{empty}</p>
      </div>
    );
  }
  return (
    <div style={{ ...cardStyle, overflow: "hidden" }}>
      {sessions.map((s, i) => (
        <SessionRow
          key={s._id}
          session={s}
          phase={workshopPhase(s.scheduledAt, s.endsAt, now)}
          showTrack={showTrack}
          first={i === 0}
          onEdit={() => onEdit(s)}
          showToast={showToast}
        />
      ))}
    </div>
  );
}

function SessionRow({
  session,
  phase,
  showTrack,
  first,
  onEdit,
  showToast,
}: {
  session: AdminSession;
  phase: WorkshopPhase;
  showTrack: boolean;
  first: boolean;
  onEdit: () => void;
  showToast: ShowToast;
}) {
  const cancel = useMutation(api.workshops.cancel);
  const setRecording = useMutation(api.workshops.setRecording);
  const [confirming, setConfirming] = useState(false);
  const [recordingOpen, setRecordingOpen] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState("");
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const hostTime = hostTimeLabel(session.scheduledAt, session.timezone);
  const badge = phaseBadge[phase];

  async function handleCancel() {
    setBusy(true);
    try {
      await cancel({ workshopId: session._id });
      showToast("Session cancelled");
    } catch (err) {
      showToast(errorMessage(err), "error");
      setBusy(false);
    }
  }

  async function saveRecording(url: string | null) {
    setBusy(true);
    setRecordingError(null);
    try {
      await setRecording({ workshopId: session._id, recordingUrl: url });
      showToast(url ? "Recording saved" : "Recording removed");
      setRecordingOpen(false);
    } catch (err) {
      setRecordingError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const meta = [session.cohortName, durationLabel(session.durationMinutes), session.hostName && `with ${session.hostName}`]
    .filter(Boolean)
    .join(" · ");

  return (
    <div style={{ borderTop: first ? "none" : "1px solid var(--color-border-subtle)" }}>
      <div style={{ padding: "16px 20px", display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0, flex: "1 1 280px" }}>
          <span style={{ fontFamily: font.body, fontSize: 14, fontWeight: 500, color: "var(--color-text-primary)" }}>
            {session.title}
          </span>
          <span style={{ fontFamily: font.mono, fontSize: 12, color: "var(--color-text-secondary)", fontVariantNumeric: "tabular-nums" }}>
            {sessionDay(session.scheduledAt)} · {sessionTime(session.scheduledAt)}
            {hostTime && <span style={{ color: "var(--color-text-tertiary)" }}> ({hostTime})</span>}
          </span>
          <span style={{ fontFamily: font.body, fontSize: 13, color: "var(--color-text-tertiary)" }}>
            {showTrack ? `${session.trackName} · ${meta}` : meta}
          </span>
        </div>
        <StatusBadge tone={badge.tone}>{session.recordingUrl ? "Recorded" : badge.label}</StatusBadge>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {phase === "past" ? (
            <button
              type="button"
              style={smallButtonStyle}
              onClick={() => {
                setRecordingUrl(session.recordingUrl ?? "");
                setRecordingError(null);
                setRecordingOpen((o) => !o);
              }}
            >
              {session.recordingUrl ? "Edit recording" : "Add recording"}
            </button>
          ) : (
            <a href={session.meetingUrl} target="_blank" rel="noopener noreferrer" style={{ ...smallButtonStyle, display: "inline-flex", alignItems: "center", textDecoration: "none" }}>
              Open link
            </a>
          )}
          <button type="button" style={smallButtonStyle} onClick={onEdit}>
            Edit
          </button>
          {phase !== "past" && (
            <button type="button" style={ghostButtonStyle} onClick={() => setConfirming(true)}>
              Cancel
            </button>
          )}
        </div>
      </div>

      {confirming && (
        <ConfirmStrip
          message="Cancel this session? It will disappear from the cohort's Live page."
          confirmLabel="Yes, cancel session"
          danger
          busy={busy}
          onConfirm={handleCancel}
          onCancel={() => setConfirming(false)}
        />
      )}

      {recordingOpen && (
        <div style={{ padding: "4px 20px 16px", backgroundColor: "#141414" }}>
          <label htmlFor={`recording-${session._id}`} style={fieldLabelStyle}>
            Recording link (YouTube or Vimeo)
          </label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input
              id={`recording-${session._id}`}
              type="url"
              inputMode="url"
              value={recordingUrl}
              placeholder="https://youtube.com/watch?v=..."
              onChange={(e) => setRecordingUrl(e.target.value)}
              style={{ ...controlStyle, flex: "1 1 280px", width: "auto" }}
              {...focusHandlers}
            />
            <button
              type="button"
              disabled={busy || !recordingUrl.trim()}
              onClick={() => saveRecording(recordingUrl)}
              style={{
                ...smallButtonStyle,
                height: 40,
                backgroundColor: "var(--color-indigo)",
                borderColor: "var(--color-indigo)",
                color: "#fff",
                opacity: busy || !recordingUrl.trim() ? 0.5 : 1,
              }}
            >
              Save
            </button>
            {session.recordingUrl && (
              <button type="button" disabled={busy} style={{ ...ghostButtonStyle, height: 40 }} onClick={() => saveRecording(null)}>
                Remove
              </button>
            )}
          </div>
          {recordingError && (
            <p role="alert" style={{ fontFamily: font.body, fontSize: 12, color: "#F87171", margin: "6px 0 0" }}>
              {recordingError}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

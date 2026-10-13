"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { ANNOUNCEMENT_LIMITS } from "@/convex/lib/announcements";
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
  useToast,
  type ShowToast,
} from "@/components/admin/ui";
import { Markdown } from "@/components/markdown";
import { useNow } from "@/lib/use-now";
import { relativeTime } from "@/lib/time";

type AdminAnnouncement = FunctionReturnType<typeof api.announcements.listForAdmin>["announcements"][number];

const GLOBAL = "global";

export default function AnnouncementsPage() {
  const data = useQuery(api.announcements.listForAdmin, {});
  const { toast, showToast } = useToast();
  const now = useNow(60_000);

  if (data === undefined) {
    return <p style={{ fontFamily: font.body, fontSize: 14, color: "var(--color-text-tertiary)" }}>Loading announcements…</p>;
  }

  const canPost = data.canPostGlobal || data.cohorts.length > 0;

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
        Announcements
      </h1>
      <p style={{ fontFamily: font.body, fontSize: 15, color: "var(--color-text-secondary)", margin: "8px 0 32px" }}>
        Post updates to everyone or to a single cohort. Learners see them on Home and get a notification.
      </p>

      {canPost ? (
        <ComposeForm data={data} showToast={showToast} />
      ) : (
        <div style={{ ...cardStyle, padding: 24 }}>
          <p style={{ fontFamily: font.body, fontSize: 14, color: "var(--color-text-secondary)", margin: 0 }}>
            You can&apos;t post announcements yet.
          </p>
        </div>
      )}

      <section style={{ marginTop: 40 }}>
        <SectionHeader title="Published" meta={data.announcements.length} />
        {data.announcements.length === 0 ? (
          <div style={{ ...cardStyle, padding: 20 }}>
            <p style={{ fontFamily: font.body, fontSize: 14, color: "var(--color-text-tertiary)", margin: 0 }}>
              No announcements published yet.
            </p>
          </div>
        ) : (
          <div style={{ ...cardStyle, overflow: "hidden" }}>
            {data.announcements.map((a, i) => (
              <AnnouncementRow key={a._id} announcement={a} first={i === 0} now={now} showToast={showToast} />
            ))}
          </div>
        )}
      </section>

      <Toast toast={toast} />
    </div>
  );
}

function ComposeForm({
  data,
  showToast,
}: {
  data: FunctionReturnType<typeof api.announcements.listForAdmin>;
  showToast: ShowToast;
}) {
  const create = useMutation(api.announcements.create);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<string>(data.canPostGlobal ? GLOBAL : (data.cohorts[0]?._id ?? ""));
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canPublish = title.trim() !== "" && body.trim() !== "" && audience !== "";

  async function publish() {
    if (!canPublish) return;
    setSaving(true);
    setError(null);
    try {
      await create(
        audience === GLOBAL
          ? { title, body, scope: "global" }
          : { title, body, scope: "cohort", cohortId: audience as Id<"cohorts"> },
      );
      setTitle("");
      setBody("");
      setPreview(false);
      showToast("Announcement published");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ ...cardStyle, padding: 24 }}>
      <h2 style={{ ...fieldLabelStyle, color: "var(--color-text-tertiary)", marginBottom: 20 }}>New announcement</h2>

      <label htmlFor="announcement-audience" style={fieldLabelStyle}>
        Send to
      </label>
      <select
        id="announcement-audience"
        value={audience}
        onChange={(e) => setAudience(e.target.value)}
        style={{ ...controlStyle, cursor: "pointer", maxWidth: 420 }}
        {...focusHandlers}
      >
        {data.canPostGlobal && <option value={GLOBAL}>Everyone (all tracks)</option>}
        {data.cohorts.map((c) => (
          <option key={c._id} value={c._id}>
            {c.trackName} · {c.name}
            {c.ended ? " (ended)" : ""}
          </option>
        ))}
      </select>

      <div style={{ marginTop: 16 }}>
        <label htmlFor="announcement-title" style={fieldLabelStyle}>
          Title
        </label>
        <input
          id="announcement-title"
          value={title}
          maxLength={ANNOUNCEMENT_LIMITS.title}
          placeholder="Week 3 mission brief is up"
          onChange={(e) => setTitle(e.target.value)}
          style={controlStyle}
          {...focusHandlers}
        />
      </div>

      <div style={{ marginTop: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <label htmlFor="announcement-body" style={fieldLabelStyle}>
            Message
          </label>
          <button
            type="button"
            style={{ ...ghostButtonStyle, height: 24, marginBottom: 8 }}
            onClick={() => setPreview((p) => !p)}
            disabled={!body.trim()}
          >
            {preview ? "Edit" : "Preview"}
          </button>
        </div>
        {preview ? (
          <div style={{ ...controlStyle, height: "auto", minHeight: 120, padding: "12px 14px" }}>
            <Markdown>{body}</Markdown>
          </div>
        ) : (
          <textarea
            id="announcement-body"
            rows={6}
            value={body}
            maxLength={ANNOUNCEMENT_LIMITS.body}
            placeholder="Write your announcement. Markdown works: **bold**, lists and links."
            onChange={(e) => setBody(e.target.value)}
            style={{ ...controlStyle, height: "auto", padding: "12px 14px", lineHeight: "22px", resize: "vertical" }}
            {...focusHandlers}
          />
        )}
      </div>

      {error && (
        <p role="alert" style={{ fontFamily: font.body, fontSize: 13, color: "#F87171", margin: "16px 0 0" }}>
          {error}
        </p>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
        <button
          type="button"
          onClick={publish}
          disabled={!canPublish || saving}
          style={{
            ...smallButtonStyle,
            height: 36,
            padding: "0 16px",
            backgroundColor: "var(--color-indigo)",
            borderColor: "var(--color-indigo)",
            color: "#fff",
            opacity: !canPublish || saving ? 0.5 : 1,
            cursor: !canPublish || saving ? "not-allowed" : "pointer",
          }}
        >
          {saving ? "Publishing…" : "Publish announcement"}
        </button>
      </div>
    </div>
  );
}

function AnnouncementRow({
  announcement: a,
  first,
  now,
  showToast,
}: {
  announcement: AdminAnnouncement;
  first: boolean;
  now: number;
  showToast: ShowToast;
}) {
  const remove = useMutation(api.announcements.remove);
  const [expanded, setExpanded] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    setBusy(true);
    try {
      await remove({ announcementId: a._id });
      showToast("Announcement deleted");
    } catch (err) {
      showToast(errorMessage(err), "error");
      setBusy(false);
    }
  }

  return (
    <div style={{ borderTop: first ? "none" : "1px solid var(--color-border-subtle)" }}>
      <div style={{ padding: "16px 20px", display: "flex", gap: 16, alignItems: "flex-start" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: font.body, fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)", margin: 0 }}>{a.title}</p>
          {expanded ? (
            <div style={{ marginTop: 8 }}>
              <Markdown>{a.body}</Markdown>
            </div>
          ) : (
            <p
              style={{
                fontFamily: font.body,
                fontSize: 13,
                color: "var(--color-text-secondary)",
                margin: "4px 0 0",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {a.body}
            </p>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
            <StatusBadge tone={a.scope === "global" ? "indigo" : "neutral"}>{a.audience}</StatusBadge>
            <span style={{ fontFamily: font.mono, fontSize: 11, color: "var(--color-text-tertiary)" }}>
              {relativeTime(a.createdAt, now)}
              {a.authorName ? ` · by ${a.authorName}` : ""}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <button type="button" style={ghostButtonStyle} onClick={() => setExpanded((e) => !e)}>
            {expanded ? "Collapse" : "Expand"}
          </button>
          {a.canDelete && (
            <button type="button" style={smallButtonStyle} onClick={() => setConfirming(true)}>
              Delete
            </button>
          )}
        </div>
      </div>
      {confirming && (
        <ConfirmStrip
          message="Delete this announcement? Learners won't see it anymore."
          confirmLabel="Delete"
          danger
          busy={busy}
          onConfirm={handleDelete}
          onCancel={() => setConfirming(false)}
        />
      )}
    </div>
  );
}

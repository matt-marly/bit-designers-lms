"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ChevronDown, ExternalLink, Paperclip } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "@/convex/_generated/api";
import {
  StatusBadge,
  cardStyle,
  errorMessage,
  focusHandlers,
  font,
  formatDate,
  ghostButtonStyle,
  smallButtonStyle,
  type BadgeTone,
  type ShowToast,
} from "../ui";
import { textareaStyle } from "../curriculum/shared";

export type QueueEntry = FunctionReturnType<typeof api.reviews.queue>[number];
type Outcome = "passed" | "needs_revision";

const COMMENT_LIMIT = 5000;

const statusBadge: Record<QueueEntry["status"], { tone: BadgeTone; label: string }> = {
  submitted: { tone: "indigo", label: "Waiting" },
  in_review: { tone: "indigo", label: "In review" },
  passed: { tone: "success", label: "Passed" },
  needs_revision: { tone: "warning", label: "Needs revision" },
};

const monoMeta: React.CSSProperties = {
  fontFamily: font.mono,
  fontSize: 11,
  lineHeight: "14px",
  fontWeight: 500,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "var(--color-text-tertiary)",
  margin: 0,
};

export function timeAgo(ms: number): string {
  const diff = Date.now() - ms;
  const days = Math.floor(diff / 86_400_000);
  if (days > 30) return formatDate(ms);
  if (days > 0) return `${days}d ago`;
  const hours = Math.floor(diff / 3_600_000);
  if (hours > 0) return `${hours}h ago`;
  const mins = Math.floor(diff / 60_000);
  return mins > 0 ? `${mins}m ago` : "just now";
}

function displayUrl(url: string, max = 60) {
  const stripped = url.replace(/^https?:\/\//, "");
  return stripped.length <= max ? stripped : `${stripped.slice(0, max)}…`;
}

export function ReviewCard({ entry, onToast }: { entry: QueueEntry; onToast: ShowToast }) {
  const startReview = useMutation(api.reviews.startReview);
  const submitReview = useMutation(api.reviews.review);
  const [formOpen, setFormOpen] = useState(entry.status === "in_review" && entry.reviewer?.isMe === true);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [comment, setComment] = useState("");
  const [checks, setChecks] = useState<boolean[]>(() => entry.mission.rubric.map(() => false));
  const [busy, setBusy] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const waiting = entry.status === "submitted" || entry.status === "in_review";
  const claimedByOther = entry.status === "in_review" && entry.reviewer !== null && !entry.reviewer.isMe;
  const canSend = outcome !== null && comment.trim().length > 0 && comment.length <= COMMENT_LIMIT && !busy;
  const badge = statusBadge[entry.status];

  async function claim() {
    setBusy(true);
    try {
      await startReview({ submissionId: entry._id });
      setFormOpen(true);
    } catch (err) {
      onToast(errorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  }

  async function send() {
    if (!canSend || outcome === null) return;
    setBusy(true);
    try {
      await submitReview({
        submissionId: entry._id,
        outcome,
        comment,
        rubricChecks: entry.mission.rubric.length > 0 ? checks : undefined,
      });
      onToast(outcome === "passed" ? `Passed ${entry.learner.name}'s work` : `Sent back to ${entry.learner.name} for revision`);
    } catch (err) {
      onToast(errorMessage(err), "error");
      setBusy(false);
    }
  }

  return (
    <article style={{ ...cardStyle, padding: 24 }} aria-label={`${entry.mission.title} by ${entry.learner.name}`}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ ...monoMeta, fontWeight: 600, letterSpacing: "0.10em" }}>
            Mission · Version {entry.version}
          </p>
          <Link
            href={`/missions/${entry.mission.slug}`}
            target="_blank"
            style={{
              display: "block",
              fontFamily: font.display,
              fontSize: 18,
              lineHeight: "24px",
              fontWeight: 600,
              color: "var(--color-text-primary)",
              margin: 0,
              marginTop: 6,
              textDecoration: "none",
              overflowWrap: "anywhere",
            }}
          >
            {entry.mission.title}
          </Link>
          <p style={{ fontFamily: font.body, fontSize: 14, color: "var(--color-text-secondary)", margin: 0, marginTop: 4 }}>
            {entry.learner.name} · submitted {timeAgo(entry.submittedAt)}
            {entry.dueAt !== null && ` · due ${formatDate(entry.dueAt)}`}
          </p>
          <p style={{ ...monoMeta, marginTop: 4 }}>
            {entry.track.name} · {entry.cohortName} · {entry.moduleTitle}
          </p>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
          {entry.isLate && <StatusBadge tone="warning">Late</StatusBadge>}
          <StatusBadge tone={badge.tone}>{badge.label}</StatusBadge>
        </div>
      </div>

      <div style={{ marginTop: 16, display: "grid", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <ExternalLink size={14} aria-hidden style={{ color: "var(--color-text-tertiary)", flexShrink: 0 }} />
          <a
            href={entry.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontFamily: font.body,
              fontSize: 14,
              color: "#A5B4FC",
              textDecoration: "none",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {displayUrl(entry.linkUrl)}
          </a>
        </div>
        {entry.fileUrl && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            <Paperclip size={14} aria-hidden style={{ color: "var(--color-text-tertiary)", flexShrink: 0 }} />
            <a
              href={entry.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontFamily: font.body, fontSize: 14, color: "#A5B4FC", textDecoration: "none", overflowWrap: "anywhere" }}
            >
              {entry.fileName ?? "Attachment"}
            </a>
          </div>
        )}
        {entry.note && (
          <blockquote
            style={{
              margin: "4px 0 0",
              padding: "10px 14px",
              borderLeft: "2px solid var(--color-border-strong)",
              backgroundColor: "var(--color-bg-surface-2)",
              borderRadius: "0 10px 10px 0",
              fontFamily: font.body,
              fontSize: 14,
              lineHeight: "22px",
              color: "var(--color-text-secondary)",
              whiteSpace: "pre-wrap",
            }}
          >
            {entry.note}
          </blockquote>
        )}
      </div>

      {entry.version > 1 && (
        <div style={{ marginTop: 14 }}>
          <button
            type="button"
            aria-expanded={showHistory}
            onClick={() => setShowHistory((s) => !s)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              fontFamily: font.body,
              fontSize: 13,
              fontWeight: 500,
              color: "var(--color-text-secondary)",
            }}
          >
            <ChevronDown
              size={14}
              aria-hidden
              style={{ transform: showHistory ? "none" : "rotate(-90deg)", transition: "transform 200ms var(--ease-out-quart)" }}
            />
            Earlier versions ({entry.version - 1})
          </button>
          {showHistory && <EarlierVersions entry={entry} />}
        </div>
      )}

      <div style={{ marginTop: 20, borderTop: "1px solid var(--color-border-subtle)", paddingTop: 20 }}>
        {entry.review ? (
          <ReviewResult review={entry.review} rubric={entry.mission.rubric} />
        ) : entry.isOwn ? (
          <p style={{ fontFamily: font.body, fontSize: 14, color: "var(--color-text-tertiary)", margin: 0 }}>
            This is your own submission, so someone else needs to review it.
          </p>
        ) : !waiting ? null : !formOpen ? (
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            {claimedByOther ? (
              <>
                <span style={{ fontFamily: font.body, fontSize: 14, color: "var(--color-text-secondary)", flex: 1 }}>
                  {entry.reviewer?.name} is reviewing this.
                </span>
                <button type="button" onClick={() => setFormOpen(true)} style={smallButtonStyle}>
                  Review anyway
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => void claim()}
                disabled={busy}
                style={{
                  ...smallButtonStyle,
                  height: 38,
                  border: "none",
                  backgroundColor: "var(--color-indigo)",
                  padding: "0 18px",
                  opacity: busy ? 0.5 : 1,
                }}
              >
                {busy ? "Starting…" : "Start review"}
              </button>
            )}
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
          >
            {entry.mission.rubric.length > 0 && (
              <fieldset style={{ border: "none", margin: "0 0 18px", padding: 0 }}>
                <legend style={{ fontFamily: font.body, fontSize: 14, fontWeight: 500, color: "var(--color-text-primary)", marginBottom: 8 }}>
                  Rubric
                </legend>
                <div style={{ display: "grid", gap: 6 }}>
                  {entry.mission.rubric.map((criterion, i) => (
                    <label
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 10,
                        fontFamily: font.body,
                        fontSize: 14,
                        lineHeight: "20px",
                        color: checks[i] ? "var(--color-text-primary)" : "var(--color-text-secondary)",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checks[i] ?? false}
                        onChange={(e) => setChecks((prev) => prev.map((c, j) => (j === i ? e.target.checked : c)))}
                        style={{ marginTop: 3, accentColor: "#6366F1", width: 15, height: 15, flexShrink: 0 }}
                      />
                      {criterion}
                    </label>
                  ))}
                </div>
              </fieldset>
            )}

            <div role="radiogroup" aria-label="Outcome" style={{ display: "flex", gap: 10 }}>
              <OutcomeButton value="passed" selected={outcome === "passed"} onSelect={setOutcome} />
              <OutcomeButton value="needs_revision" selected={outcome === "needs_revision"} onSelect={setOutcome} />
            </div>

            <div style={{ marginTop: 16 }}>
              <label
                htmlFor={`comment-${entry._id}`}
                style={{ fontFamily: font.body, fontSize: 14, fontWeight: 500, color: "var(--color-text-primary)", display: "block", marginBottom: 8 }}
              >
                Feedback for {entry.learner.name.split(" ")[0]}
              </label>
              <textarea
                id={`comment-${entry._id}`}
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={
                  outcome === "needs_revision"
                    ? "What needs to change before this passes? Be specific."
                    : "What worked well, and what could be even better?"
                }
                style={{ ...textareaStyle, minHeight: 96 }}
                {...focusHandlers}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 14, flexWrap: "wrap" }}>
              <button
                type="submit"
                disabled={!canSend}
                style={{
                  ...smallButtonStyle,
                  height: 40,
                  padding: "0 20px",
                  border: "none",
                  backgroundColor: "var(--color-indigo)",
                  opacity: canSend ? 1 : 0.4,
                  cursor: canSend ? "pointer" : "not-allowed",
                }}
              >
                {busy ? "Sending…" : "Send review"}
              </button>
              <span style={{ fontFamily: font.body, fontSize: 12, color: "var(--color-text-tertiary)" }}>
                {outcome === null ? "Pick an outcome and write feedback to send." : !comment.trim() ? "Feedback is required." : ""}
              </span>
            </div>
          </form>
        )}
      </div>
    </article>
  );
}

function OutcomeButton({
  value,
  selected,
  onSelect,
}: {
  value: Outcome;
  selected: boolean;
  onSelect: (value: Outcome) => void;
}) {
  const passed = value === "passed";
  const accent = passed
    ? { border: "rgba(34,197,94,0.30)", bg: "rgba(34,197,94,0.10)", color: "#4ADE80" }
    : { border: "rgba(245,158,11,0.30)", bg: "rgba(245,158,11,0.10)", color: "#FBBF24" };
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={() => onSelect(value)}
      style={{
        flex: 1,
        height: 40,
        borderRadius: 10,
        cursor: "pointer",
        border: `1px solid ${selected ? accent.border : "var(--color-border-strong)"}`,
        backgroundColor: selected ? accent.bg : "transparent",
        color: selected ? accent.color : "var(--color-text-tertiary)",
        fontFamily: font.body,
        fontSize: 14,
        fontWeight: 600,
        padding: "0 20px",
        transitionProperty: "background-color, border-color, color",
        transitionDuration: "120ms",
      }}
    >
      {passed ? "Pass" : "Needs revision"}
    </button>
  );
}

function ReviewResult({ review, rubric }: { review: NonNullable<QueueEntry["review"]>; rubric: string[] }) {
  const passed = review.outcome === "passed";
  return (
    <div>
      <p style={{ display: "flex", alignItems: "center", gap: 8, margin: 0, fontFamily: font.body, fontSize: 14 }}>
        <Check size={16} aria-hidden style={{ color: passed ? "#4ADE80" : "#FBBF24" }} />
        <span style={{ fontWeight: 500, color: passed ? "#4ADE80" : "#FBBF24" }}>{passed ? "Passed" : "Needs revision"}</span>
        <span style={{ color: "var(--color-text-tertiary)" }}>
          by {review.reviewerName} · {timeAgo(review.reviewedAt)}
        </span>
      </p>
      <p
        style={{
          fontFamily: font.body,
          fontSize: 14,
          lineHeight: "22px",
          color: "var(--color-text-secondary)",
          margin: "10px 0 0",
          whiteSpace: "pre-wrap",
        }}
      >
        {review.comment}
      </p>
      {review.rubricChecks && review.rubricChecks.length === rubric.length && rubric.length > 0 && (
        <ul style={{ listStyle: "none", margin: "12px 0 0", padding: 0, display: "grid", gap: 4 }}>
          {rubric.map((criterion, i) => (
            <li
              key={i}
              style={{
                display: "flex",
                gap: 8,
                fontFamily: font.body,
                fontSize: 13,
                lineHeight: "20px",
                color: review.rubricChecks?.[i] ? "var(--color-text-secondary)" : "var(--color-text-tertiary)",
              }}
            >
              <span aria-hidden style={{ color: review.rubricChecks?.[i] ? "#4ADE80" : "var(--color-text-tertiary)" }}>
                {review.rubricChecks?.[i] ? "✓" : "–"}
              </span>
              <span>
                <span className="sr-only">{review.rubricChecks?.[i] ? "Met: " : "Not met: "}</span>
                {criterion}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EarlierVersions({ entry }: { entry: QueueEntry }) {
  const history = useQuery(api.reviews.history, { submissionId: entry._id });
  if (history === undefined) {
    return <p style={{ fontFamily: font.body, fontSize: 13, color: "var(--color-text-tertiary)", margin: "10px 0 0" }}>Loading…</p>;
  }
  if (history === null || history.length === 0) return null;
  return (
    <ol style={{ listStyle: "none", margin: "12px 0 0", padding: 0, display: "grid", gap: 10 }}>
      {history.map((version) => (
        <li
          key={version._id}
          style={{ padding: "12px 14px", border: "1px solid var(--color-border-subtle)", borderRadius: 10, backgroundColor: "#0D0D0D" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ ...monoMeta, fontWeight: 600 }}>Version {version.version}</span>
            <span style={{ fontFamily: font.body, fontSize: 12, color: "var(--color-text-tertiary)" }}>
              {formatDate(version.submittedAt)}
            </span>
            {version.isLate && <StatusBadge tone="warning">Late</StatusBadge>}
            <a
              href={version.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ ...ghostButtonStyle, height: 24, padding: "0 6px", color: "#A5B4FC", textDecoration: "none", marginLeft: "auto" }}
            >
              Open link
            </a>
          </div>
          {version.review && (
            <p style={{ fontFamily: font.body, fontSize: 13, lineHeight: "20px", color: "var(--color-text-secondary)", margin: "8px 0 0", whiteSpace: "pre-wrap" }}>
              <span style={{ color: version.review.outcome === "passed" ? "#4ADE80" : "#FBBF24", fontWeight: 500 }}>
                {version.review.outcome === "passed" ? "Passed" : "Needs revision"}
              </span>{" "}
              · {version.review.reviewerName}: {version.review.comment}
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}

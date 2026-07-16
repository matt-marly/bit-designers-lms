"use client";

import { useState } from "react";
import { ExternalLink, ChevronDown, CheckCircle } from "lucide-react";
import { SectionLabel } from "@/components/ui/custom/section-label";
import { StatusPill } from "@/components/ui/custom/status-pill";
import { PrimaryButton, OutlineButton } from "@/components/ui/custom/buttons";
import { mockReviewQueue } from "@/lib/mock-admin-data";

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

const rubricItems = [
  "Identifies at least 3 usability issues with evidence",
  "Proposes design improvements grounded in Bitcoin UX best practices",
  "Deliverable is well-structured and presentation-ready",
  "Demonstrates understanding of self-custody mental models",
];

function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffMins = Math.floor(diffMs / 60000);

  if (diffDays > 30) {
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }
  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHours > 0) return `${diffHours}h ago`;
  if (diffMins > 0) return `${diffMins}m ago`;
  return "just now";
}

function truncateUrl(url: string, max = 50): string {
  if (url.length <= max) return url;
  return url.slice(0, max) + "\u2026";
}

type ReviewStatus = "pending" | "passed" | "needs_revision";

interface ReviewState {
  status: ReviewStatus;
  outcome?: "passed" | "needs_revision";
  comment: string;
  submitted: boolean;
}

function ReviewCard({ item }: { item: (typeof mockReviewQueue)[number] }) {
  const [rubricOpen, setRubricOpen] = useState(false);
  const [review, setReview] = useState<ReviewState>({
    status: item.status as ReviewStatus,
    outcome: undefined,
    comment: "",
    submitted: false,
  });

  const statusVariant = review.status === "passed" ? "success" : review.status === "needs_revision" ? "warning" : "indigo";
  const statusLabel = review.status === "passed" ? "PASSED" : review.status === "needs_revision" ? "NEEDS REVISION" : "PENDING";

  function handleSubmitReview() {
    if (!review.outcome || !review.comment.trim()) return;
    setReview((prev) => ({ ...prev, status: prev.outcome!, submitted: true }));
  }

  return (
    <div style={{ ...cardStyle, padding: 24, marginBottom: 16 }}>
      {/* Top row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        <div style={{ minWidth: 0 }}>
          <SectionLabel>{`MISSION · VERSION ${item.version}`}</SectionLabel>
          <p style={{ fontFamily: font.display, fontSize: 18, lineHeight: "24px", fontWeight: 600, color: "var(--color-text-primary)", margin: 0, marginTop: 6 }}>
            {item.missionTitle}
          </p>
          <p style={{ fontFamily: font.body, fontSize: 14, fontWeight: 400, color: "var(--color-text-secondary)", margin: 0, marginTop: 4 }}>
            Submitted by {item.learnerName} · {timeAgo(item.submittedAt)}
          </p>
          <p style={{ fontFamily: font.mono, fontSize: 11, lineHeight: "14px", fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-text-tertiary)", margin: 0, marginTop: 4 }}>
            {item.track.toUpperCase()} · {item.cohort.toUpperCase()}
          </p>
        </div>
        <StatusPill label={statusLabel} variant={statusVariant} />
      </div>

      {/* Submission link */}
      <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <ExternalLink style={{ width: 14, height: 14, color: "var(--color-text-tertiary)", flexShrink: 0 }} />
        <a
          href={item.linkUrl} target="_blank" rel="noopener noreferrer"
          style={{ fontFamily: font.body, fontSize: 14, fontWeight: 400, color: "var(--color-text-primary)", textDecoration: "none", transitionProperty: "color", transitionDuration: "var(--duration-fast)", transitionTimingFunction: "var(--ease-out-quart)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-indigo-text)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-primary)")}
        >
          {truncateUrl(item.linkUrl)}
        </a>
        <div style={{ marginLeft: "auto" }}>
          <OutlineButton size="small" onClick={() => window.open(item.linkUrl, "_blank")}>Open in Figma</OutlineButton>
        </div>
      </div>

      {/* Rubric (collapsible) */}
      <div style={{ marginTop: 16 }}>
        <button onClick={() => setRubricOpen(!rubricOpen)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          <ChevronDown style={{ width: 14, height: 14, color: "var(--color-text-tertiary)", transform: rubricOpen ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 200ms cubic-bezier(0.25, 1, 0.5, 1)" }} />
          <span style={{ fontFamily: font.mono, fontSize: 11, fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--color-text-tertiary)" }}>VIEW RUBRIC</span>
        </button>
        <div style={{ maxHeight: rubricOpen ? 200 : 0, overflow: "hidden", transition: "max-height 200ms cubic-bezier(0.25, 1, 0.5, 1)" }}>
          <ul style={{ margin: 0, paddingLeft: 20, paddingTop: 10, listStyle: "disc" }}>
            {rubricItems.map((r) => (
              <li key={r} style={{ fontFamily: font.body, fontSize: 13, lineHeight: "20px", fontWeight: 400, color: "var(--color-text-secondary)", marginBottom: 4 }}>{r}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Review form / result */}
      <div style={{ marginTop: 20, borderTop: "1px solid var(--color-border-subtle)", paddingTop: 20 }}>
        {review.submitted ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <CheckCircle style={{ width: 16, height: 16, color: "var(--color-success-text)" }} />
            <span style={{ fontFamily: font.body, fontSize: 14, fontWeight: 500, color: "var(--color-success-text)" }}>Review submitted</span>
            <span style={{ fontFamily: font.body, fontSize: 14, fontWeight: 400, color: "var(--color-text-secondary)", marginLeft: 4 }}>Learner has been notified.</span>
          </div>
        ) : review.status === "pending" ? (
          <>
            {/* Outcome buttons */}
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setReview((p) => ({ ...p, outcome: "passed" }))}
                style={{
                  flex: "1 1 0", height: 40, borderRadius: 10,
                  border: `1px solid ${review.outcome === "passed" ? "rgba(34,197,94,0.60)" : "rgba(34,197,94,0.40)"}`,
                  backgroundColor: review.outcome === "passed" ? "rgba(34,197,94,0.25)" : "rgba(34,197,94,0.15)",
                  color: "var(--color-success-text)",
                  fontFamily: font.body, fontSize: 14, fontWeight: 600, cursor: "pointer",
                  transitionProperty: "background-color, border-color", transitionDuration: "var(--duration-fast)", transitionTimingFunction: "var(--ease-out-quart)",
                }}
              >
                Pass
              </button>
              <button
                onClick={() => setReview((p) => ({ ...p, outcome: "needs_revision" }))}
                style={{
                  flex: "1 1 0", height: 40, borderRadius: 10,
                  border: `1px solid ${review.outcome === "needs_revision" ? "rgba(245,158,11,0.60)" : "rgba(245,158,11,0.40)"}`,
                  backgroundColor: review.outcome === "needs_revision" ? "rgba(245,158,11,0.25)" : "rgba(245,158,11,0.15)",
                  color: "var(--color-warning-text)",
                  fontFamily: font.body, fontSize: 14, fontWeight: 600, cursor: "pointer",
                  transitionProperty: "background-color, border-color", transitionDuration: "var(--duration-fast)", transitionTimingFunction: "var(--ease-out-quart)",
                }}
              >
                Needs Revision
              </button>
            </div>

            {/* Comment */}
            <div style={{ marginTop: 16 }}>
              <label style={{ fontFamily: font.body, fontSize: 14, fontWeight: 500, color: "var(--color-text-primary)", display: "block", marginBottom: 8 }}>Feedback for learner</label>
              <textarea
                rows={4} placeholder="Write your feedback..."
                value={review.comment} onChange={(e) => setReview((p) => ({ ...p, comment: e.target.value }))}
                style={{ width: "100%", padding: "12px 14px", borderRadius: 10, backgroundColor: "var(--color-bg-surface-2)", border: "1px solid var(--color-border-strong)", color: "var(--color-text-primary)", fontFamily: font.body, fontSize: "14.5px", lineHeight: "22px", fontWeight: 400, resize: "vertical", minHeight: 96, outline: "none", boxSizing: "border-box" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.70)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.15)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "var(--color-border-strong)"; e.currentTarget.style.boxShadow = "none"; }}
              />
            </div>

            <div style={{ marginTop: 16 }}>
              <PrimaryButton fullWidth disabled={!review.outcome || !review.comment.trim()} onClick={handleSubmitReview}>Submit Review</PrimaryButton>
            </div>
          </>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <CheckCircle style={{ width: 16, height: 16, color: "var(--color-success-text)" }} />
            <span style={{ fontFamily: font.body, fontSize: 14, fontWeight: 500, color: review.status === "passed" ? "var(--color-success-text)" : "var(--color-warning-text)" }}>
              {review.status === "passed" ? "Passed" : "Needs Revision"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ReviewQueuePage() {
  const [filter, setFilter] = useState<"all" | "pending" | "reviewed">("all");
  const pendingCount = mockReviewQueue.filter((r) => r.status === "pending").length;

  const filtered = mockReviewQueue.filter((item) => {
    if (filter === "pending") return item.status === "pending";
    if (filter === "reviewed") return item.status !== "pending";
    return true;
  });

  return (
    <div>
      <h1 style={{ fontFamily: font.display, fontSize: 36, lineHeight: "42px", fontWeight: 600, letterSpacing: "-0.02em", color: "var(--color-text-primary)", margin: 0 }}>Review Queue</h1>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginTop: 6, marginBottom: 32 }}>
        <p style={{ fontFamily: font.body, fontSize: 14, lineHeight: "22px", fontWeight: 400, color: "var(--color-text-secondary)", margin: 0 }}>
          {pendingCount} submission{pendingCount !== 1 ? "s" : ""} pending review
        </p>
        <div style={{ display: "flex", gap: 0 }}>
          {(["all", "pending", "reviewed"] as const).map((f) => (
            <button
              key={f} onClick={() => setFilter(f)}
              style={{
                padding: "8px 14px", fontFamily: font.body, fontSize: 13, fontWeight: 500,
                color: filter === f ? "var(--color-text-primary)" : "var(--color-text-tertiary)",
                background: "none", border: "none",
                borderBottom: filter === f ? "2px solid var(--color-indigo)" : "2px solid transparent",
                cursor: "pointer", textTransform: "capitalize",
                transitionProperty: "color", transitionDuration: "var(--duration-fast)", transitionTimingFunction: "var(--ease-out-quart)",
              }}
              onMouseEnter={(e) => { if (filter !== f) e.currentTarget.style.color = "var(--color-text-secondary)"; }}
              onMouseLeave={(e) => { if (filter !== f) e.currentTarget.style.color = "var(--color-text-tertiary)"; }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 0" }}>
          <p style={{ fontFamily: font.body, fontSize: 14, fontWeight: 500, color: "var(--color-text-primary)", margin: 0 }}>No submissions match this filter</p>
          <p style={{ fontFamily: font.body, fontSize: 13, fontWeight: 400, color: "var(--color-text-secondary)", margin: 0, marginTop: 4 }}>Try selecting a different filter above.</p>
        </div>
      ) : (
        filtered.map((item) => <ReviewCard key={item.id} item={item} />)
      )}
    </div>
  );
}

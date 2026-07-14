"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Calendar,
  ExternalLink,
  Upload,
  FileText,
  X,
  Clock,
  CheckCircle,
} from "lucide-react";
import { SectionLabel } from "@/components/ui/custom/section-label";
import { StatusPill } from "@/components/ui/custom/status-pill";
import { PrimaryButton } from "@/components/ui/custom/buttons";
import { getMissionBySlug } from "@/lib/mock-missions-data";
import type { MissionStatus, MissionSubmission } from "@/lib/mock-missions-data";

const font = {
  display: "var(--font-display), 'Space Grotesk', 'Inter', system-ui, sans-serif",
  body: "var(--font-body), 'Inter', system-ui, -apple-system, sans-serif",
  mono: "var(--font-mono), 'JetBrains Mono', 'SF Mono', monospace",
};

function getStatusPillProps(status: MissionStatus): {
  label: string;
  variant: "success" | "warning" | "indigo" | "danger" | "neutral";
} {
  switch (status) {
    case "passed":
      return { label: "Passed", variant: "success" };
    case "needs-revision":
      return { label: "Needs Revision", variant: "warning" };
    case "submitted":
      return { label: "Submitted", variant: "indigo" };
    case "in-review":
      return { label: "In Review", variant: "indigo" };
    case "not-started":
      return { label: "Not Started", variant: "neutral" };
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDueLabel(dateStr: string, status: MissionStatus): { text: string; color: string } {
  const due = new Date(dateStr + "T23:59:59");
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  const formatted = formatDate(dateStr);

  if (status === "passed") {
    return { text: formatted, color: "var(--color-text-tertiary)" };
  }
  if (diffDays < 0) {
    return { text: `Overdue · ${formatted}`, color: "var(--color-danger-text)" };
  }
  if (diffDays <= 3) {
    return { text: formatted, color: "var(--color-warning-text)" };
  }
  return { text: formatted, color: "var(--color-text-tertiary)" };
}

function truncateUrl(url: string, max = 60): string {
  if (url.length <= max) return url;
  return url.slice(0, max) + "…";
}

export default function MissionDetailPage() {
  const params = useParams();
  const slug = params.missionSlug as string;
  const mission = getMissionBySlug(slug);

  const [linkValue, setLinkValue] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);
  const [noteValue, setNoteValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  if (!mission) {
    return (
      <div style={{ padding: 48 }}>
        <p
          style={{
            fontFamily: font.body,
            fontSize: "14.5px",
            color: "var(--color-text-secondary)",
          }}
        >
          Mission not found.
        </p>
      </div>
    );
  }

  const dueInfo = formatDueLabel(mission.dueAt, mission.status);
  const statusProps = getStatusPillProps(mission.status);
  const isReviewed = mission.type === "reviewed";
  const showSubmitForm =
    mission.status === "not-started" || mission.status === "needs-revision";
  const showAwaitingReview =
    mission.status === "submitted" || mission.status === "in-review";
  const showSubmitSection = mission.status !== "passed";
  const latestReview =
    mission.submissions.length > 0
      ? mission.submissions[mission.submissions.length - 1].review
      : null;

  function handleFileSelect(file: File) {
    if (file.size > 10 * 1024 * 1024) return;
    const sizeKb = Math.round(file.size / 1024);
    const sizeStr = sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`;
    setFileName(file.name);
    setFileSize(sizeStr);
  }

  function handleSubmit() {
    if (!linkValue.trim()) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitSuccess(true);
    }, 1500);
  }

  return (
    <div
      style={{
        maxWidth: 760,
        margin: "0 auto",
      }}
      className="mission-detail-page"
    >
      {/* Back link */}
      <Link
        href="/missions"
        style={{
          fontFamily: font.body,
          fontSize: 13,
          lineHeight: "18px",
          fontWeight: 400,
          color: "var(--color-text-tertiary)",
          textDecoration: "none",
          transitionProperty: "color",
          transitionDuration: "var(--duration-fast)",
          transitionTimingFunction: "var(--ease-out-quart)",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-text-primary)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-tertiary)")}
      >
        &larr; Missions
      </Link>

      {/* Page header */}
      <div style={{ marginTop: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <SectionLabel>{`Mission ${mission.number}`}</SectionLabel>
          {isReviewed ? (
            <StatusPill label="Reviewed" variant="indigo" />
          ) : (
            <StatusPill label="Completion" variant="neutral" />
          )}
        </div>

        <h1
          style={{
            fontFamily: font.display,
            fontSize: 28,
            lineHeight: "34px",
            fontWeight: 600,
            letterSpacing: "-0.015em",
            color: "var(--color-text-primary)",
            margin: 0,
            marginTop: 8,
          }}
        >
          {mission.title}
        </h1>

        <p
          style={{
            fontFamily: font.mono,
            fontSize: 13,
            lineHeight: "18px",
            fontWeight: 500,
            textTransform: "uppercase",
            color: "var(--color-text-tertiary)",
            margin: 0,
            marginTop: 8,
          }}
        >
          {mission.unit} · {mission.module}
        </p>
      </div>

      {/* Meta row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 24,
          flexWrap: "wrap",
          marginTop: 16,
          marginBottom: 40,
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Calendar
            style={{ width: 14, height: 14, color: "var(--color-text-tertiary)" }}
          />
          <span
            style={{
              fontFamily: font.mono,
              fontSize: 13,
              lineHeight: "18px",
              fontWeight: 500,
              color: dueInfo.color,
              textTransform: "uppercase",
            }}
          >
            {dueInfo.text}
          </span>
        </span>

        <StatusPill label={statusProps.label} variant={statusProps.variant} />

        {mission.isLate && (
          <span
            style={{
              fontFamily: font.mono,
              fontSize: 11,
              lineHeight: "14px",
              fontWeight: 600,
              letterSpacing: "0.10em",
              textTransform: "uppercase",
              color: "var(--color-danger-text)",
            }}
          >
            Late Submission
          </span>
        )}
      </div>

      {/* Divider */}
      <div
        style={{
          height: 1,
          backgroundColor: "var(--color-border-subtle)",
        }}
      />

      {/* Brief */}
      <section style={{ marginTop: 32 }}>
        <SectionLabel>Mission Brief</SectionLabel>
        <div
          style={{
            backgroundColor: "var(--color-bg-surface)",
            border: "1px solid var(--color-border-subtle)",
            borderRadius: 14,
            padding: 20,
            marginTop: 16,
          }}
        >
          <p
            style={{
              fontFamily: font.body,
              fontSize: 15,
              lineHeight: "26px",
              fontWeight: 400,
              color: "var(--color-text-secondary)",
              margin: 0,
            }}
          >
            {mission.brief}
          </p>
        </div>
      </section>

      {/* Rubric (reviewed only) */}
      {isReviewed && mission.rubric && (
        <section style={{ marginTop: 32 }}>
          <SectionLabel>Evaluation Rubric</SectionLabel>
          <p
            style={{
              fontFamily: font.body,
              fontSize: 13,
              lineHeight: "19px",
              fontWeight: 400,
              color: "var(--color-text-tertiary)",
              margin: 0,
              marginTop: 4,
              marginBottom: 16,
            }}
          >
            Your submission will be evaluated against these criteria:
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {mission.rubric.map((item, i) => (
              <div
                key={i}
                style={{ display: "flex", gap: 12, alignItems: "flex-start" }}
              >
                <span
                  style={{
                    fontFamily: font.mono,
                    fontSize: 12,
                    lineHeight: "22px",
                    fontWeight: 500,
                    color: "var(--color-indigo-text)",
                    flexShrink: 0,
                  }}
                >
                  {String(i + 1).padStart(2, "0")}.
                </span>
                <span
                  style={{
                    fontFamily: font.body,
                    fontSize: "14.5px",
                    lineHeight: "22px",
                    fontWeight: 400,
                    color: "var(--color-text-secondary)",
                  }}
                >
                  {item}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Submission History */}
      {mission.submissions.length > 0 && (
        <section style={{ marginTop: 40 }}>
          <SectionLabel>Submission History</SectionLabel>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              marginTop: 16,
            }}
          >
            {[...mission.submissions].reverse().map((sub) => (
              <SubmissionCard key={sub.id} submission={sub} isReviewed={isReviewed} />
            ))}
          </div>
        </section>
      )}

      {/* Submit / Resubmit section */}
      {showSubmitSection && !submitSuccess && (
        <section style={{ marginTop: 40 }}>
          {showAwaitingReview && <AwaitingReviewState />}

          {showSubmitForm && (
            <>
              <SectionLabel>
                {mission.status === "needs-revision"
                  ? "Resubmit Your Work"
                  : "Submit Your Work"}
              </SectionLabel>

              {/* Previous feedback card (resubmit) */}
              {mission.status === "needs-revision" && latestReview && (
                <div
                  style={{
                    backgroundColor: "var(--color-bg-surface-2)",
                    border: "1px solid var(--color-border-subtle)",
                    borderRadius: 14,
                    padding: 16,
                    marginTop: 16,
                    marginBottom: 24,
                  }}
                >
                  <SectionLabel color="var(--color-warning-text)">
                    Previous Feedback
                  </SectionLabel>
                  <p
                    style={{
                      fontFamily: font.body,
                      fontSize: 14,
                      lineHeight: "22px",
                      fontWeight: 400,
                      color: "var(--color-text-secondary)",
                      margin: 0,
                      marginTop: 8,
                    }}
                  >
                    {latestReview.comment}
                  </p>
                </div>
              )}

              {/* Form */}
              <div style={{ marginTop: mission.status === "needs-revision" ? 0 : 16 }}>
                {/* Link field */}
                <div style={{ marginBottom: 20 }}>
                  <label
                    style={{
                      display: "block",
                      fontFamily: font.body,
                      fontSize: 14,
                      lineHeight: "20px",
                      fontWeight: 500,
                      color: "var(--color-text-primary)",
                      marginBottom: 8,
                    }}
                  >
                    Figma, GitHub, or other link
                  </label>
                  <input
                    type="url"
                    value={linkValue}
                    onChange={(e) => setLinkValue(e.target.value)}
                    placeholder="https://figma.com/file/..."
                    style={{
                      width: "100%",
                      height: 40,
                      backgroundColor: "var(--color-bg-surface-2)",
                      border: "1px solid var(--color-border-strong)",
                      borderRadius: 10,
                      padding: "0 16px",
                      fontFamily: font.body,
                      fontSize: "14.5px",
                      lineHeight: "22px",
                      color: "var(--color-text-primary)",
                      outline: "none",
                      transitionProperty: "border-color",
                      transitionDuration: "var(--duration-base)",
                      transitionTimingFunction: "var(--ease-out-quart)",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "var(--color-border-focus)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "var(--color-border-strong)";
                    }}
                  />
                </div>

                {/* File upload */}
                <div style={{ marginBottom: 20 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: 8,
                      marginBottom: 8,
                    }}
                  >
                    <label
                      style={{
                        fontFamily: font.body,
                        fontSize: 14,
                        lineHeight: "20px",
                        fontWeight: 500,
                        color: "var(--color-text-primary)",
                      }}
                    >
                      Supporting file (optional)
                    </label>
                    <span
                      style={{
                        fontFamily: font.mono,
                        fontSize: 11,
                        lineHeight: "14px",
                        fontWeight: 500,
                        color: "var(--color-text-tertiary)",
                      }}
                    >
                      PDF or image, max 10MB
                    </span>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.webp"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(file);
                    }}
                  />

                  {!fileName ? (
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => fileInputRef.current?.click()}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragOver(true);
                      }}
                      onDragLeave={() => setIsDragOver(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragOver(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file) handleFileSelect(file);
                      }}
                      style={{
                        backgroundColor: isDragOver
                          ? "var(--color-indigo-subtle)"
                          : "var(--color-bg-surface-2)",
                        border: `1px dashed ${
                          isDragOver
                            ? "var(--color-indigo)"
                            : "var(--color-border-strong)"
                        }`,
                        borderRadius: 14,
                        padding: 32,
                        textAlign: "center",
                        cursor: "pointer",
                        transitionProperty: "background-color, border-color",
                        transitionDuration: "var(--duration-fast)",
                        transitionTimingFunction: "var(--ease-out-quart)",
                      }}
                      onMouseEnter={(e) => {
                        if (!isDragOver) {
                          e.currentTarget.style.borderColor =
                            "var(--color-indigo-border)";
                          e.currentTarget.style.backgroundColor =
                            "var(--color-bg-surface-3)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isDragOver) {
                          e.currentTarget.style.borderColor =
                            "var(--color-border-strong)";
                          e.currentTarget.style.backgroundColor =
                            "var(--color-bg-surface-2)";
                        }
                      }}
                    >
                      <Upload
                        style={{
                          width: 24,
                          height: 24,
                          color: "var(--color-text-tertiary)",
                          margin: "0 auto",
                        }}
                      />
                      <p
                        style={{
                          fontFamily: font.body,
                          fontSize: 14,
                          lineHeight: "20px",
                          fontWeight: 400,
                          color: "var(--color-text-secondary)",
                          margin: 0,
                          marginTop: 8,
                        }}
                      >
                        Drop file here or click to upload
                      </p>
                    </div>
                  ) : (
                    <div
                      style={{
                        backgroundColor: "var(--color-bg-surface-2)",
                        border: "1px solid var(--color-border-subtle)",
                        borderRadius: 10,
                        padding: "12px 16px",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <FileText
                        style={{
                          width: 16,
                          height: 16,
                          color: "var(--color-text-tertiary)",
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{
                            fontFamily: font.body,
                            fontSize: "14.5px",
                            lineHeight: "22px",
                            fontWeight: 500,
                            color: "var(--color-text-primary)",
                            margin: 0,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {fileName}
                        </p>
                        {fileSize && (
                          <p
                            style={{
                              fontFamily: font.mono,
                              fontSize: 11,
                              lineHeight: "14px",
                              fontWeight: 500,
                              color: "var(--color-text-tertiary)",
                              margin: 0,
                              marginTop: 2,
                            }}
                          >
                            {fileSize}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setFileName(null);
                          setFileSize(null);
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                        style={{
                          width: 28,
                          height: 28,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: "transparent",
                          border: "none",
                          borderRadius: 6,
                          cursor: "pointer",
                          color: "var(--color-text-tertiary)",
                          flexShrink: 0,
                          transitionProperty: "background-color, color",
                          transitionDuration: "var(--duration-fast)",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor =
                            "var(--color-bg-surface-3)";
                          e.currentTarget.style.color = "var(--color-text-primary)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                          e.currentTarget.style.color = "var(--color-text-tertiary)";
                        }}
                        aria-label="Remove file"
                      >
                        <X style={{ width: 14, height: 14 }} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Note field */}
                <div style={{ marginBottom: 24 }}>
                  <label
                    style={{
                      display: "block",
                      fontFamily: font.body,
                      fontSize: 14,
                      lineHeight: "20px",
                      fontWeight: 500,
                      color: "var(--color-text-primary)",
                      marginBottom: 8,
                    }}
                  >
                    Note to mentor (optional)
                  </label>
                  <textarea
                    value={noteValue}
                    onChange={(e) => setNoteValue(e.target.value)}
                    placeholder="Any context that might help your mentor..."
                    rows={4}
                    style={{
                      width: "100%",
                      backgroundColor: "var(--color-bg-surface-2)",
                      border: "1px solid var(--color-border-strong)",
                      borderRadius: 10,
                      padding: "12px 16px",
                      fontFamily: font.body,
                      fontSize: "14.5px",
                      lineHeight: "22px",
                      color: "var(--color-text-primary)",
                      outline: "none",
                      resize: "vertical",
                      transitionProperty: "border-color",
                      transitionDuration: "var(--duration-base)",
                      transitionTimingFunction: "var(--ease-out-quart)",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "var(--color-border-focus)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "var(--color-border-strong)";
                    }}
                  />
                </div>

                {/* Submit button */}
                <PrimaryButton
                  fullWidth
                  disabled={!linkValue.trim() || isSubmitting}
                  onClick={handleSubmit}
                >
                  {isSubmitting ? "Submitting…" : "Submit work"}
                </PrimaryButton>
              </div>
            </>
          )}
        </section>
      )}

      {/* Success state */}
      {submitSuccess && (
        <section style={{ marginTop: 40 }}>
          <div
            style={{
              backgroundColor: "var(--color-success-subtle)",
              border: "1px solid var(--color-success-border)",
              borderRadius: 14,
              padding: 20,
              textAlign: "center",
            }}
          >
            <CheckCircle
              style={{
                width: 24,
                height: 24,
                color: "var(--color-success-text)",
                margin: "0 auto",
              }}
            />
            <p
              style={{
                fontFamily: font.display,
                fontSize: 18,
                lineHeight: "24px",
                fontWeight: 600,
                color: "var(--color-text-primary)",
                margin: 0,
                marginTop: 12,
              }}
            >
              Submission received
            </p>
            <p
              style={{
                fontFamily: font.body,
                fontSize: 14,
                lineHeight: "22px",
                fontWeight: 400,
                color: "var(--color-text-secondary)",
                margin: 0,
                marginTop: 8,
              }}
            >
              {isReviewed
                ? "Your mentor will review within 3–5 days."
                : "Submission recorded. No review required."}
            </p>
          </div>
        </section>
      )}

      {/* Bottom spacing */}
      <div style={{ height: 64 }} />
    </div>
  );
}

function SubmissionCard({
  submission,
  isReviewed,
}: {
  submission: MissionSubmission;
  isReviewed: boolean;
}) {
  const statusProps = getStatusPillProps(submission.status);

  return (
    <div
      style={{
        backgroundColor: "var(--color-bg-surface)",
        border: "1px solid var(--color-border-subtle)",
        borderRadius: 14,
        padding: 20,
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div>
          <p
            style={{
              fontFamily: font.mono,
              fontSize: 11,
              lineHeight: "14px",
              fontWeight: 600,
              letterSpacing: "0.10em",
              textTransform: "uppercase",
              color: "var(--color-text-tertiary)",
              margin: 0,
            }}
          >
            Version {submission.version}
          </p>
          <p
            style={{
              fontFamily: font.mono,
              fontSize: 11,
              lineHeight: "14px",
              fontWeight: 500,
              color: "var(--color-text-tertiary)",
              margin: 0,
              marginTop: 2,
            }}
          >
            Submitted {formatDate(submission.submittedAt)}
          </p>
        </div>
        <StatusPill label={statusProps.label} variant={statusProps.variant} />
      </div>

      {/* Link row */}
      <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
        <ExternalLink
          style={{
            width: 14,
            height: 14,
            color: "var(--color-text-tertiary)",
            flexShrink: 0,
          }}
        />
        <a
          href={submission.linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontFamily: font.body,
            fontSize: 14,
            lineHeight: "20px",
            fontWeight: 400,
            color: "var(--color-text-primary)",
            textDecoration: "none",
            transitionProperty: "color",
            transitionDuration: "var(--duration-fast)",
            transitionTimingFunction: "var(--ease-out-quart)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.color = "var(--color-indigo-text)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = "var(--color-text-primary)")
          }
        >
          {submission.fileName || truncateUrl(submission.linkUrl)}
        </a>
      </div>

      {/* Review block */}
      {isReviewed && submission.review && (
        <div
          style={{
            marginTop: 16,
            backgroundColor: "var(--color-bg-surface-2)",
            borderLeft: `3px solid ${
              submission.review.outcome === "passed"
                ? "var(--color-success)"
                : "var(--color-warning)"
            }`,
            borderRadius: "0 8px 8px 0",
            padding: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <SectionLabel
              color={
                submission.review.outcome === "passed"
                  ? "var(--color-success-text)"
                  : "var(--color-warning-text)"
              }
            >
              Mentor Feedback
            </SectionLabel>
            <span
              style={{
                fontFamily: font.mono,
                fontSize: 11,
                lineHeight: "14px",
                fontWeight: 500,
                color: "var(--color-text-tertiary)",
              }}
            >
              {submission.review.reviewerName} · {formatDate(submission.review.reviewedAt)}
            </span>
          </div>
          <p
            style={{
              fontFamily: font.body,
              fontSize: "14.5px",
              lineHeight: "24px",
              fontWeight: 400,
              color: "var(--color-text-secondary)",
              margin: 0,
              marginTop: 8,
            }}
          >
            {submission.review.comment}
          </p>
        </div>
      )}
    </div>
  );
}

function AwaitingReviewState() {
  return (
    <div
      style={{
        backgroundColor: "var(--color-bg-surface-2)",
        border: "1px solid var(--color-border-subtle)",
        borderRadius: 14,
        padding: 20,
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <Clock
        style={{
          width: 20,
          height: 20,
          color: "var(--color-indigo-text)",
          flexShrink: 0,
        }}
      />
      <div>
        <p
          style={{
            fontFamily: font.body,
            fontSize: "14.5px",
            lineHeight: "22px",
            fontWeight: 500,
            color: "var(--color-text-primary)",
            margin: 0,
          }}
        >
          Submission received
        </p>
        <p
          style={{
            fontFamily: font.body,
            fontSize: 14,
            lineHeight: "22px",
            fontWeight: 400,
            color: "var(--color-text-secondary)",
            margin: 0,
            marginTop: 4,
          }}
        >
          Your mentor will review this within 3–5 days.
        </p>
      </div>
    </div>
  );
}

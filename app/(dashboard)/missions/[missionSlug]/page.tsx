"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ExternalLink,
  Upload,
  FileText,
  X,
  Clock,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Circle,
  GraduationCap,
  CheckSquare,
} from "lucide-react";
import { SectionLabel } from "@/components/ui/custom/section-label";
import { PrimaryButton } from "@/components/ui/custom/buttons";
import { getMissionBySlug, getAdjacentMissions } from "@/lib/mock-missions-data";
import type { MissionStatus, MissionSubmission } from "@/lib/mock-missions-data";

const font = {
  display: "var(--font-display), 'Space Grotesk', 'Inter', system-ui, sans-serif",
  body: "var(--font-body), 'Inter', system-ui, -apple-system, sans-serif",
  mono: "var(--font-mono), 'JetBrains Mono', 'SF Mono', monospace",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateShort(dateStr: string): string {
  return new Date(dateStr)
    .toLocaleDateString("en-US", { month: "short", day: "numeric" })
    .toUpperCase();
}

function isOverdue(dateStr: string): boolean {
  const due = new Date(dateStr + "T23:59:59");
  return due.getTime() < Date.now();
}

function truncateUrl(url: string, max = 55): string {
  if (url.length <= max) return url;
  return url.slice(0, max) + "…";
}

function HoverLink({
  href,
  children,
  style,
}: {
  href: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <Link
      href={href}
      style={{
        textDecoration: "none",
        color: "var(--color-text-tertiary)",
        transitionProperty: "color",
        transitionDuration: "var(--duration-fast)",
        transitionTimingFunction: "var(--ease-out-quart)",
        ...style,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-text-primary)")}
      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-tertiary)")}
    >
      {children}
    </Link>
  );
}

function VerticalDivider() {
  return (
    <div
      style={{
        width: 1,
        height: 12,
        backgroundColor: "var(--color-border-subtle)",
        flexShrink: 0,
      }}
    />
  );
}

function StatusIndicator({ status }: { status: MissionStatus }) {
  const iconStyle = { width: 13, height: 13, flexShrink: 0 } as const;
  const textStyle = {
    fontFamily: font.body,
    fontSize: 13,
    lineHeight: "18px",
    fontWeight: 400,
  } as const;

  switch (status) {
    case "passed":
      return (
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <CheckCircle style={{ ...iconStyle, color: "var(--color-text-secondary)" }} />
          <span style={{ ...textStyle, color: "var(--color-text-secondary)" }}>Passed</span>
        </div>
      );
    case "needs-revision":
      return (
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <AlertCircle style={{ ...iconStyle, color: "#F59E0B" }} />
          <span style={{ ...textStyle, color: "#F59E0B" }}>Needs revision</span>
        </div>
      );
    case "submitted":
      return (
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <Clock style={{ ...iconStyle, color: "var(--color-text-tertiary)" }} />
          <span style={{ ...textStyle, color: "var(--color-text-tertiary)" }}>Submitted</span>
        </div>
      );
    case "in-review":
      return (
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <Clock style={{ ...iconStyle, color: "var(--color-text-tertiary)" }} />
          <span style={{ ...textStyle, color: "var(--color-text-tertiary)" }}>In review</span>
        </div>
      );
    case "not-started":
      return (
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <Circle style={{ ...iconStyle, color: "var(--color-text-tertiary)" }} />
          <span style={{ ...textStyle, color: "var(--color-text-tertiary)" }}>Not started</span>
        </div>
      );
  }
}

function SubmissionStatusIndicator({ status }: { status: MissionStatus }) {
  const iconStyle = { width: 13, height: 13, flexShrink: 0 } as const;
  const textStyle = {
    fontFamily: font.body,
    fontSize: 12,
    lineHeight: "16px",
    fontWeight: 500,
  } as const;

  switch (status) {
    case "passed":
      return (
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <CheckCircle style={{ ...iconStyle, color: "var(--color-text-secondary)" }} />
          <span style={{ ...textStyle, color: "var(--color-text-secondary)" }}>Passed</span>
        </div>
      );
    case "needs-revision":
      return (
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <AlertCircle style={{ ...iconStyle, color: "#F59E0B" }} />
          <span style={{ ...textStyle, color: "#F59E0B" }}>Needs revision</span>
        </div>
      );
    case "submitted":
      return (
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <Clock style={{ ...iconStyle, color: "var(--color-text-tertiary)" }} />
          <span style={{ ...textStyle, color: "var(--color-text-tertiary)" }}>Submitted</span>
        </div>
      );
    case "in-review":
      return (
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <Clock style={{ ...iconStyle, color: "var(--color-text-tertiary)" }} />
          <span style={{ ...textStyle, color: "var(--color-text-tertiary)" }}>In review</span>
        </div>
      );
    default:
      return null;
  }
}

export default function MissionDetailPage() {
  const params = useParams();
  const slug = params.missionSlug as string;
  const mission = getMissionBySlug(slug);
  const adjacent = getAdjacentMissions(slug);

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

  const isReviewed = mission.type === "reviewed";
  const showSubmitForm =
    mission.status === "not-started" || mission.status === "needs-revision";
  const showAwaitingReview =
    mission.status === "submitted" || mission.status === "in-review";
  const showPassedState = mission.status === "passed";
  const overdue =
    isOverdue(mission.dueAt) &&
    (mission.status === "not-started" || mission.status === "needs-revision");

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

  // Determine which content sections to show
  const sections: React.ReactNode[] = [];

  // A. Mission Brief
  if (mission.brief) {
    sections.push(
      <div key="brief" style={{ padding: 24 }}>
        <SectionLabel>Mission Brief</SectionLabel>
        <p
          style={{
            fontFamily: font.body,
            fontSize: 15,
            lineHeight: "26px",
            fontWeight: 400,
            color: "var(--color-text-secondary)",
            margin: 0,
            marginTop: 16,
          }}
        >
          {mission.brief}
        </p>
      </div>
    );
  }

  // B. Evaluation Rubric
  if (isReviewed && mission.rubric) {
    sections.push(
      <div key="rubric" style={{ padding: 24 }}>
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
          Your submission will be evaluated against these criteria
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {mission.rubric.map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <span
                style={{
                  fontFamily: font.mono,
                  fontSize: 12,
                  lineHeight: "22px",
                  fontWeight: 500,
                  color: "var(--color-text-tertiary)",
                  flexShrink: 0,
                  fontVariantNumeric: "tabular-nums",
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
      </div>
    );
  }

  // C. Submission History
  if (mission.submissions.length > 0) {
    const reversed = [...mission.submissions].reverse();
    sections.push(
      <div key="history" style={{ padding: 24 }}>
        <SectionLabel>Submission History</SectionLabel>
        <div style={{ marginTop: 16 }}>
          {reversed.map((sub, i) => (
            <div key={sub.id}>
              <SubmissionEntry submission={sub} isReviewed={isReviewed} />
              {i < reversed.length - 1 && (
                <div
                  style={{
                    height: 1,
                    backgroundColor: "var(--color-border-subtle)",
                    marginTop: 20,
                    marginBottom: 20,
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // D. Submit / Resubmit / Awaiting Review / Passed
  if (!submitSuccess) {
    if (showSubmitForm) {
      sections.push(
        <div key="submit" style={{ padding: 24 }}>
          <SectionLabel>
            {mission.status === "needs-revision" ? "Resubmit Your Work" : "Submit Your Work"}
          </SectionLabel>

          {mission.status === "needs-revision" && (
            <p
              style={{
                fontFamily: font.body,
                fontSize: 14,
                lineHeight: "22px",
                fontWeight: 400,
                color: "var(--color-text-secondary)",
                margin: 0,
                marginTop: 8,
                marginBottom: 24,
              }}
            >
              Address the mentor feedback above in your resubmission.
            </p>
          )}

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
                      isDragOver ? "var(--color-indigo)" : "var(--color-border-strong)"
                    }`,
                    borderRadius: 10,
                    padding: 20,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    minHeight: 64,
                    cursor: "pointer",
                    transitionProperty: "background-color, border-color",
                    transitionDuration: "var(--duration-fast)",
                    transitionTimingFunction: "var(--ease-out-quart)",
                  }}
                  onMouseEnter={(e) => {
                    if (!isDragOver) {
                      e.currentTarget.style.borderColor = "var(--color-indigo-border)";
                      e.currentTarget.style.backgroundColor = "var(--color-bg-surface-3)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isDragOver) {
                      e.currentTarget.style.borderColor = "var(--color-border-strong)";
                      e.currentTarget.style.backgroundColor = "var(--color-bg-surface-2)";
                    }
                  }}
                >
                  <Upload
                    style={{
                      width: 18,
                      height: 18,
                      color: "var(--color-text-tertiary)",
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontFamily: font.body,
                      fontSize: 13,
                      lineHeight: "18px",
                      fontWeight: 400,
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    Drop file here or click to upload
                  </span>
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
                      e.currentTarget.style.backgroundColor = "var(--color-bg-surface-3)";
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
                Note to mentor (optional)
              </label>
              <textarea
                value={noteValue}
                onChange={(e) => setNoteValue(e.target.value)}
                placeholder="Any context that might help your mentor..."
                rows={3}
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
            {!linkValue.trim() && !isSubmitting && (
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
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                Add a link to enable submission
              </p>
            )}
          </div>
        </div>
      );
    } else if (showAwaitingReview) {
      sections.push(
        <div key="awaiting" style={{ padding: 24 }}>
          <SectionLabel>Your Submission</SectionLabel>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16 }}>
            <Clock
              style={{
                width: 20,
                height: 20,
                color: "var(--color-text-tertiary)",
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
                Your mentor will review within 3–5 days.
              </p>
            </div>
          </div>
        </div>
      );
    } else if (showPassedState) {
      sections.push(
        <div key="passed" style={{ padding: 24 }}>
          <SectionLabel>Your Submission</SectionLabel>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16 }}>
            <CheckCircle
              style={{
                width: 20,
                height: 20,
                color: "var(--color-text-secondary)",
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
                Mission passed
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
                Great work. This mission is complete.
              </p>
            </div>
          </div>
        </div>
      );
    }
  } else {
    // Success state after submit
    sections.push(
      <div key="success" style={{ padding: 24 }}>
        <SectionLabel>Your Submission</SectionLabel>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16 }}>
          <CheckCircle
            style={{
              width: 20,
              height: 20,
              color: "var(--color-text-secondary)",
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
              {isReviewed
                ? "Your mentor will review within 3–5 days."
                : "Submission recorded. No review required."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
      {/* 1. BACK LINK + MISSION SEQUENCE */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 32,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <HoverLink href="/missions" style={{ fontFamily: font.body, fontSize: 13, lineHeight: "18px", fontWeight: 400 }}>
          ← Missions
        </HoverLink>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span
            style={{
              fontFamily: font.mono,
              fontSize: 11,
              lineHeight: "14px",
              fontWeight: 600,
              letterSpacing: "0.10em",
              textTransform: "uppercase",
              color: "var(--color-text-tertiary)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {`MISSION ${mission.number} OF ${String(adjacent.total).padStart(2, "0")}`}
          </span>

          {adjacent.prev && (
            <HoverLink
              href={`/missions/${adjacent.prev.slug}`}
              style={{ fontFamily: font.body, fontSize: 12, lineHeight: "16px", fontWeight: 400 }}
            >
              ← {adjacent.prev.title}
            </HoverLink>
          )}
          {adjacent.next && (
            <HoverLink
              href={`/missions/${adjacent.next.slug}`}
              style={{ fontFamily: font.body, fontSize: 12, lineHeight: "16px", fontWeight: 400 }}
            >
              {adjacent.next.title} →
            </HoverLink>
          )}
        </div>
      </div>

      {/* 2. PAGE HEADER */}
      <header>
        {/* Context line */}
        <p
          style={{
            fontFamily: font.mono,
            fontSize: 11,
            lineHeight: "14px",
            fontWeight: 500,
            textTransform: "uppercase",
            color: "var(--color-text-tertiary)",
            margin: 0,
            marginBottom: 12,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {`MISSION ${mission.number} · ${mission.unit} · ${mission.module}`}
        </p>

        {/* Title */}
        <h1
          style={{
            fontFamily: font.display,
            fontSize: 32,
            lineHeight: "38px",
            fontWeight: 600,
            letterSpacing: "-0.02em",
            color: "var(--color-text-primary)",
            margin: 0,
          }}
        >
          {mission.title}
        </h1>

        {/* Meta row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            flexWrap: "wrap",
            marginTop: 16,
          }}
        >
          {/* Type indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            {isReviewed ? (
              <GraduationCap
                style={{ width: 13, height: 13, color: "var(--color-text-tertiary)", flexShrink: 0 }}
              />
            ) : (
              <CheckSquare
                style={{ width: 13, height: 13, color: "var(--color-text-tertiary)", flexShrink: 0 }}
              />
            )}
            <span
              style={{
                fontFamily: font.body,
                fontSize: 13,
                lineHeight: "18px",
                fontWeight: 400,
                color: "var(--color-text-tertiary)",
              }}
            >
              {isReviewed ? "Mentor reviewed" : "Completion only"}
            </span>
          </div>

          <VerticalDivider />

          {/* Status */}
          <StatusIndicator status={mission.status} />

          {/* Due date — only for overdue + (needs-revision or not-started) */}
          {overdue && (
            <>
              <VerticalDivider />
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <AlertTriangle
                  style={{
                    width: 11,
                    height: 11,
                    color: "var(--color-text-secondary)",
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontFamily: font.mono,
                    fontSize: 11,
                    lineHeight: "14px",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    color: "var(--color-text-primary)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  OVERDUE
                </span>
              </div>
            </>
          )}

          {/* Future due date — only if not passed/submitted and not overdue */}
          {!overdue &&
            mission.status !== "passed" &&
            mission.status !== "submitted" &&
            mission.status !== "in-review" && (
              <>
                <VerticalDivider />
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
                  {`DUE ${formatDateShort(mission.dueAt)}`}
                </span>
              </>
            )}
        </div>

        {/* Divider */}
        <div
          style={{
            height: 1,
            backgroundColor: "var(--color-border-subtle)",
            marginTop: 24,
            marginBottom: 32,
          }}
        />
      </header>

      {/* 3. CONTENT SECTIONS — single outer container */}
      <div
        style={{
          border: "1px solid var(--color-border-subtle)",
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        {sections.map((section, i) => (
          <div key={i}>
            {section}
            {i < sections.length - 1 && (
              <div
                style={{
                  height: 1,
                  backgroundColor: "var(--color-border-subtle)",
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Bottom spacing */}
      <div style={{ height: 64 }} />
    </div>
  );
}

function SubmissionEntry({
  submission,
  isReviewed,
}: {
  submission: MissionSubmission;
  isReviewed: boolean;
}) {
  return (
    <div>
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
              fontVariantNumeric: "tabular-nums",
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
              fontVariantNumeric: "tabular-nums",
            }}
          >
            Submitted {formatDate(submission.submittedAt)}
          </p>
        </div>
        <SubmissionStatusIndicator status={submission.status} />
      </div>

      {/* Link row */}
      <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
        <ExternalLink
          style={{
            width: 13,
            height: 13,
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
              submission.review.outcome === "passed" ? "#333333" : "#F59E0B"
            }`,
            borderRadius: "0 8px 8px 0",
            padding: "16px 20px",
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
                  ? "var(--color-text-tertiary)"
                  : "#F59E0B"
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
                fontVariantNumeric: "tabular-nums",
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
              marginTop: 10,
            }}
          >
            {submission.review.comment}
          </p>
        </div>
      )}
    </div>
  );
}

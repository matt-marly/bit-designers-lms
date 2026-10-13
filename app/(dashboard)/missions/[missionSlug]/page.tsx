"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertTriangle, CheckSquare, ExternalLink, GraduationCap, Paperclip, X } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Markdown } from "@/components/markdown";
import { Toast, errorMessage, focusHandlers, useToast } from "@/components/admin/ui";
import { DraftNotice, LoadingLine, PageMessage, font, monoLabelStyle } from "@/components/learn/ui";
import { MissionStatusIndicator, isOverdue, longDate, shortDate } from "@/components/learn/missions";

type MissionDetail = NonNullable<FunctionReturnType<typeof api.missions.get>>;
type Submission = MissionDetail["submissions"][number];

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/webp"];
const NOTE_LIMIT = 2000;

const sectionStyle: React.CSSProperties = { padding: "28px 32px" };

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 44,
  padding: "0 14px",
  borderRadius: 10,
  backgroundColor: "var(--color-bg-surface-2)",
  border: "1px solid var(--color-border-strong)",
  color: "var(--color-text-primary)",
  fontFamily: font.body,
  fontSize: 14.5,
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: font.body,
  fontSize: 14,
  fontWeight: 500,
  color: "var(--color-text-primary)",
  marginBottom: 8,
};

const hintStyle: React.CSSProperties = {
  fontFamily: font.body,
  fontSize: 12,
  lineHeight: "18px",
  color: "var(--color-text-tertiary)",
  margin: "6px 0 0",
};

function displayUrl(url: string, max = 60) {
  const stripped = url.replace(/^https?:\/\//, "");
  return stripped.length <= max ? stripped : `${stripped.slice(0, max)}…`;
}

function formatBytes(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function MissionDetailPage() {
  const { missionSlug } = useParams<{ missionSlug: string }>();
  const data = useQuery(api.missions.get, { slug: missionSlug });

  if (data === undefined) return <LoadingLine>Loading mission…</LoadingLine>;
  if (data === null) {
    return (
      <PageMessage
        title="Mission not found"
        body="It may have been removed, or it isn't available to you yet."
        action={{ href: "/missions", label: "Back to Missions" }}
      />
    );
  }
  return <MissionView key={data.mission._id} data={data} />;
}

function MissionView({ data }: { data: MissionDetail }) {
  const { toast, showToast } = useToast();
  const { mission } = data;
  const isReviewed = mission.reviewType === "reviewed";
  const latest = data.submissions[0] ?? null;
  const overdue = isOverdue(data.dueAt, data.satisfied, data.status);
  const showDue = data.dueAt !== null && !data.satisfied && data.status !== "submitted" && data.status !== "in_review";

  return (
    <div className="mission-detail" style={{ maxWidth: 760, margin: "0 auto" }}>
      <style>{`
        @media (max-width: 768px) {
          .mission-detail .mission-title { font-size: 24px !important; line-height: 30px !important; }
          .mission-detail .mission-section { padding: 20px !important; }
          .mission-detail .mission-nav-row { flex-direction: column !important; align-items: flex-start !important; }
        }
      `}</style>

      <nav
        aria-label="Missions"
        className="mission-nav-row"
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32, flexWrap: "wrap", gap: 12 }}
      >
        <Link href="/missions" style={{ fontFamily: font.body, fontSize: 13, color: "var(--color-text-tertiary)", textDecoration: "none" }}>
          &larr; Missions
        </Link>
        <span style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <span style={monoLabelStyle}>
            Mission {mission.number} of {String(data.total).padStart(2, "0")}
          </span>
          {data.prev && (
            <Link href={`/missions/${data.prev.slug}`} style={{ fontFamily: font.body, fontSize: 12, color: "var(--color-text-tertiary)", textDecoration: "none" }}>
              &larr; {data.prev.title}
            </Link>
          )}
          {data.next && (
            <Link href={`/missions/${data.next.slug}`} style={{ fontFamily: font.body, fontSize: 12, color: "var(--color-text-tertiary)", textDecoration: "none" }}>
              {data.next.title} &rarr;
            </Link>
          )}
        </span>
      </nav>

      {data.module.status === "draft" && (
        <div style={{ marginBottom: 20 }}>
          <DraftNotice />
        </div>
      )}

      <header>
        <p style={{ ...monoLabelStyle, fontWeight: 500, margin: 0, marginBottom: 12 }}>
          Unit {data.unit.number} ·{" "}
          <Link href={`/learn/${data.module.slug}`} style={{ color: "inherit", textDecoration: "none" }}>
            {data.module.title}
          </Link>
        </p>
        <h1
          className="mission-title"
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
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", marginTop: 16 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            {isReviewed ? (
              <GraduationCap aria-hidden style={{ width: 13, height: 13, color: "var(--color-text-tertiary)" }} />
            ) : (
              <CheckSquare aria-hidden style={{ width: 13, height: 13, color: "var(--color-text-tertiary)" }} />
            )}
            <span style={{ fontFamily: font.body, fontSize: 13, color: "var(--color-text-tertiary)" }}>
              {isReviewed ? "Mentor reviewed" : "Done on submit"}
            </span>
          </span>
          <span aria-hidden style={{ width: 1, height: 14, backgroundColor: "var(--color-border-strong)" }} />
          <MissionStatusIndicator status={data.status} reviewType={mission.reviewType} />
          {overdue && data.dueAt !== null ? (
            <>
              <span aria-hidden style={{ width: 1, height: 14, backgroundColor: "var(--color-border-strong)" }} />
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, ...monoLabelStyle, color: "#F87171" }}>
                <AlertTriangle aria-hidden style={{ width: 11, height: 11 }} />
                Overdue since {shortDate(data.dueAt)}
              </span>
            </>
          ) : showDue && data.dueAt !== null ? (
            <>
              <span aria-hidden style={{ width: 1, height: 14, backgroundColor: "var(--color-border-strong)" }} />
              <span style={{ ...monoLabelStyle, fontWeight: 500 }}>Due {longDate(data.dueAt)}</span>
            </>
          ) : null}
        </div>
        <div style={{ height: 1, backgroundColor: "var(--color-border-subtle)", marginTop: 24, marginBottom: 32 }} />
      </header>

      <div style={{ border: "1px solid var(--color-border-subtle)", borderRadius: 14, overflow: "hidden", backgroundColor: "var(--color-bg-surface)" }}>
        <section className="mission-section" style={sectionStyle} aria-labelledby="brief-heading">
          <h2 id="brief-heading" style={{ ...monoLabelStyle, margin: "0 0 16px" }}>
            The brief
          </h2>
          {mission.brief.trim() ? (
            <Markdown>{mission.brief}</Markdown>
          ) : (
            <p style={{ fontFamily: font.body, fontSize: 14, color: "var(--color-text-tertiary)", margin: 0 }}>
              Your mentors haven&apos;t written the brief yet.
            </p>
          )}
        </section>

        {mission.rubric.length > 0 && (
          <section
            className="mission-section"
            style={{ ...sectionStyle, borderTop: "1px solid var(--color-border-subtle)" }}
            aria-labelledby="rubric-heading"
          >
            <h2 id="rubric-heading" style={{ ...monoLabelStyle, margin: "0 0 14px" }}>
              {isReviewed ? "What reviewers look for" : "Checklist"}
            </h2>
            <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 10 }}>
              {mission.rubric.map((criterion, i) => (
                <li key={i} style={{ display: "flex", gap: 12, fontFamily: font.body, fontSize: 14.5, lineHeight: "22px", color: "var(--color-text-secondary)" }}>
                  <span style={{ fontFamily: font.mono, fontSize: 11, lineHeight: "22px", color: "var(--color-text-tertiary)", fontVariantNumeric: "tabular-nums" }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {criterion}
                </li>
              ))}
            </ol>
          </section>
        )}

        <section
          className="mission-section"
          style={{ ...sectionStyle, borderTop: "1px solid var(--color-border-subtle)" }}
          aria-labelledby="submit-heading"
        >
          <h2 id="submit-heading" style={{ ...monoLabelStyle, margin: "0 0 16px" }}>
            {latest === null ? "Submit your work" : data.canSubmit ? "Submit a new version" : "Your submission"}
          </h2>
          {data.canSubmit ? (
            <SubmitForm
              missionId={mission._id}
              isReviewed={isReviewed}
              initialLink={latest?.linkUrl ?? ""}
              version={(latest?.version ?? 0) + 1}
              onToast={showToast}
            />
          ) : (
            <SubmitStatus data={data} />
          )}
        </section>

        {data.submissions.length > 0 && (
          <section
            className="mission-section"
            style={{ ...sectionStyle, borderTop: "1px solid var(--color-border-subtle)" }}
            aria-labelledby="history-heading"
          >
            <h2 id="history-heading" style={{ ...monoLabelStyle, margin: "0 0 16px" }}>
              History
            </h2>
            <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 12 }}>
              {data.submissions.map((submission) => (
                <SubmissionEntry key={submission._id} submission={submission} rubric={mission.rubric} reviewType={mission.reviewType} />
              ))}
            </ol>
          </section>
        )}
      </div>

      <div style={{ height: 64 }} />
      <Toast toast={toast} />
    </div>
  );
}

function SubmitStatus({ data }: { data: MissionDetail }) {
  let message: string;
  if (data.isAlumni) {
    message = "Your cohort has ended. Your work is preserved here, but you can't submit new versions.";
  } else if (!data.isStudent) {
    message = "Only students in this track can submit work. You're seeing the learner view.";
  } else if (data.module.status !== "published") {
    message = "This module is a draft, so submissions are closed.";
  } else if (data.status === "passed") {
    message =
      data.mission.reviewType === "reviewed"
        ? "Your work passed. Nice job."
        : "You've submitted this mission. It counts toward your module.";
  } else {
    message = "Your work is with the mentors. You'll see their feedback here once it's reviewed.";
  }
  return <p style={{ fontFamily: font.body, fontSize: 14.5, lineHeight: "22px", color: "var(--color-text-secondary)", margin: 0 }}>{message}</p>;
}

function SubmitForm({
  missionId,
  isReviewed,
  initialLink,
  version,
  onToast,
}: {
  missionId: Id<"missions">;
  isReviewed: boolean;
  initialLink: string;
  version: number;
  onToast: ReturnType<typeof useToast>["showToast"];
}) {
  const generateUploadUrl = useMutation(api.missions.generateUploadUrl);
  const submit = useMutation(api.missions.submit);
  const [link, setLink] = useState(initialLink);
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  function pickFile(picked: File | undefined) {
    setError(null);
    if (!picked) return;
    if (!ALLOWED_TYPES.includes(picked.type)) {
      setError("Attach a PDF, PNG, JPG or WebP file.");
      if (fileInput.current) fileInput.current.value = "";
      return;
    }
    if (picked.size > MAX_FILE_BYTES) {
      setError(`That file is ${formatBytes(picked.size)}. Files must be 10 MB or smaller.`);
      if (fileInput.current) fileInput.current.value = "";
      return;
    }
    setFile(picked);
  }

  function clearFile() {
    setFile(null);
    if (fileInput.current) fileInput.current.value = "";
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      let fileId: Id<"_storage"> | undefined;
      if (file) {
        const url = await generateUploadUrl({ missionId });
        const response = await fetch(url, { method: "POST", headers: { "Content-Type": file.type }, body: file });
        if (!response.ok) throw new Error("upload failed");
        fileId = ((await response.json()) as { storageId: Id<"_storage"> }).storageId;
      }
      const result = await submit({ missionId, linkUrl: link, fileId, fileName: file?.name, note: note || undefined });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onToast(
        result.moduleComplete
          ? "Submitted. That finishes the module."
          : isReviewed
            ? "Submitted. Your mentors will review it."
            : "Submitted. This mission is done.",
      );
    } catch (err) {
      setError(err instanceof Error && err.message === "upload failed" ? "The file didn't upload. Check your connection and try again." : errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <div style={{ display: "grid", gap: 20 }}>
        <div>
          <label htmlFor="submission-link" style={labelStyle}>
            Link to your work
          </label>
          <input
            id="submission-link"
            type="url"
            inputMode="url"
            required
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://www.figma.com/file/…"
            maxLength={1000}
            aria-describedby="submission-link-hint"
            style={inputStyle}
            {...focusHandlers}
          />
          <p id="submission-link-hint" style={hintStyle}>
            Figma, Notion, Google Docs, GitHub — anything your mentors can open. Check the sharing settings.
          </p>
        </div>

        <div>
          <span id="submission-file-label" style={labelStyle}>
            File <span style={{ color: "var(--color-text-tertiary)", fontWeight: 400 }}>(optional)</span>
          </span>
          {file ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid var(--color-border-strong)",
                backgroundColor: "var(--color-bg-surface-2)",
              }}
            >
              <Paperclip aria-hidden style={{ width: 14, height: 14, color: "var(--color-text-tertiary)", flexShrink: 0 }} />
              <span style={{ flex: 1, minWidth: 0, fontFamily: font.body, fontSize: 14, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {file.name}
              </span>
              <span style={{ fontFamily: font.mono, fontSize: 11, color: "var(--color-text-tertiary)" }}>{formatBytes(file.size)}</span>
              <button
                type="button"
                onClick={clearFile}
                aria-label={`Remove ${file.name}`}
                style={{ display: "inline-flex", border: "none", background: "none", padding: 4, cursor: "pointer", color: "var(--color-text-tertiary)" }}
              >
                <X aria-hidden style={{ width: 14, height: 14 }} />
              </button>
            </div>
          ) : (
            <label
              htmlFor="submission-file"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                height: 64,
                borderRadius: 10,
                border: "1px dashed var(--color-border-strong)",
                fontFamily: font.body,
                fontSize: 14,
                color: "var(--color-text-secondary)",
                cursor: "pointer",
              }}
            >
              <Paperclip aria-hidden style={{ width: 14, height: 14 }} />
              Attach a PDF or image
            </label>
          )}
          <input
            ref={fileInput}
            id="submission-file"
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp"
            aria-labelledby="submission-file-label"
            aria-describedby="submission-file-hint"
            onChange={(e) => pickFile(e.target.files?.[0])}
            className="sr-only"
          />
          <p id="submission-file-hint" style={hintStyle}>
            PDF, PNG, JPG or WebP, up to 10 MB.
          </p>
        </div>

        <div>
          <label htmlFor="submission-note" style={labelStyle}>
            Note for your mentor <span style={{ color: "var(--color-text-tertiary)", fontWeight: 400 }}>(optional)</span>
          </label>
          <textarea
            id="submission-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            maxLength={NOTE_LIMIT}
            placeholder={version > 1 ? "What did you change since the last version?" : "Anything you'd like feedback on?"}
            style={{ ...inputStyle, height: "auto", padding: "12px 14px", lineHeight: "22px", resize: "vertical" }}
            {...focusHandlers}
          />
        </div>

        {error && (
          <p role="alert" style={{ fontFamily: font.body, fontSize: 13, color: "#F87171", margin: 0 }}>
            {error}
          </p>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <button
            type="submit"
            disabled={busy || !link.trim()}
            style={{
              height: 44,
              padding: "0 24px",
              borderRadius: 10,
              border: "none",
              backgroundColor: "var(--color-indigo)",
              color: "#FFFFFF",
              fontFamily: font.body,
              fontSize: 14.5,
              fontWeight: 600,
              cursor: busy || !link.trim() ? "not-allowed" : "pointer",
              opacity: busy || !link.trim() ? 0.5 : 1,
            }}
          >
            {busy ? (file ? "Uploading…" : "Submitting…") : version > 1 ? `Submit version ${version}` : "Submit"}
          </button>
          <span style={{ fontFamily: font.body, fontSize: 12, color: "var(--color-text-tertiary)" }}>
            {isReviewed ? "A mentor will pass it or ask for changes." : "This counts as done once you submit."}
          </span>
        </div>
      </div>
    </form>
  );
}

function SubmissionEntry({
  submission,
  rubric,
  reviewType,
}: {
  submission: Submission;
  rubric: string[];
  reviewType: MissionDetail["mission"]["reviewType"];
}) {
  const review = submission.review;
  const passed = review?.outcome === "passed";
  return (
    <li style={{ border: "1px solid var(--color-border-subtle)", borderRadius: 10, padding: "14px 16px", backgroundColor: "#0D0D0D" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span style={monoLabelStyle}>Version {submission.version}</span>
        <span style={{ fontFamily: font.body, fontSize: 12, color: "var(--color-text-tertiary)" }}>{longDate(submission.submittedAt)}</span>
        {submission.isLate && <span style={{ ...monoLabelStyle, color: "#FBBF24" }}>Late</span>}
        <span style={{ marginLeft: "auto" }}>
          <MissionStatusIndicator status={submission.status} reviewType={reviewType} size={12} />
        </span>
      </div>
      <div style={{ display: "grid", gap: 6, marginTop: 10 }}>
        <a
          href={submission.linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: font.body, fontSize: 14, color: "#A5B4FC", textDecoration: "none", minWidth: 0 }}
        >
          <ExternalLink aria-hidden style={{ width: 13, height: 13, flexShrink: 0 }} />
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayUrl(submission.linkUrl)}</span>
        </a>
        {submission.fileUrl && (
          <a
            href={submission.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: font.body, fontSize: 14, color: "#A5B4FC", textDecoration: "none" }}
          >
            <Paperclip aria-hidden style={{ width: 13, height: 13, flexShrink: 0 }} />
            {submission.fileName ?? "Attachment"}
          </a>
        )}
        {submission.note && (
          <p style={{ fontFamily: font.body, fontSize: 13, lineHeight: "20px", color: "var(--color-text-tertiary)", margin: 0, whiteSpace: "pre-wrap" }}>
            {submission.note}
          </p>
        )}
      </div>
      {review && (
        <div
          style={{
            marginTop: 12,
            padding: "12px 14px",
            borderRadius: 10,
            border: `1px solid ${passed ? "rgba(34,197,94,0.25)" : "rgba(245,158,11,0.25)"}`,
            backgroundColor: passed ? "rgba(34,197,94,0.06)" : "rgba(245,158,11,0.06)",
          }}
        >
          <p style={{ fontFamily: font.body, fontSize: 13, margin: 0, color: "var(--color-text-tertiary)" }}>
            <span style={{ fontWeight: 500, color: passed ? "#4ADE80" : "#FBBF24" }}>{passed ? "Passed" : "Needs revision"}</span> ·{" "}
            {review.reviewerName} · {shortDate(review.reviewedAt)}
          </p>
          <p style={{ fontFamily: font.body, fontSize: 14.5, lineHeight: "22px", color: "var(--color-text-primary)", margin: "8px 0 0", whiteSpace: "pre-wrap" }}>
            {review.comment}
          </p>
          {review.rubricChecks && review.rubricChecks.length === rubric.length && rubric.length > 0 && (
            <ul style={{ listStyle: "none", margin: "10px 0 0", padding: 0, display: "grid", gap: 4 }}>
              {rubric.map((criterion, i) => {
                const met = review.rubricChecks?.[i] === true;
                return (
                  <li key={i} style={{ display: "flex", gap: 8, fontFamily: font.body, fontSize: 13, lineHeight: "20px", color: met ? "var(--color-text-secondary)" : "var(--color-text-tertiary)" }}>
                    <span aria-hidden style={{ color: met ? "#4ADE80" : "var(--color-text-tertiary)" }}>{met ? "✓" : "–"}</span>
                    <span>
                      <span className="sr-only">{met ? "Met: " : "Not yet: "}</span>
                      {criterion}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </li>
  );
}

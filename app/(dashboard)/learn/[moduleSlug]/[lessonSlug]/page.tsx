"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, ExternalLink } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "@/convex/_generated/api";
import { Markdown } from "@/components/markdown";
import { DraftNotice, LoadingLine, PageMessage, font, monoLabelStyle } from "@/components/learn/ui";
import { errorMessage } from "@/components/admin/ui";
import { readingMinutes, videoEmbedUrl } from "@/lib/video";

export default function LessonPage() {
  const { moduleSlug, lessonSlug } = useParams<{ moduleSlug: string; lessonSlug: string }>();
  const data = useQuery(api.curriculum.getLesson, { moduleSlug, lessonSlug });

  if (data === undefined) return <LoadingLine>Loading lesson…</LoadingLine>;
  if (data === null) {
    return (
      <PageMessage
        title="Lesson not found"
        body="It may have been renamed, moved, or unpublished."
        action={{ href: `/learn/${moduleSlug}`, label: "Back to the module" }}
      />
    );
  }

  return <Lesson key={data.lesson._id} data={data} />;
}

type LessonData = NonNullable<FunctionReturnType<typeof api.curriculum.getLesson>>;

function Lesson({ data }: { data: LessonData }) {
  const { module: mod, lesson, lessons } = data;
  const setComplete = useMutation(api.curriculum.setLessonComplete);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [moduleJustCompleted, setModuleJustCompleted] = useState(false);

  const embed = lesson.videoUrl ? videoEmbedUrl(lesson.videoUrl) : null;
  const minutes = readingMinutes(lesson.body);
  const allDone = lessons.every((l) => l.completed);
  const pendingMission = data.missions.find((m) => !m.satisfied);
  const missionsLeft = data.missions.filter((m) => !m.satisfied).length;

  async function toggleComplete() {
    setSaving(true);
    setError(null);
    try {
      const result = await setComplete({ lessonId: lesson._id, complete: !data.completed });
      setModuleJustCompleted(!data.completed && result.moduleComplete);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div
        className="doc-top-bar"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          backgroundColor: "var(--color-bg-base)",
          borderBottom: "1px solid var(--color-border-subtle)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          margin: "0 -32px",
          padding: "12px 32px",
        }}
      >
        <Link
          href={`/learn/${mod.slug}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontFamily: font.body,
            fontSize: 13,
            color: "var(--color-text-tertiary)",
            textDecoration: "none",
            minWidth: 0,
          }}
        >
          <ArrowLeft size={14} aria-hidden style={{ flexShrink: 0 }} />
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{mod.title}</span>
        </Link>
        <span style={{ ...monoLabelStyle, whiteSpace: "nowrap" }}>
          Lesson {lesson.number} of {String(lessons.length).padStart(2, "0")} · {minutes} min read
        </span>
      </div>

      <div className="doc-content" style={{ maxWidth: 720, margin: "0 auto", paddingTop: 40 }}>
        {mod.status === "draft" && (
          <div style={{ marginBottom: 24 }}>
            <DraftNotice />
          </div>
        )}

        <span style={monoLabelStyle}>
          {data.track.name} · {mod.title}
        </span>
        <h1
          style={{
            fontFamily: font.display,
            fontSize: 32,
            lineHeight: "38px",
            fontWeight: 600,
            letterSpacing: "-0.02em",
            color: "var(--color-text-primary)",
            margin: "12px 0 0",
          }}
        >
          {lesson.title}
        </h1>
        {lesson.summary && (
          <p style={{ fontFamily: font.body, fontSize: 16, lineHeight: "26px", color: "var(--color-text-secondary)", margin: "12px 0 0" }}>
            {lesson.summary}
          </p>
        )}

        {lesson.videoUrl &&
          (embed ? (
            <div
              style={{
                position: "relative",
                marginTop: 32,
                aspectRatio: "16 / 9",
                borderRadius: 14,
                overflow: "hidden",
                border: "1px solid var(--color-border-subtle)",
                backgroundColor: "#000",
              }}
            >
              <iframe
                src={embed}
                title={`Video: ${lesson.title}`}
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
                loading="lazy"
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
              />
            </div>
          ) : (
            <a
              href={lesson.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                marginTop: 24,
                fontFamily: font.body,
                fontSize: 14,
                color: "#A5B4FC",
              }}
            >
              Watch the video <ExternalLink size={14} aria-hidden />
            </a>
          ))}

        <div style={{ height: 1, backgroundColor: "var(--color-border-subtle)", margin: "32px 0 40px" }} />

        <article style={{ maxWidth: "68ch" }}>
          {lesson.body.trim() ? (
            <Markdown>{lesson.body}</Markdown>
          ) : (
            <p style={{ fontFamily: font.body, fontSize: 15, color: "var(--color-text-tertiary)", margin: 0 }}>
              This lesson doesn&apos;t have any written content yet.
            </p>
          )}
        </article>

        {lesson.transcript && (
          <details style={{ marginTop: 40, borderTop: "1px solid var(--color-border-subtle)", paddingTop: 20 }}>
            <summary style={{ ...monoLabelStyle, cursor: "pointer", display: "list-item" }}>Video transcript</summary>
            <p
              style={{
                fontFamily: font.body,
                fontSize: 14,
                lineHeight: "24px",
                color: "var(--color-text-secondary)",
                whiteSpace: "pre-wrap",
                margin: "16px 0 0",
                maxWidth: "68ch",
              }}
            >
              {lesson.transcript}
            </p>
          </details>
        )}

        <section aria-label="Lesson completion" style={{ marginTop: 56 }}>
          <button
            type="button"
            onClick={toggleComplete}
            disabled={saving}
            aria-pressed={data.completed}
            style={{
              width: "100%",
              height: 48,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              borderRadius: 10,
              border: data.completed ? "1px solid rgba(34,197,94,0.30)" : "none",
              backgroundColor: data.completed ? "rgba(34,197,94,0.08)" : "var(--color-indigo)",
              color: data.completed ? "#4ADE80" : "#FFFFFF",
              fontFamily: font.body,
              fontSize: 15,
              fontWeight: 500,
              cursor: saving ? "wait" : "pointer",
              opacity: saving ? 0.7 : 1,
              transitionProperty: "background-color, color, border-color",
              transitionDuration: "var(--duration-fast)",
            }}
          >
            {data.completed ? (
              <>
                <CheckCircle2 size={18} aria-hidden /> Completed
              </>
            ) : (
              <>
                <Check size={18} aria-hidden /> Mark lesson complete
              </>
            )}
          </button>
          {data.completed && (
            <p style={{ fontFamily: font.body, fontSize: 12, color: "var(--color-text-tertiary)", textAlign: "center", margin: "8px 0 0" }}>
              Click again to mark it as not done.
            </p>
          )}
          {error && (
            <p role="alert" style={{ fontFamily: font.body, fontSize: 13, color: "#F87171", textAlign: "center", margin: "8px 0 0" }}>
              {error}
            </p>
          )}
          <div aria-live="polite">
            {allDone && pendingMission ? (
              <div
                style={{
                  marginTop: 20,
                  padding: "16px 20px",
                  borderRadius: 14,
                  backgroundColor: "rgba(99,102,241,0.06)",
                  border: "1px solid rgba(99,102,241,0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                  flexWrap: "wrap",
                }}
              >
                <span style={{ fontFamily: font.body, fontSize: 14, color: "#FFFFFF" }}>
                  Lessons done.{" "}
                  {missionsLeft === 1
                    ? "One mission left to finish this module."
                    : `${missionsLeft} missions left to finish this module.`}
                </span>
                <Link
                  href={`/missions/${pendingMission.slug}`}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: font.body, fontSize: 14, fontWeight: 500, color: "#A5B4FC" }}
                >
                  {pendingMission.title} <ArrowRight size={14} aria-hidden />
                </Link>
              </div>
            ) : (moduleJustCompleted || (allDone && !data.next)) && (
              <div
                style={{
                  marginTop: 20,
                  padding: "16px 20px",
                  borderRadius: 14,
                  backgroundColor: "rgba(34,197,94,0.06)",
                  border: "1px solid rgba(34,197,94,0.20)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                  flexWrap: "wrap",
                }}
              >
                <span style={{ fontFamily: font.body, fontSize: 14, color: "#FFFFFF" }}>
                  You&apos;ve finished {mod.title}.
                </span>
                {data.nextModule ? (
                  <Link
                    href={`/learn/${data.nextModule.slug}`}
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: font.body, fontSize: 14, fontWeight: 500, color: "#A5B4FC" }}
                  >
                    Next module: {data.nextModule.title} <ArrowRight size={14} aria-hidden />
                  </Link>
                ) : (
                  <Link href="/learn" style={{ fontFamily: font.body, fontSize: 14, fontWeight: 500, color: "#A5B4FC" }}>
                    Back to all modules
                  </Link>
                )}
              </div>
            )}
          </div>
        </section>

        <nav
          aria-label="Lessons"
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            marginTop: 40,
            paddingTop: 24,
            paddingBottom: 48,
            borderTop: "1px solid var(--color-border-subtle)",
          }}
        >
          {data.prev ? (
            <LessonNavLink href={`/learn/${mod.slug}/${data.prev.slug}`} label="← Previous" title={data.prev.title} />
          ) : (
            <span />
          )}
          {data.next ? (
            <LessonNavLink href={`/learn/${mod.slug}/${data.next.slug}`} label="Next →" title={data.next.title} alignEnd />
          ) : data.nextModule ? (
            <LessonNavLink href={`/learn/${data.nextModule.slug}`} label="Next module →" title={data.nextModule.title} alignEnd />
          ) : null}
        </nav>
      </div>
    </div>
  );
}

function LessonNavLink({ href, label, title, alignEnd }: { href: string; label: string; title: string; alignEnd?: boolean }) {
  return (
    <Link
      href={href}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: alignEnd ? "flex-end" : "flex-start",
        textAlign: alignEnd ? "right" : "left",
        gap: 4,
        maxWidth: "48%",
        textDecoration: "none",
      }}
    >
      <span style={monoLabelStyle}>{label}</span>
      <span style={{ fontFamily: font.body, fontSize: 14, fontWeight: 500, color: "var(--color-text-primary)" }}>{title}</span>
    </Link>
  );
}

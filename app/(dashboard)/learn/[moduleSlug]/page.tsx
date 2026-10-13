"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, Circle, Info, PlayCircle, Target } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { MissionStatusIndicator } from "@/components/learn/missions";
import {
  DraftNotice,
  LoadingLine,
  PageMessage,
  ProgressBar,
  font,
  monoLabelStyle,
} from "@/components/learn/ui";

export default function ModulePage() {
  const { moduleSlug } = useParams<{ moduleSlug: string }>();
  const data = useQuery(api.curriculum.getModule, { slug: moduleSlug });

  if (data === undefined) return <LoadingLine>Loading module…</LoadingLine>;
  if (data === null) {
    return (
      <PageMessage
        title="Module not found"
        body="It may have been moved, unpublished, or it belongs to a track you're not in."
        action={{ href: "/learn", label: "Back to Learn" }}
      />
    );
  }

  const { module: mod, unit, lessons, missions } = data;
  const completed = lessons.filter((l) => l.completed).length;
  const started = completed > 0;
  const ctaLabel = data.isComplete ? "Review module" : started ? "Continue" : "Start module";
  const missionsLeft = missions.filter((m) => !m.satisfied).length;
  const lessonsDone = lessons.length > 0 && completed === lessons.length;
  const progressLabel = data.isComplete
    ? "Module complete"
    : lessonsDone && missionsLeft > 0
      ? `Lessons done · ${missionsLeft} ${missionsLeft === 1 ? "mission" : "missions"} left`
      : `${completed} of ${lessons.length} lessons complete`;

  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
      <Link
        href="/learn"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontFamily: font.body,
          fontSize: 13,
          color: "var(--color-text-tertiary)",
          textDecoration: "none",
        }}
      >
        <ArrowLeft size={14} aria-hidden /> All modules
      </Link>

      <header style={{ marginTop: 24 }}>
        <span style={monoLabelStyle}>
          {data.track.name} · Unit {unit.number} · Module {mod.number}
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
          {mod.title}
        </h1>
        {mod.description && (
          <p style={{ fontFamily: font.body, fontSize: 16, lineHeight: "26px", color: "var(--color-text-secondary)", margin: "12px 0 0" }}>
            {mod.description}
          </p>
        )}
      </header>

      <div style={{ display: "grid", gap: 12, marginTop: 24 }}>
        {mod.status === "draft" && <DraftNotice />}
        {data.previousIncomplete && !started && (
          <div
            role="note"
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              padding: "12px 14px",
              borderRadius: 10,
              backgroundColor: "var(--color-bg-surface-2)",
              border: "1px solid var(--color-border-subtle)",
              fontFamily: font.body,
              fontSize: 14,
              lineHeight: "20px",
              color: "var(--color-text-secondary)",
            }}
          >
            <Info size={16} aria-hidden style={{ flexShrink: 0, marginTop: 2, color: "var(--color-text-tertiary)" }} />
            <span>
              This module builds on{" "}
              <Link href={`/learn/${data.previousIncomplete.slug}`} style={{ color: "#A5B4FC" }}>
                {data.previousIncomplete.title}
              </Link>
              , which you haven&apos;t finished. You can still start here.
            </span>
          </div>
        )}
      </div>

      <section
        aria-label="Module progress"
        style={{
          marginTop: 28,
          padding: 20,
          borderRadius: 14,
          backgroundColor: "var(--color-bg-surface)",
          border: "1px solid var(--color-border-subtle)",
          display: "flex",
          alignItems: "center",
          gap: 20,
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: "1 1 240px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontFamily: font.mono, fontSize: 12, color: data.isComplete ? "#4ADE80" : "var(--color-text-tertiary)" }}>
              {progressLabel}
            </span>
          </div>
          <ProgressBar value={lessons.length ? completed / lessons.length : 0} label="Module progress" />
        </div>
        {data.continueLessonSlug && (
          <Link
            href={`/learn/${mod.slug}/${data.continueLessonSlug}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              height: 40,
              padding: "0 16px",
              borderRadius: 10,
              backgroundColor: data.isComplete ? "transparent" : "var(--color-indigo)",
              border: data.isComplete ? "1px solid var(--color-border-strong)" : "none",
              color: "#FFFFFF",
              fontFamily: font.body,
              fontSize: 14.5,
              fontWeight: 500,
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            {ctaLabel} <ArrowRight size={16} aria-hidden />
          </Link>
        )}
      </section>

      {mod.objectives.length > 0 && (
        <section style={{ marginTop: 40 }}>
          <h2 style={{ ...monoLabelStyle, margin: 0 }}>What you&apos;ll learn</h2>
          <ul style={{ listStyle: "none", margin: "16px 0 0", padding: 0, display: "grid", gap: 10 }}>
            {mod.objectives.map((objective) => (
              <li
                key={objective}
                style={{
                  display: "flex",
                  gap: 12,
                  fontFamily: font.body,
                  fontSize: 15,
                  lineHeight: "24px",
                  color: "var(--color-text-secondary)",
                }}
              >
                <span aria-hidden style={{ color: "#A5B4FC", fontFamily: font.mono, flexShrink: 0 }}>
                  →
                </span>
                {objective}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section style={{ marginTop: 40 }}>
        <h2 style={{ ...monoLabelStyle, margin: 0 }}>Lessons</h2>
        {lessons.length === 0 ? (
          <p style={{ fontFamily: font.body, fontSize: 14, color: "var(--color-text-tertiary)", marginTop: 16 }}>
            No lessons in this module yet.
          </p>
        ) : (
          <ol
            style={{
              listStyle: "none",
              margin: "16px 0 0",
              padding: 0,
              border: "1px solid var(--color-border-subtle)",
              borderRadius: 14,
              overflow: "hidden",
            }}
          >
            {lessons.map((lesson, i) => {
              const isNext = lesson.slug === data.continueLessonSlug && !data.isComplete;
              return (
                <li key={lesson._id} style={{ borderTop: i === 0 ? "none" : "1px solid var(--color-border-subtle)" }}>
                  <Link
                    href={`/learn/${mod.slug}/${lesson.slug}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      padding: "16px 20px",
                      backgroundColor: isNext ? "rgba(99,102,241,0.06)" : "var(--color-bg-surface)",
                      textDecoration: "none",
                      transitionProperty: "background-color",
                      transitionDuration: "120ms",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#161616")}
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = isNext ? "rgba(99,102,241,0.06)" : "var(--color-bg-surface)")
                    }
                  >
                    {lesson.completed ? (
                      <CheckCircle2 size={18} aria-label="Completed" style={{ color: "#4ADE80", flexShrink: 0 }} />
                    ) : (
                      <Circle size={18} aria-label="Not completed" style={{ color: "var(--color-border-strong)", flexShrink: 0 }} />
                    )}
                    <span style={{ fontFamily: font.mono, fontSize: 12, color: "var(--color-text-tertiary)", flexShrink: 0 }}>
                      {lesson.number}
                    </span>
                    <span
                      style={{
                        flex: 1,
                        minWidth: 0,
                        fontFamily: font.body,
                        fontSize: 15,
                        fontWeight: 500,
                        color: "var(--color-text-primary)",
                      }}
                    >
                      {lesson.title}
                    </span>
                    {lesson.hasVideo && (
                      <PlayCircle size={16} aria-label="Includes video" style={{ color: "var(--color-text-tertiary)", flexShrink: 0 }} />
                    )}
                    {isNext && (
                      <span style={{ ...monoLabelStyle, color: "#A5B4FC", flexShrink: 0 }}>{started ? "Up next" : "Start"}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      {missions.length > 0 && (
        <section style={{ marginTop: 40 }}>
          <h2 style={{ ...monoLabelStyle, margin: 0 }}>Missions</h2>
          <p style={{ fontFamily: font.body, fontSize: 14, lineHeight: "20px", color: "var(--color-text-tertiary)", margin: "8px 0 0" }}>
            Finish every lesson and mission to complete this module.
            {missions.some((m) => m.reviewType === "reviewed") && " Reviewed missions count once a mentor passes them."}
          </p>
          <ul
            style={{
              listStyle: "none",
              margin: "16px 0 0",
              padding: 0,
              border: "1px solid var(--color-border-subtle)",
              borderRadius: 14,
              overflow: "hidden",
            }}
          >
            {missions.map((mission, i) => (
              <li key={mission._id} style={{ borderTop: i === 0 ? "none" : "1px solid var(--color-border-subtle)" }}>
                <Link
                  href={`/missions/${mission.slug}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "16px 20px",
                    backgroundColor: "var(--color-bg-surface)",
                    textDecoration: "none",
                    transitionProperty: "background-color",
                    transitionDuration: "120ms",
                    flexWrap: "wrap",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#161616")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--color-bg-surface)")}
                >
                  <Target size={18} aria-hidden style={{ color: mission.satisfied ? "#4ADE80" : "#A5B4FC", flexShrink: 0 }} />
                  <span
                    style={{
                      flex: "1 1 200px",
                      minWidth: 0,
                      fontFamily: font.body,
                      fontSize: 15,
                      fontWeight: 500,
                      color: "var(--color-text-primary)",
                    }}
                  >
                    {mission.title}
                  </span>
                  <span style={{ ...monoLabelStyle, flexShrink: 0 }}>
                    {mission.reviewType === "reviewed" ? "Reviewed" : "Completion"}
                  </span>
                  <MissionStatusIndicator status={mission.status} reviewType={mission.reviewType} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <nav
        aria-label="Modules"
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 16,
          marginTop: 48,
          paddingTop: 24,
          borderTop: "1px solid var(--color-border-subtle)",
          flexWrap: "wrap",
        }}
      >
        {data.prev ? <ModuleNavLink direction="prev" link={data.prev} /> : <span />}
        {data.next && <ModuleNavLink direction="next" link={data.next} />}
      </nav>
    </div>
  );
}

function ModuleNavLink({ direction, link }: { direction: "prev" | "next"; link: { slug: string; title: string } }) {
  return (
    <Link
      href={`/learn/${link.slug}`}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: direction === "next" ? "flex-end" : "flex-start",
        gap: 4,
        textDecoration: "none",
        maxWidth: "48%",
        textAlign: direction === "next" ? "right" : "left",
      }}
    >
      <span style={monoLabelStyle}>{direction === "next" ? "Next module →" : "← Previous module"}</span>
      <span style={{ fontFamily: font.body, fontSize: 14, fontWeight: 500, color: "var(--color-text-primary)" }}>{link.title}</span>
    </Link>
  );
}

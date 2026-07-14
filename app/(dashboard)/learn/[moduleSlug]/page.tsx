"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  CheckCircle,
  PlayCircle,
  Circle,
  ExternalLink,
  ArrowRight,
} from "lucide-react";
import { SectionLabel } from "@/components/ui/custom/section-label";
import { StatusPill } from "@/components/ui/custom/status-pill";
import { PrimaryButton, OutlineButton } from "@/components/ui/custom/buttons";
import { getModuleNavigation } from "@/lib/mock-learn-data";

const font = {
  display: "var(--font-display), 'Space Grotesk', 'Inter', system-ui, sans-serif",
  body: "var(--font-body), 'Inter', system-ui, -apple-system, sans-serif",
  mono: "var(--font-mono), 'JetBrains Mono', 'SF Mono', monospace",
};

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------
const tabs = ["Overview", "Lesson", "Resources", "Sessions", "Q&A"] as const;
type Tab = (typeof tabs)[number];

const tabCounts: Partial<Record<Tab, number>> = {
  Resources: 4,
  "Q&A": 3,
};

// ---------------------------------------------------------------------------
// Mock lesson items for right sidebar
// ---------------------------------------------------------------------------
const mockLessons = [
  { number: "01", title: "What Design Means for Bitcoin", status: "complete" as const },
  { number: "02", title: "Mapping User Mental Models", status: "complete" as const },
  { number: "03", title: "Designing for a Protocol", status: "current" as const },
  { number: "04", title: "The Bitcoin Design Guide", status: "not-started" as const },
];

// ---------------------------------------------------------------------------
// Mock resources
// ---------------------------------------------------------------------------
const mockResources = [
  { title: "Bitcoin Design Guide", desc: "The comprehensive open-source guide for Bitcoin designers", type: "Article" },
  { title: "Bitcoin UX Research", desc: "User research findings from the Bitcoin Design Community", type: "Reference" },
  { title: "Figma Bitcoin UI Kit", desc: "Community-built components for Bitcoin interfaces", type: "Tool" },
  { title: "Bitcoin Wallet UX Teardown", desc: "In-depth analysis of leading Bitcoin wallet experiences", type: "Video" },
];

// ---------------------------------------------------------------------------
// Mock sessions
// ---------------------------------------------------------------------------
const mockSessions = [
  { title: "Bitcoin Design Fundamentals — Live Session 1", date: "JUN 12, 2025", duration: "58 MIN" },
  { title: "Q&A: Bitcoin UX Challenges", date: "JUN 19, 2025", duration: "42 MIN" },
];

// ---------------------------------------------------------------------------
// Mock Q&A
// ---------------------------------------------------------------------------
const mockQA = [
  {
    question: "How does Bitcoin's UTXO model affect UX design decisions?",
    askedBy: "LEARNER",
    time: "2 DAYS AGO",
    answer: "The UTXO model means users don't have a single balance — they have a collection of unspent outputs. Designers need to abstract this complexity while being honest about its implications, especially for coin selection and transaction fees.",
  },
  {
    question: "What's the biggest UX challenge in Bitcoin wallet onboarding?",
    askedBy: "LEARNER",
    time: "4 DAYS AGO",
    answer: "Seed phrase backup remains the biggest friction point. Users must understand that losing their seed means losing their funds permanently, but presenting this without causing anxiety requires careful progressive disclosure and clear, reassuring language.",
  },
  {
    question: "How do we design for users who don't understand private keys?",
    askedBy: "LEARNER",
    time: "1 WEEK AGO",
    answer: "Use familiar metaphors like 'your secret password that unlocks your Bitcoin' while gradually introducing the technical reality. The key is layered education — let users operate the interface safely first, then deepen their understanding over time through contextual tooltips and optional deep-dives.",
  },
];

// ---------------------------------------------------------------------------
// Q&A Accordion Item
// ---------------------------------------------------------------------------
function QAItem({ q }: { q: (typeof mockQA)[0] }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        padding: "16px 0",
        borderBottom: "1px solid var(--color-border-subtle)",
        cursor: "pointer",
        transitionProperty: "background-color",
        transitionDuration: "var(--duration-fast)",
      }}
      onClick={() => setOpen(!open)}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div style={{ minWidth: 0 }}>
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
            {q.question}
          </p>
          <span
            style={{
              fontFamily: font.mono,
              fontSize: 11,
              lineHeight: "14px",
              fontWeight: 600,
              letterSpacing: "0.10em",
              textTransform: "uppercase",
              color: "var(--color-text-tertiary)",
              marginTop: 4,
              display: "block",
            }}
          >
            Asked by {q.askedBy} · {q.time}
          </span>
        </div>
        <ChevronDown
          style={{
            width: 16,
            height: 16,
            color: "var(--color-text-tertiary)",
            flexShrink: 0,
            marginTop: 3,
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 180ms cubic-bezier(0.25, 1, 0.5, 1)",
          }}
        />
      </div>
      <div
        style={{
          maxHeight: open ? 500 : 0,
          overflow: "hidden",
          transition: "max-height 300ms cubic-bezier(0.25, 1, 0.5, 1)",
        }}
      >
        <p
          style={{
            fontFamily: font.body,
            fontSize: "14.5px",
            lineHeight: "24px",
            fontWeight: 400,
            color: "var(--color-text-secondary)",
            margin: 0,
            marginTop: 12,
          }}
        >
          {q.answer}
        </p>
        <span
          style={{
            fontFamily: font.mono,
            fontSize: 11,
            lineHeight: "14px",
            fontWeight: 600,
            letterSpacing: "0.10em",
            textTransform: "uppercase",
            color: "var(--color-success-text)",
            marginTop: 8,
            display: "block",
          }}
        >
          Answered by Mentor
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function ModulePage() {
  const params = useParams();
  const slug = params.moduleSlug as string;
  const nav = getModuleNavigation(slug);
  const mod = nav.current;

  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [isComplete, setIsComplete] = useState(false);
  const [sidebarProgress, setSidebarProgress] = useState(0);

  useEffect(() => {
    if (mod) {
      const timer = setTimeout(
        () => setSidebarProgress(Math.round((mod.lessonsComplete / mod.lessons) * 100)),
        100
      );
      return () => clearTimeout(timer);
    }
  }, [mod]);

  if (!mod) {
    return (
      <div style={{ padding: 48 }}>
        <p style={{ fontFamily: font.body, fontSize: "14.5px", color: "var(--color-text-secondary)" }}>
          Module not found.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Two-column layout */}
      <div style={{ display: "flex", gap: 0 }}>
        {/* ── LEFT COLUMN ── */}
        <div style={{ flex: 1, minWidth: 0, paddingRight: 32 }} className="lesson-left-col">
          {/* Back link */}
          <Link
            href="/learn"
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
              marginBottom: 24,
              display: "inline-block",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-text-primary)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-tertiary)")}
          >
            &larr; Learn
          </Link>

          {/* Video */}
          <div
            style={{
              position: "relative",
              width: "100%",
              aspectRatio: "16 / 9",
              borderRadius: 14,
              overflow: "hidden",
              backgroundColor: "var(--color-bg-surface)",
            }}
          >
            <iframe
              src="https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1"
              title={mod.title}
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                border: "none",
              }}
            />
          </div>

          {/* Metadata row */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 12,
            }}
          >
            <span
              style={{
                fontFamily: font.mono,
                fontSize: 11,
                lineHeight: "14px",
                fontWeight: 600,
                letterSpacing: "0.10em",
                textTransform: "uppercase",
                color: "var(--color-text-tertiary)",
              }}
            >
              Lesson {String(mod.lessonsComplete || 1).padStart(2, "0")} of{" "}
              {String(mod.lessons).padStart(2, "0")}
            </span>

            {/* Mark complete toggle */}
            <button
              onClick={() => setIsComplete(!isComplete)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                height: 32,
                padding: "0 12px",
                borderRadius: 10,
                fontSize: "14.5px",
                fontWeight: 500,
                fontFamily: font.body,
                cursor: "pointer",
                border: isComplete
                  ? "1px solid var(--color-success-border)"
                  : "1px solid var(--color-border-strong)",
                backgroundColor: isComplete ? "var(--color-success-subtle)" : "transparent",
                color: isComplete ? "var(--color-success-text)" : "var(--color-text-primary)",
                transitionProperty: "background-color, border-color, color",
                transitionDuration: "180ms",
                transitionTimingFunction: "var(--ease-out-quart)",
              }}
            >
              {isComplete ? "✓ Completed" : "○ Mark Complete"}
            </button>
          </div>

          {/* Module title */}
          <h1
            style={{
              fontFamily: font.display,
              fontSize: 24,
              lineHeight: "30px",
              fontWeight: 600,
              letterSpacing: "-0.015em",
              color: "var(--color-text-primary)",
              margin: 0,
              marginTop: 20,
            }}
          >
            {mod.title}
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
              marginTop: 6,
              marginBottom: 32,
            }}
          >
            Unit {mod.unitNumber} · Module {mod.moduleNumber} · {mod.track}
          </p>

          {/* Tab bar */}
          <div
            style={{
              borderBottom: "1px solid var(--color-border-subtle)",
              display: "flex",
              gap: 0,
            }}
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab;
              const count = tabCounts[tab];
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    height: 40,
                    padding: "0 4px",
                    marginRight: 24,
                    fontFamily: font.body,
                    fontSize: 14,
                    fontWeight: 500,
                    color: isActive ? "var(--color-text-primary)" : "var(--color-text-tertiary)",
                    backgroundColor: "transparent",
                    border: "none",
                    borderBottom: isActive ? "2px solid var(--color-indigo)" : "2px solid transparent",
                    cursor: "pointer",
                    transitionProperty: "color, border-color",
                    transitionDuration: "var(--duration-fast)",
                    transitionTimingFunction: "var(--ease-out-quart)",
                    marginBottom: -1,
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.color = "var(--color-text-secondary)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.color = "var(--color-text-tertiary)";
                  }}
                >
                  {tab}
                  {count != null && (
                    <span style={{ marginLeft: 4 }}>{count}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <div style={{ paddingTop: 32 }}>
            {/* ── OVERVIEW TAB ── */}
            {activeTab === "Overview" && (
              <div>
                {/* Learning objectives card */}
                <div
                  style={{
                    backgroundColor: "var(--color-bg-surface)",
                    border: "1px solid var(--color-border-subtle)",
                    borderRadius: 14,
                    padding: 20,
                    marginBottom: 32,
                  }}
                >
                  <SectionLabel>{"What You'll Learn"}</SectionLabel>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, marginTop: 16 }}>
                    {[
                      "Understand Bitcoin as a design constraint, not a limitation",
                      "Map user mental models around money to Bitcoin flows",
                      "Identify UX patterns unique to Bitcoin transactions",
                      "Apply design thinking to Bitcoin onboarding experiences",
                    ].map((obj, i) => (
                      <li
                        key={i}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 12,
                          fontFamily: font.body,
                          fontSize: "14.5px",
                          lineHeight: "22px",
                          fontWeight: 400,
                          color: "var(--color-text-secondary)",
                          marginBottom: i < 3 ? 14 : 0,
                        }}
                      >
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            backgroundColor: "var(--color-indigo)",
                            flexShrink: 0,
                            marginTop: 7,
                          }}
                        />
                        {obj}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Key concepts */}
                <div>
                  <SectionLabel>Key Concepts</SectionLabel>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 8,
                      marginTop: 16,
                    }}
                  >
                    {["Bitcoin UX", "Mental Models", "Design Constraints", "User Research", "Onboarding"].map(
                      (concept) => (
                        <span
                          key={concept}
                          style={{
                            backgroundColor: "var(--color-bg-surface-2)",
                            border: "1px solid var(--color-border-subtle)",
                            borderRadius: 10,
                            padding: "8px 14px",
                            fontFamily: font.body,
                            fontSize: 14,
                            fontWeight: 400,
                            color: "var(--color-text-secondary)",
                          }}
                        >
                          {concept}
                        </span>
                      )
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── LESSON TAB ── */}
            {activeTab === "Lesson" && (
              <div>
                <Link
                  href={`/learn/${slug}/lesson`}
                  style={{ textDecoration: "none", display: "block" }}
                >
                  <div
                    style={{
                      backgroundColor: "var(--color-bg-surface)",
                      border: "1px solid var(--color-border-subtle)",
                      borderRadius: 14,
                      padding: 24,
                      cursor: "pointer",
                      transitionProperty: "background-color, border-color",
                      transitionDuration: "var(--duration-fast)",
                      transitionTimingFunction: "var(--ease-out-quart)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "var(--color-bg-surface-2)";
                      e.currentTarget.style.borderColor = "var(--color-border-strong)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "var(--color-bg-surface)";
                      e.currentTarget.style.borderColor = "var(--color-border-subtle)";
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <SectionLabel>Module Lesson</SectionLabel>
                      <ArrowRight
                        style={{ width: 16, height: 16, color: "var(--color-text-tertiary)" }}
                      />
                    </div>
                    <h3
                      style={{
                        fontFamily: font.display,
                        fontSize: 18,
                        lineHeight: "24px",
                        fontWeight: 600,
                        color: "var(--color-text-primary)",
                        margin: 0,
                        marginTop: 8,
                      }}
                    >
                      {mod.title} — Full Lesson
                    </h3>
                    <p
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
                      A detailed written lesson with explanations, examples, Bitcoin concept
                      breakdowns, and step-by-step walkthroughs. Estimated reading time: 12 min.
                    </p>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 16,
                        marginTop: 20,
                      }}
                    >
                      <PrimaryButton>Read Lesson</PrimaryButton>
                      <span
                        style={{
                          fontFamily: font.mono,
                          fontSize: 11,
                          lineHeight: "14px",
                          fontWeight: 600,
                          letterSpacing: "0.10em",
                          textTransform: "uppercase",
                          color: "var(--color-text-tertiary)",
                        }}
                      >
                        12 Min Read
                      </span>
                    </div>
                  </div>
                </Link>
                <p
                  style={{
                    fontFamily: font.body,
                    fontSize: 13,
                    lineHeight: "19px",
                    fontWeight: 400,
                    color: "var(--color-text-tertiary)",
                    margin: 0,
                    marginTop: 16,
                  }}
                >
                  The lesson opens in a focused reading view. Press &larr; back to return here.
                </p>
              </div>
            )}

            {/* ── RESOURCES TAB ── */}
            {activeTab === "Resources" && (
              <div>
                <SectionLabel>4 Resources</SectionLabel>
                <div style={{ marginTop: 20 }}>
                  {mockResources.map((r, i) => (
                    <div
                      key={i}
                      style={{
                        padding: "14px 0",
                        borderBottom:
                          i < mockResources.length - 1
                            ? "1px solid var(--color-border-subtle)"
                            : "none",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        margin: "0 -16px",
                        paddingLeft: 16,
                        paddingRight: 16,
                        borderRadius: 10,
                        cursor: "pointer",
                        transitionProperty: "background-color",
                        transitionDuration: "var(--duration-fast)",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = "var(--color-bg-surface-2)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "transparent")
                      }
                    >
                      <ExternalLink
                        style={{
                          width: 14,
                          height: 14,
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
                          }}
                        >
                          {r.title}
                        </p>
                        <p
                          style={{
                            fontFamily: font.body,
                            fontSize: 13,
                            lineHeight: "19px",
                            fontWeight: 400,
                            color: "var(--color-text-secondary)",
                            margin: 0,
                            marginTop: 2,
                          }}
                        >
                          {r.desc}
                        </p>
                      </div>
                      <span
                        style={{
                          fontFamily: font.mono,
                          fontSize: 11,
                          lineHeight: "14px",
                          fontWeight: 600,
                          letterSpacing: "0.10em",
                          textTransform: "uppercase",
                          color: "var(--color-text-tertiary)",
                          backgroundColor: "var(--color-bg-surface-3)",
                          border: "1px solid var(--color-border-subtle)",
                          padding: "2px 8px",
                          borderRadius: 999,
                          flexShrink: 0,
                        }}
                      >
                        {r.type}
                      </span>
                      <ChevronRight
                        style={{
                          width: 14,
                          height: 14,
                          color: "var(--color-text-tertiary)",
                          flexShrink: 0,
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── SESSIONS TAB ── */}
            {activeTab === "Sessions" && (
              <div>
                <SectionLabel>Recorded Sessions</SectionLabel>
                <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 16 }}>
                  {mockSessions.map((s, i) => (
                    <div
                      key={i}
                      style={{
                        backgroundColor: "var(--color-bg-surface)",
                        border: "1px solid var(--color-border-subtle)",
                        borderRadius: 14,
                        padding: 20,
                        display: "flex",
                        gap: 16,
                        transitionProperty: "background-color, border-color",
                        transitionDuration: "var(--duration-fast)",
                        transitionTimingFunction: "var(--ease-out-quart)",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "var(--color-bg-surface-2)";
                        e.currentTarget.style.borderColor = "var(--color-border-strong)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "var(--color-bg-surface)";
                        e.currentTarget.style.borderColor = "var(--color-border-subtle)";
                      }}
                    >
                      {/* Thumbnail placeholder */}
                      <div
                        style={{
                          width: 120,
                          height: 68,
                          backgroundColor: "var(--color-bg-surface-3)",
                          borderRadius: 10,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <PlayCircle
                          style={{ width: 24, height: 24, color: "var(--color-text-tertiary)" }}
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3
                          style={{
                            fontFamily: font.display,
                            fontSize: 15,
                            lineHeight: "20px",
                            fontWeight: 600,
                            color: "var(--color-text-primary)",
                            margin: 0,
                          }}
                        >
                          {s.title}
                        </h3>
                        <span
                          style={{
                            fontFamily: font.mono,
                            fontSize: 11,
                            lineHeight: "14px",
                            fontWeight: 600,
                            letterSpacing: "0.10em",
                            textTransform: "uppercase",
                            color: "var(--color-text-tertiary)",
                            marginTop: 4,
                            display: "block",
                          }}
                        >
                          {s.date} · {s.duration}
                        </span>
                        <div style={{ marginTop: 10 }}>
                          <OutlineButton size="small">Watch Recording</OutlineButton>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Q&A TAB ── */}
            {activeTab === "Q&A" && (
              <div>
                <SectionLabel>3 Questions</SectionLabel>
                <div style={{ marginTop: 20 }}>
                  {mockQA.map((q, i) => (
                    <QAItem key={i} q={q} />
                  ))}
                </div>
                <div style={{ marginTop: 24 }}>
                  <OutlineButton fullWidth>Ask a Question</OutlineButton>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN — Module Navigator ── */}
        <aside
          className="lesson-right-col"
          style={{
            width: 280,
            flexShrink: 0,
            position: "sticky",
            top: 32,
            alignSelf: "flex-start",
            paddingLeft: 24,
            borderLeft: "1px solid var(--color-border-subtle)",
          }}
        >
          <SectionLabel>In This Module</SectionLabel>
          <h3
            style={{
              fontFamily: font.display,
              fontSize: 14,
              lineHeight: "20px",
              fontWeight: 600,
              color: "var(--color-text-primary)",
              margin: 0,
              marginTop: 4,
              marginBottom: 20,
            }}
          >
            {mod.title}
          </h3>

          {/* Lesson items */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {mockLessons.map((lesson) => {
              const isCurrent = lesson.status === "current";
              return (
                <div
                  key={lesson.number}
                  style={{
                    padding: isCurrent ? "10px 12px 10px 10px" : "10px 12px",
                    borderRadius: 10,
                    backgroundColor: isCurrent ? "var(--color-bg-surface-2)" : "transparent",
                    borderLeft: isCurrent ? "2px solid var(--color-indigo)" : "2px solid transparent",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    transitionProperty: "background-color",
                    transitionDuration: "var(--duration-fast)",
                  }}
                  onMouseEnter={(e) => {
                    if (!isCurrent) e.currentTarget.style.backgroundColor = "var(--color-bg-surface-2)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isCurrent) e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <div>
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
                      Lesson {lesson.number}
                    </span>
                    <p
                      style={{
                        fontFamily: font.body,
                        fontSize: 13,
                        lineHeight: "18px",
                        fontWeight: 400,
                        color: isCurrent
                          ? "var(--color-text-primary)"
                          : "var(--color-text-secondary)",
                        margin: 0,
                        marginTop: 2,
                      }}
                    >
                      {lesson.title}
                    </p>
                  </div>
                  {lesson.status === "complete" && (
                    <CheckCircle
                      style={{ width: 14, height: 14, color: "var(--color-success-text)", flexShrink: 0 }}
                    />
                  )}
                  {lesson.status === "current" && (
                    <PlayCircle
                      style={{ width: 14, height: 14, color: "var(--color-indigo-text)", flexShrink: 0 }}
                    />
                  )}
                  {lesson.status === "not-started" && (
                    <Circle
                      style={{ width: 14, height: 14, color: "var(--color-text-tertiary)", flexShrink: 0 }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Module progress */}
          <div
            style={{
              borderTop: "1px solid var(--color-border-subtle)",
              margin: "20px 0",
              paddingTop: 20,
            }}
          >
            <SectionLabel>Module Progress</SectionLabel>
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
              {mod.lessonsComplete} of {mod.lessons} lessons complete
            </p>
            <div
              style={{
                marginTop: 8,
                height: 3,
                width: "100%",
                borderRadius: "var(--radius-full)",
                backgroundColor: "var(--color-bg-surface-3)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${sidebarProgress}%`,
                  transition: "width 600ms cubic-bezier(0.4, 0, 0.2, 1)",
                  height: 3,
                  backgroundColor: "var(--color-indigo)",
                  borderRadius: "var(--radius-full)",
                }}
              />
            </div>
          </div>

          {/* Module navigation */}
          <div
            style={{
              borderTop: "1px solid var(--color-border-subtle)",
              paddingTop: 20,
            }}
          >
            <SectionLabel>Navigate</SectionLabel>
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 4 }}>
              {nav.prev && (
                <Link href={`/learn/${nav.prev.slug}`} style={{ textDecoration: "none" }}>
                  <div
                    style={{
                      padding: "10px 12px",
                      borderRadius: 10,
                      cursor: "pointer",
                      transitionProperty: "background-color",
                      transitionDuration: "var(--duration-fast)",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = "var(--color-bg-surface-2)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "transparent")
                    }
                  >
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
                      &larr; Previous Module
                    </span>
                    <p
                      style={{
                        fontFamily: font.body,
                        fontSize: 13,
                        lineHeight: "18px",
                        fontWeight: 400,
                        color: "var(--color-text-secondary)",
                        margin: 0,
                        marginTop: 2,
                      }}
                    >
                      {nav.prev.title}
                    </p>
                  </div>
                </Link>
              )}
              {nav.next && (
                <Link href={`/learn/${nav.next.slug}`} style={{ textDecoration: "none" }}>
                  <div
                    style={{
                      padding: "10px 12px",
                      borderRadius: 10,
                      cursor: "pointer",
                      transitionProperty: "background-color",
                      transitionDuration: "var(--duration-fast)",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = "var(--color-bg-surface-2)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "transparent")
                    }
                  >
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
                      Next Module &rarr;
                    </span>
                    <p
                      style={{
                        fontFamily: font.body,
                        fontSize: 13,
                        lineHeight: "18px",
                        fontWeight: 400,
                        color: "var(--color-text-secondary)",
                        margin: 0,
                        marginTop: 2,
                      }}
                    >
                      {nav.next.title}
                    </p>
                  </div>
                </Link>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* ── BOTTOM NAV BAR ── */}
      <div
        className="lesson-bottom-nav"
        style={{
          position: "fixed",
          bottom: 0,
          left: 260,
          right: 0,
          backgroundColor: "var(--color-bg-surface)",
          borderTop: "1px solid var(--color-border-subtle)",
          padding: "12px 24px",
          zIndex: 20,
        }}
      >
        <div
          style={{
            maxWidth: 880,
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            {nav.prev && (
              <Link href={`/learn/${nav.prev.slug}`} style={{ textDecoration: "none" }}>
                <OutlineButton size="small">{`← ${nav.prev.title}`}</OutlineButton>
              </Link>
            )}
          </div>
          <span
            style={{
              fontFamily: font.mono,
              fontSize: 11,
              lineHeight: "14px",
              fontWeight: 600,
              letterSpacing: "0.10em",
              textTransform: "uppercase",
              color: "var(--color-text-tertiary)",
            }}
          >
            Module {mod.moduleNumber} of{" "}
            {String(6).padStart(2, "0")}
          </span>
          <div>
            {nav.next && (
              <Link href={`/learn/${nav.next.slug}`} style={{ textDecoration: "none" }}>
                <PrimaryButton size="small">{`${nav.next.title} →`}</PrimaryButton>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

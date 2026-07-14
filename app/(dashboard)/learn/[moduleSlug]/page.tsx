"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  XCircle,
  PlayCircle,
  Circle,
  ExternalLink,
  ArrowRight,
  ArrowLeft,
  BookOpen,
} from "lucide-react";
import { SectionLabel } from "@/components/ui/custom/section-label";
import { StatusPill } from "@/components/ui/custom/status-pill";
import { PrimaryButton, OutlineButton } from "@/components/ui/custom/buttons";
import { getModuleNavigation, mockUnits } from "@/lib/mock-learn-data";

const font = {
  display: "var(--font-display), 'Space Grotesk', 'Inter', system-ui, sans-serif",
  body: "var(--font-body), 'Inter', system-ui, -apple-system, sans-serif",
  mono: "var(--font-mono), 'JetBrains Mono', 'SF Mono', monospace",
};

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------
const tabs = ["Overview", "Lesson", "Resources", "Sessions", "Questions"] as const;
type Tab = (typeof tabs)[number];

const tabCounts: Partial<Record<Tab, number>> = {
  Resources: 4,
  Questions: 5,
};

// ---------------------------------------------------------------------------
// Quiz data
// ---------------------------------------------------------------------------
interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  hint: string;
}

const quizQuestions: QuizQuestion[] = [
  {
    question: "What makes Bitcoin unique as a design medium?",
    options: [
      "It has a company behind it",
      "It is an open permissionless protocol",
      "It has a central design system",
      "It is controlled by one entity",
    ],
    correctIndex: 1,
    hint: "Bitcoin is decentralized with no single entity controlling it.",
  },
  {
    question: "What does UTXO stand for?",
    options: [
      "Unified Transaction Exchange Output",
      "Unspent Transaction Output",
      "Universal Token Exchange Option",
      "User Transaction Exchange Object",
    ],
    correctIndex: 1,
    hint: "UTXO refers to the discrete chunks of bitcoin received but not yet spent.",
  },
  {
    question: "Why is irreversibility important in Bitcoin UX?",
    options: [
      "It makes transactions faster",
      "It reduces fees",
      "Every interface decision has permanent consequences",
      "It simplifies the codebase",
    ],
    correctIndex: 2,
    hint: "Bitcoin transactions cannot be reversed, making every design choice critical.",
  },
  {
    question: "What is the designer's role in Bitcoin?",
    options: [
      "Writing smart contracts",
      "Managing nodes",
      "Shaping the UX layer of a global financial protocol",
      "Setting transaction fees",
    ],
    correctIndex: 2,
    hint: "Designers shape how users interact with Bitcoin at the interface level.",
  },
  {
    question: "What do Bitcoin constraints push designers toward?",
    options: [
      "Simpler interfaces",
      "Higher standards of craft",
      "Fewer features",
      "Less user research",
    ],
    correctIndex: 1,
    hint: "Constraints like irreversibility force designers to produce more careful, higher-quality work.",
  },
];

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------
const mockLessons = [
  { number: "01", title: "What Design Means for Bitcoin", status: "complete" as const },
  { number: "02", title: "Mapping User Mental Models", status: "complete" as const },
  { number: "03", title: "Designing for a Protocol", status: "current" as const },
  { number: "04", title: "The Bitcoin Design Guide", status: "not-started" as const },
];

const mockResources = [
  { title: "Bitcoin Design Guide", desc: "The comprehensive open-source guide for Bitcoin designers", type: "Article" },
  { title: "Bitcoin UX Research", desc: "User research findings from the Bitcoin Design Community", type: "Reference" },
  { title: "Figma Bitcoin UI Kit", desc: "Community-built components for Bitcoin interfaces", type: "Tool" },
  { title: "Bitcoin Wallet UX Teardown", desc: "In-depth analysis of leading Bitcoin wallet experiences", type: "Video" },
];

const mockSessions = [
  { title: "Bitcoin Design Fundamentals — Live Session 1", date: "JUN 12, 2025", duration: "58 MIN" },
  { title: "Q&A: Bitcoin UX Challenges", date: "JUN 19, 2025", duration: "42 MIN" },
];

// ---------------------------------------------------------------------------
// Quiz Component
// ---------------------------------------------------------------------------
function QuestionsTab({ onPass }: { onPass: () => void }) {
  const [answers, setAnswers] = useState<(number | null)[]>(
    new Array(quizQuestions.length).fill(null)
  );
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const allAnswered = answers.every((a) => a !== null);

  function handleSelect(qIdx: number, optIdx: number) {
    if (submitted) return;
    setAnswers((prev) => {
      const next = [...prev];
      next[qIdx] = optIdx;
      return next;
    });
  }

  function handleSubmit() {
    if (!allAnswered) return;
    let correct = 0;
    answers.forEach((a, i) => {
      if (a === quizQuestions[i].correctIndex) correct++;
    });
    setScore(correct);
    setSubmitted(true);
    if (correct >= 4) onPass();
  }

  function handleRetry() {
    setAnswers(new Array(quizQuestions.length).fill(null));
    setSubmitted(false);
    setScore(0);
  }

  return (
    <div>
      <SectionLabel>5 Questions</SectionLabel>
      <div style={{ marginTop: 20 }}>
        {quizQuestions.map((q, qIdx) => {
          const isWrong = submitted && answers[qIdx] !== null && answers[qIdx] !== q.correctIndex;

          return (
            <div key={qIdx}>
              {qIdx > 0 && (
                <div
                  style={{
                    height: 1,
                    backgroundColor: "var(--color-border-subtle)",
                    margin: "24px 0",
                  }}
                />
              )}
              <p
                style={{
                  fontFamily: font.body,
                  fontSize: 15,
                  lineHeight: "22px",
                  fontWeight: 500,
                  color: "var(--color-text-primary)",
                  margin: 0,
                  marginBottom: 12,
                }}
              >
                {qIdx + 1}. {q.question}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {q.options.map((opt, optIdx) => {
                  const isSelected = answers[qIdx] === optIdx;
                  const isCorrectOption = submitted && optIdx === q.correctIndex;
                  const isWrongSelection = submitted && isSelected && optIdx !== q.correctIndex;

                  let bg = "var(--color-bg-surface-2)";
                  let border = "1px solid var(--color-border-subtle)";
                  let color = "var(--color-text-secondary)";
                  let icon: React.ReactNode = null;

                  if (submitted) {
                    if (isCorrectOption) {
                      bg = "var(--color-success-subtle)";
                      border = "1px solid var(--color-success-border)";
                      color = "var(--color-success-text)";
                      icon = <CheckCircle style={{ width: 16, height: 16, color: "var(--color-success-text)", flexShrink: 0 }} />;
                    } else if (isWrongSelection) {
                      bg = "var(--color-danger-subtle)";
                      border = "1px solid var(--color-danger-border)";
                      color = "var(--color-danger-text)";
                      icon = <XCircle style={{ width: 16, height: 16, color: "var(--color-danger-text)", flexShrink: 0 }} />;
                    }
                  } else if (isSelected) {
                    bg = "var(--color-indigo-subtle)";
                    border = "1px solid var(--color-indigo-border)";
                    color = "var(--color-text-primary)";
                  }

                  return (
                    <button
                      key={optIdx}
                      onClick={() => handleSelect(qIdx, optIdx)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        width: "100%",
                        padding: "12px 16px",
                        borderRadius: 10,
                        backgroundColor: bg,
                        border,
                        color,
                        fontFamily: font.body,
                        fontSize: 14,
                        lineHeight: "20px",
                        fontWeight: 400,
                        textAlign: "left",
                        cursor: submitted ? "default" : "pointer",
                        transitionProperty: "background-color, border-color, color",
                        transitionDuration: "var(--duration-fast)",
                        transitionTimingFunction: "var(--ease-out-quart)",
                      }}
                      onMouseEnter={(e) => {
                        if (!submitted && !isSelected) {
                          e.currentTarget.style.borderColor = "var(--color-border-strong)";
                          e.currentTarget.style.backgroundColor = "var(--color-bg-surface-3)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!submitted && !isSelected) {
                          e.currentTarget.style.borderColor = "var(--color-border-subtle)";
                          e.currentTarget.style.backgroundColor = "var(--color-bg-surface-2)";
                        }
                      }}
                    >
                      <span>{opt}</span>
                      {icon}
                    </button>
                  );
                })}
              </div>
              {isWrong && (
                <p
                  style={{
                    fontFamily: font.body,
                    fontSize: 13,
                    lineHeight: "19px",
                    fontWeight: 400,
                    color: "var(--color-text-tertiary)",
                    margin: 0,
                    marginTop: 8,
                  }}
                >
                  {q.hint}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Submit / Score */}
      <div style={{ marginTop: 32 }}>
        {!submitted ? (
          <PrimaryButton fullWidth onClick={handleSubmit} disabled={!allAnswered}>
            Submit Answers
          </PrimaryButton>
        ) : (
          <div>
            <h3
              style={{
                fontFamily: font.display,
                fontSize: 24,
                lineHeight: "30px",
                fontWeight: 600,
                color: "var(--color-text-primary)",
                margin: 0,
                textAlign: "center",
              }}
            >
              {score} of 5 correct
            </h3>
            {score >= 4 ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 12 }}>
                <CheckCircle style={{ width: 16, height: 16, color: "var(--color-success-text)" }} />
                <span style={{ fontFamily: font.body, fontSize: 14, lineHeight: "20px", fontWeight: 400, color: "var(--color-success-text)" }}>
                  You can now mark this lesson complete
                </span>
              </div>
            ) : (
              <div style={{ textAlign: "center", marginTop: 12 }}>
                <p style={{ fontFamily: font.body, fontSize: 14, lineHeight: "20px", fontWeight: 400, color: "var(--color-text-secondary)", margin: 0, marginBottom: 16 }}>
                  Review the lesson and try again
                </p>
                <OutlineButton onClick={handleRetry}>Retry Questions</OutlineButton>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Collapsed Panel Icon with Tooltip
// ---------------------------------------------------------------------------
function IconWithTooltip({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{ position: "relative" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        onClick={onClick}
        style={{
          background: "none",
          border: "none",
          padding: 4,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon
          style={{
            width: 18,
            height: 18,
            color: hovered ? "var(--color-text-primary)" : "var(--color-text-tertiary)",
            transitionProperty: "color",
            transitionDuration: "var(--duration-fast)",
          }}
        />
      </button>
      {hovered && (
        <div
          style={{
            position: "absolute",
            right: "100%",
            top: "50%",
            transform: "translateY(-50%)",
            marginRight: 8,
            whiteSpace: "nowrap",
            fontFamily: font.body,
            fontSize: 12,
            lineHeight: "16px",
            fontWeight: 400,
            color: "var(--color-text-primary)",
            backgroundColor: "var(--color-bg-surface-3)",
            border: "1px solid var(--color-border-subtle)",
            borderRadius: 10,
            padding: "6px 10px",
            pointerEvents: "none",
            zIndex: 20,
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Panel Toggle Button
// ---------------------------------------------------------------------------
function PanelToggle({
  onClick,
  expanded,
  size = 28,
}: {
  onClick: () => void;
  expanded: boolean;
  size?: number;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: size,
        height: size,
        borderRadius: 10,
        backgroundColor: "var(--color-bg-surface-3)",
        border: "1px solid var(--color-border-subtle)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transitionProperty: "background-color, border-color",
        transitionDuration: "var(--duration-fast)",
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "var(--color-bg-surface-2)";
        e.currentTarget.style.borderColor = "var(--color-border-strong)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "var(--color-bg-surface-3)";
        e.currentTarget.style.borderColor = "var(--color-border-subtle)";
      }}
    >
      <ChevronRight
        style={{
          width: 14,
          height: 14,
          color: "var(--color-text-tertiary)",
          transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
          transitionProperty: "transform",
          transitionDuration: "200ms",
        }}
      />
    </button>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
type PanelState = "expanded" | "collapsed" | "hidden";

export default function ModulePage() {
  const params = useParams();
  const slug = params.moduleSlug as string;
  const nav = getModuleNavigation(slug);
  const mod = nav.current;

  const totalModules = mockUnits.flatMap((u) => u.modules).length;

  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [quizPassed, setQuizPassed] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [panelState, setPanelState] = useState<PanelState>("expanded");
  const [sidebarProgress, setSidebarProgress] = useState(0);
  const [lessonStatuses, setLessonStatuses] = useState(mockLessons);

  useEffect(() => {
    if (mod) {
      const timer = setTimeout(
        () => setSidebarProgress(Math.round((mod.lessonsComplete / mod.lessons) * 100)),
        100
      );
      return () => clearTimeout(timer);
    }
  }, [mod]);

  function handleQuizPass() {
    setQuizPassed(true);
  }

  function handleMarkComplete() {
    setIsComplete(true);
    setLessonStatuses((prev) =>
      prev.map((l) => (l.status === "current" ? { ...l, status: "complete" as const } : l))
    );
    if (mod) {
      const newComplete = mod.lessonsComplete + 1;
      setSidebarProgress(Math.round((newComplete / mod.lessons) * 100));
    }
  }

  function togglePanel() {
    setPanelState((prev) => {
      if (prev === "expanded") return "collapsed";
      if (prev === "collapsed") return "hidden";
      return "expanded";
    });
  }

  if (!mod) {
    return (
      <div style={{ padding: 48 }}>
        <p style={{ fontFamily: font.body, fontSize: "14.5px", color: "var(--color-text-secondary)" }}>
          Module not found.
        </p>
      </div>
    );
  }

  const panelWidth = panelState === "expanded" ? 280 : panelState === "collapsed" ? 48 : 0;

  return (
    // Outer wrapper: break out of dashboard layout padding, fill viewport
    <div
      className="lesson-viewport"
      style={{
        margin: "-48px -32px",
        height: "100vh",
        overflow: "hidden",
        display: "flex",
      }}
    >
      {/* ================================================================ */}
      {/* LEFT COLUMN                                                      */}
      {/* ================================================================ */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* ── BACK LINK (flex-shrink: 0) ── */}
        <div style={{ flexShrink: 0, padding: "16px 32px" }}>
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
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-text-primary)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-tertiary)")}
          >
            &larr; Learn
          </Link>
        </div>

        {/* ── VIDEO SECTION (flex-shrink: 0) ── */}
        <div style={{ flexShrink: 0, padding: "0 32px" }}>
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
              style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
            />
          </div>

          {/* Metadata row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
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
              Lesson {String(mod.lessonsComplete || 1).padStart(2, "0")} of {String(mod.lessons).padStart(2, "0")}
            </span>
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
              marginTop: 16,
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
            }}
          >
            Unit {mod.unitNumber} · Module {mod.moduleNumber} · {mod.track}
          </p>
        </div>

        {/* ── TAB BAR (flex-shrink: 0) ── */}
        <div
          style={{
            flexShrink: 0,
            padding: "16px 32px 0",
            backgroundColor: "var(--color-bg-base)",
            position: "relative",
          }}
        >
          <div style={{ borderBottom: "1px solid var(--color-border-subtle)", display: "flex" }}>
            {tabs.map((tab) => {
              const isActive = activeTab === tab;
              const count = tabCounts[tab];
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    height: 40,
                    padding: "0 0",
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
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = "var(--color-text-secondary)"; }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = "var(--color-text-tertiary)"; }}
                >
                  {tab}
                  {count != null && <span style={{ marginLeft: 4 }}>{count}</span>}
                </button>
              );
            })}
          </div>

          {/* Hidden-state reopen button — positioned at right edge of tab bar */}
          {panelState === "hidden" && (
            <button
              onClick={() => setPanelState("expanded")}
              className="lesson-reopen-btn"
              style={{
                position: "absolute",
                right: 8,
                top: "50%",
                transform: "translateY(-50%)",
                width: 28,
                height: 28,
                borderRadius: 10,
                backgroundColor: "var(--color-bg-surface-2)",
                border: "1px solid var(--color-border-subtle)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transitionProperty: "background-color, border-color",
                transitionDuration: "var(--duration-fast)",
                zIndex: 10,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--color-bg-surface-3)";
                e.currentTarget.style.borderColor = "var(--color-border-strong)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "var(--color-bg-surface-2)";
                e.currentTarget.style.borderColor = "var(--color-border-subtle)";
              }}
            >
              <ChevronLeft style={{ width: 14, height: 14, color: "var(--color-text-tertiary)" }} />
            </button>
          )}
        </div>

        {/* ── TAB CONTENT (scrollable) ── */}
        <div
          className="lesson-scroll-area"
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "32px 32px 40px",
          }}
        >
          {/* OVERVIEW TAB */}
          {activeTab === "Overview" && (
            <div>
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
                      <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "var(--color-indigo)", flexShrink: 0, marginTop: 7 }} />
                      {obj}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <SectionLabel>Key Concepts</SectionLabel>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
                  {["Bitcoin UX", "Mental Models", "Design Constraints", "User Research", "Onboarding"].map((concept) => (
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
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* LESSON TAB */}
          {activeTab === "Lesson" && (
            <div>
              <Link href={`/learn/${slug}/lesson`} style={{ textDecoration: "none", display: "block" }}>
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
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--color-bg-surface-2)"; e.currentTarget.style.borderColor = "var(--color-border-strong)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "var(--color-bg-surface)"; e.currentTarget.style.borderColor = "var(--color-border-subtle)"; }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <SectionLabel>Module Lesson</SectionLabel>
                    <ArrowRight style={{ width: 16, height: 16, color: "var(--color-text-tertiary)" }} />
                  </div>
                  <h3 style={{ fontFamily: font.display, fontSize: 18, lineHeight: "24px", fontWeight: 600, color: "var(--color-text-primary)", margin: 0, marginTop: 8 }}>
                    {mod.title} — Full Lesson
                  </h3>
                  <p style={{ fontFamily: font.body, fontSize: "14.5px", lineHeight: "22px", fontWeight: 400, color: "var(--color-text-secondary)", margin: 0, marginTop: 8 }}>
                    A detailed written lesson with explanations, examples, Bitcoin concept breakdowns, and step-by-step walkthroughs. Estimated reading time: 12 min.
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 20 }}>
                    <PrimaryButton>Read Lesson</PrimaryButton>
                    <span style={{ fontFamily: font.mono, fontSize: 11, lineHeight: "14px", fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--color-text-tertiary)" }}>
                      12 Min Read
                    </span>
                  </div>
                </div>
              </Link>
              <p style={{ fontFamily: font.body, fontSize: 13, lineHeight: "19px", fontWeight: 400, color: "var(--color-text-tertiary)", margin: 0, marginTop: 16 }}>
                The lesson opens in a focused reading view. Press &larr; back to return here.
              </p>
            </div>
          )}

          {/* RESOURCES TAB */}
          {activeTab === "Resources" && (
            <div>
              <SectionLabel>4 Resources</SectionLabel>
              <div style={{ marginTop: 20 }}>
                {mockResources.map((r, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "14px 16px",
                      borderBottom: i < mockResources.length - 1 ? "1px solid var(--color-border-subtle)" : "none",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      borderRadius: 10,
                      cursor: "pointer",
                      transitionProperty: "background-color",
                      transitionDuration: "var(--duration-fast)",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-bg-surface-2)")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <ExternalLink style={{ width: 14, height: 14, color: "var(--color-text-tertiary)", flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontFamily: font.body, fontSize: "14.5px", lineHeight: "22px", fontWeight: 500, color: "var(--color-text-primary)", margin: 0 }}>{r.title}</p>
                      <p style={{ fontFamily: font.body, fontSize: 13, lineHeight: "19px", fontWeight: 400, color: "var(--color-text-secondary)", margin: 0, marginTop: 2 }}>{r.desc}</p>
                    </div>
                    <span style={{ fontFamily: font.mono, fontSize: 11, lineHeight: "14px", fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--color-text-tertiary)", backgroundColor: "var(--color-bg-surface-3)", border: "1px solid var(--color-border-subtle)", padding: "2px 8px", borderRadius: 999, flexShrink: 0 }}>
                      {r.type}
                    </span>
                    <ChevronRight style={{ width: 14, height: 14, color: "var(--color-text-tertiary)", flexShrink: 0 }} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SESSIONS TAB */}
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
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--color-bg-surface-2)"; e.currentTarget.style.borderColor = "var(--color-border-strong)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "var(--color-bg-surface)"; e.currentTarget.style.borderColor = "var(--color-border-subtle)"; }}
                  >
                    <div style={{ width: 120, height: 68, backgroundColor: "var(--color-bg-surface-3)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <PlayCircle style={{ width: 24, height: 24, color: "var(--color-text-tertiary)" }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ fontFamily: font.display, fontSize: 15, lineHeight: "20px", fontWeight: 600, color: "var(--color-text-primary)", margin: 0 }}>{s.title}</h3>
                      <span style={{ fontFamily: font.mono, fontSize: 11, lineHeight: "14px", fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--color-text-tertiary)", marginTop: 4, display: "block" }}>
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

          {/* QUESTIONS TAB */}
          {activeTab === "Questions" && <QuestionsTab onPass={handleQuizPass} />}

          {/* Mark Complete — bottom of scrollable content */}
          <div style={{ marginTop: 32 }}>
            {!isComplete ? (
              <div>
                <PrimaryButton fullWidth onClick={handleMarkComplete} disabled={!quizPassed}>
                  Mark Complete
                </PrimaryButton>
                {!quizPassed && (
                  <p style={{ fontFamily: font.mono, fontSize: 11, lineHeight: "14px", fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--color-text-tertiary)", textAlign: "center", marginTop: 8 }}>
                    Complete the Questions tab to unlock
                  </p>
                )}
              </div>
            ) : (
              <button
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  width: "100%",
                  height: 40,
                  borderRadius: 10,
                  backgroundColor: "var(--color-success-subtle)",
                  border: "1px solid var(--color-success-border)",
                  color: "var(--color-success-text)",
                  fontFamily: font.body,
                  fontSize: "14.5px",
                  fontWeight: 500,
                  cursor: "default",
                }}
              >
                <CheckCircle style={{ width: 16, height: 16 }} />
                Lesson Complete
              </button>
            )}
          </div>
        </div>

        {/* ── BOTTOM NAV BAR (flex-shrink: 0) ── */}
        <div
          className="lesson-bottom-nav"
          style={{
            flexShrink: 0,
            backgroundColor: "var(--color-bg-surface)",
            borderTop: "1px solid var(--color-border-subtle)",
            padding: "12px 32px",
            zIndex: 10,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ minWidth: 0 }}>
              {nav.prev && (
                <Link href={`/learn/${nav.prev.slug}`} style={{ textDecoration: "none" }}>
                  <OutlineButton size="small">{`\u2190 ${nav.prev.title}`}</OutlineButton>
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
                flexShrink: 0,
                padding: "0 12px",
              }}
            >
              Module {mod.moduleNumber} of {String(totalModules).padStart(2, "0")}
            </span>
            <div style={{ minWidth: 0 }}>
              {nav.next && (
                <Link href={`/learn/${nav.next.slug}`} style={{ textDecoration: "none" }}>
                  <PrimaryButton size="small">{`${nav.next.title} \u2192`}</PrimaryButton>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* RIGHT PANEL                                                      */}
      {/* ================================================================ */}
      <aside
        className="lesson-right-col"
        style={{
          width: panelWidth,
          flexShrink: 0,
          borderLeft: panelState !== "hidden" ? "1px solid var(--color-border-subtle)" : "none",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          transitionProperty: "width",
          transitionDuration: "200ms",
          transitionTimingFunction: "cubic-bezier(0.25, 1, 0.5, 1)",
          backgroundColor: "var(--color-bg-surface)",
        }}
      >
        {/* ── EXPANDED STATE ── */}
        {panelState === "expanded" && (
          <>
            {/* Panel header (flex-shrink: 0) */}
            <div
              style={{
                flexShrink: 0,
                padding: "16px 16px 12px",
                borderBottom: "1px solid var(--color-border-subtle)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <SectionLabel>In This Module</SectionLabel>
              <PanelToggle onClick={togglePanel} expanded={true} />
            </div>

            {/* Panel content (scrollable) */}
            <div
              className="lesson-scroll-area"
              style={{
                flex: 1,
                overflowY: "auto",
                padding: 16,
              }}
            >
              {/* Module title */}
              <h3
                style={{
                  fontFamily: font.display,
                  fontSize: 14,
                  lineHeight: "20px",
                  fontWeight: 600,
                  color: "var(--color-text-primary)",
                  margin: 0,
                  marginBottom: 4,
                }}
              >
                {mod.title}
              </h3>

              {/* Lesson items */}
              <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 8 }}>
                {lessonStatuses.map((lesson) => {
                  const isCurrent = lesson.status === "current";
                  return (
                    <div
                      key={lesson.number}
                      style={{
                        padding: isCurrent ? "8px 12px 8px 10px" : "8px 12px",
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
                      onMouseEnter={(e) => { if (!isCurrent) e.currentTarget.style.backgroundColor = "var(--color-bg-surface-2)"; }}
                      onMouseLeave={(e) => { if (!isCurrent) e.currentTarget.style.backgroundColor = "transparent"; }}
                    >
                      <div>
                        <span style={{ fontFamily: font.mono, fontSize: 10, lineHeight: "12px", fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-text-tertiary)" }}>
                          Lesson {lesson.number}
                        </span>
                        <p style={{ fontFamily: font.body, fontSize: 13, lineHeight: "18px", fontWeight: 400, color: isCurrent ? "var(--color-text-primary)" : "var(--color-text-secondary)", margin: 0, marginTop: 2 }}>
                          {lesson.title}
                        </p>
                      </div>
                      {lesson.status === "complete" && <CheckCircle style={{ width: 16, height: 16, color: "var(--color-success-text)", flexShrink: 0 }} />}
                      {lesson.status === "current" && <PlayCircle style={{ width: 16, height: 16, color: "var(--color-indigo-text)", flexShrink: 0 }} />}
                      {lesson.status === "not-started" && <Circle style={{ width: 16, height: 16, color: "var(--color-text-tertiary)", flexShrink: 0 }} />}
                    </div>
                  );
                })}
              </div>

              {/* Divider */}
              <div style={{ height: 1, backgroundColor: "var(--color-border-subtle)", margin: "12px 0" }} />

              {/* Module progress */}
              <div>
                <SectionLabel>Module Progress</SectionLabel>
                <p style={{ fontFamily: font.mono, fontSize: 12, lineHeight: "16px", fontWeight: 500, textTransform: "uppercase", color: "var(--color-text-tertiary)", margin: 0, marginTop: 8 }}>
                  {isComplete ? mod.lessonsComplete + 1 : mod.lessonsComplete} of {mod.lessons} lessons complete
                </p>
                <div style={{ marginTop: 8, height: 3, width: "100%", borderRadius: "var(--radius-full)", backgroundColor: "var(--color-bg-surface-3)", overflow: "hidden" }}>
                  <div style={{ width: `${sidebarProgress}%`, transition: "width 600ms cubic-bezier(0.4, 0, 0.2, 1)", height: 3, backgroundColor: "var(--color-indigo)", borderRadius: "var(--radius-full)" }} />
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: 1, backgroundColor: "var(--color-border-subtle)", margin: "12px 0" }} />

              {/* Navigate */}
              <div>
                <SectionLabel>Navigate</SectionLabel>
                <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 0 }}>
                  {nav.prev && (
                    <Link href={`/learn/${nav.prev.slug}`} style={{ textDecoration: "none" }}>
                      <div
                        style={{
                          padding: "8px 0",
                          cursor: "pointer",
                          transitionProperty: "color",
                          transitionDuration: "var(--duration-fast)",
                        }}
                        onMouseEnter={(e) => {
                          const p = e.currentTarget.querySelector("p");
                          if (p) p.style.color = "var(--color-text-primary)";
                        }}
                        onMouseLeave={(e) => {
                          const p = e.currentTarget.querySelector("p");
                          if (p) p.style.color = "var(--color-text-secondary)";
                        }}
                      >
                        <span style={{ fontFamily: font.mono, fontSize: 10, lineHeight: "12px", fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-text-tertiary)" }}>
                          &larr; Prev Module
                        </span>
                        <p style={{ fontFamily: font.body, fontSize: 13, lineHeight: "18px", fontWeight: 400, color: "var(--color-text-secondary)", margin: 0, marginTop: 2, transitionProperty: "color", transitionDuration: "var(--duration-fast)" }}>
                          {nav.prev.title}
                        </p>
                      </div>
                    </Link>
                  )}
                  {nav.next && (
                    <Link href={`/learn/${nav.next.slug}`} style={{ textDecoration: "none" }}>
                      <div
                        style={{
                          padding: "8px 0",
                          cursor: "pointer",
                          transitionProperty: "color",
                          transitionDuration: "var(--duration-fast)",
                        }}
                        onMouseEnter={(e) => {
                          const p = e.currentTarget.querySelector("p");
                          if (p) p.style.color = "var(--color-text-primary)";
                        }}
                        onMouseLeave={(e) => {
                          const p = e.currentTarget.querySelector("p");
                          if (p) p.style.color = "var(--color-text-secondary)";
                        }}
                      >
                        <span style={{ fontFamily: font.mono, fontSize: 10, lineHeight: "12px", fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-text-tertiary)" }}>
                          Next Module &rarr;
                        </span>
                        <p style={{ fontFamily: font.body, fontSize: 13, lineHeight: "18px", fontWeight: 400, color: "var(--color-text-secondary)", margin: 0, marginTop: 2, transitionProperty: "color", transitionDuration: "var(--duration-fast)" }}>
                          {nav.next.title}
                        </p>
                      </div>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── COLLAPSED STATE ── */}
        {panelState === "collapsed" && (
          <>
            {/* Just the toggle button centered at top */}
            <div style={{ flexShrink: 0, padding: 10, display: "flex", justifyContent: "center" }}>
              <PanelToggle onClick={togglePanel} expanded={false} />
            </div>

            {/* Icons stacked */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 16, paddingTop: 16 }}>
              <IconWithTooltip icon={BookOpen} label="Lesson list" onClick={() => setPanelState("expanded")} />
              {nav.prev && (
                <Link href={`/learn/${nav.prev.slug}`} style={{ textDecoration: "none" }}>
                  <IconWithTooltip icon={ArrowLeft} label={`Previous: ${nav.prev.title}`} />
                </Link>
              )}
              {nav.next && (
                <Link href={`/learn/${nav.next.slug}`} style={{ textDecoration: "none" }}>
                  <IconWithTooltip icon={ArrowRight} label={`Next: ${nav.next.title}`} />
                </Link>
              )}
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

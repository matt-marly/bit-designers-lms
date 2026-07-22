"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  CheckCircle,
  XCircle,
  PlayCircle,
  Circle,
  ExternalLink,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  AlertTriangle,
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
// Toast
// ---------------------------------------------------------------------------
type ToastData = {
  message: string;
  type: "success" | "error" | "warning";
};

const toastDotColor: Record<ToastData["type"], string> = {
  success: "#22C55E",
  error: "#EF4444",
  warning: "#F59E0B",
};

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------
const allTabs = ["Overview", "Lesson", "Resources", "Sessions", "Questions"] as const;
type Tab = (typeof allTabs)[number];

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

// Mock video URL — set to null to test empty state
const mockVideoUrl: string | null = "https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1";

// ---------------------------------------------------------------------------
// Mark Complete Section
// ---------------------------------------------------------------------------
function MarkCompleteSection({
  isComplete,
  onMarkComplete,
}: {
  isComplete: boolean;
  onMarkComplete: () => void;
}) {
  if (isComplete) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          width: "100%",
          height: 40,
          borderRadius: 10,
          backgroundColor: "rgba(34,197,94,0.10)",
          border: "1px solid rgba(34,197,94,0.20)",
          color: "#4ADE80",
          fontFamily: font.body,
          fontSize: "14.5px",
          fontWeight: 500,
          cursor: "default",
          pointerEvents: "none" as const,
        }}
      >
        <CheckCircle style={{ width: 16, height: 16 }} />
        Completed
      </div>
    );
  }
  return (
    <PrimaryButton fullWidth onClick={onMarkComplete}>
      Mark complete
    </PrimaryButton>
  );
}

// ---------------------------------------------------------------------------
// Progress hint for non-actionable tabs
// ---------------------------------------------------------------------------
function TabProgressHint({ isComplete }: { isComplete: boolean }) {
  if (isComplete) {
    return (
      <div style={{ marginTop: 32, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <CheckCircle style={{ width: 16, height: 16, color: "var(--color-success-text)" }} />
        <span
          style={{
            fontFamily: font.mono,
            fontSize: 11,
            lineHeight: "14px",
            fontWeight: 600,
            letterSpacing: "0.10em",
            textTransform: "uppercase",
            color: "var(--color-success-text)",
          }}
        >
          Lesson Complete
        </span>
      </div>
    );
  }
  return (
    <p
      style={{
        fontFamily: font.mono,
        fontSize: 11,
        lineHeight: "14px",
        fontWeight: 600,
        letterSpacing: "0.10em",
        textTransform: "uppercase",
        color: "var(--color-text-tertiary)",
        textAlign: "center",
        marginTop: 32,
      }}
    >
      Complete the Lesson and Questions tabs to finish this lesson
    </p>
  );
}

// ---------------------------------------------------------------------------
// Quiz Component
// ---------------------------------------------------------------------------
function QuestionsTab({
  onPass,
  isComplete,
  onMarkComplete,
}: {
  onPass: () => void;
  isComplete: boolean;
  onMarkComplete: () => void;
}) {
  const [answers, setAnswers] = useState<(number | null)[]>(
    new Array(quizQuestions.length).fill(null)
  );
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const allAnswered = answers.every((a) => a !== null);
  const passed = submitted && score >= 4;

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

      {/* Mark Complete — Questions tab */}
      <div style={{ marginTop: 32 }}>
        <MarkCompleteSection
          isComplete={isComplete}
          onMarkComplete={onMarkComplete}
        />
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
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: hovered ? "var(--color-bg-surface-3)" : "transparent",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transitionProperty: "background-color",
          transitionDuration: "var(--duration-fast)",
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
// Gating helper — check if previous module is incomplete
// ---------------------------------------------------------------------------
function isModuleGated(slug: string): boolean {
  const allModules = mockUnits.flatMap((unit) => unit.modules);
  const idx = allModules.findIndex((m) => m.slug === slug);
  if (idx <= 0) return false;
  const prev = allModules[idx - 1];
  return prev.status !== "passed";
}

// ---------------------------------------------------------------------------
// Check if this is the last module across all units
// ---------------------------------------------------------------------------
function isLastModule(slug: string): boolean {
  const allModules = mockUnits.flatMap((unit) => unit.modules);
  const idx = allModules.findIndex((m) => m.slug === slug);
  return idx === allModules.length - 1;
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

  const currentUnit = mod ? mockUnits.find((u) => u.number === mod.unitNumber) : null;
  const unitModuleCount = currentUnit ? currentUnit.modules.length : 0;

  // Filter tabs: hide Questions if no quiz questions
  const tabs = quizQuestions.length > 0
    ? allTabs
    : allTabs.filter((t) => t !== "Questions");

  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [quizPassed, setQuizPassed] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [panelState, setPanelState] = useState<PanelState>("expanded");
  const [sidebarProgress, setSidebarProgress] = useState(0);
  const [lessonStatuses, setLessonStatuses] = useState(mockLessons);
  const [readLesson, setReadLesson] = useState(false);
  const [videoCollapsed, setVideoCollapsed] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);

  const showToast = useCallback((message: string, type: ToastData["type"] = "success") => {
    setToast({ message, type });
  }, []);

  // Auto-dismiss toast after 3000ms
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

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
    showToast("Module complete", "success");
  }

  function togglePanel() {
    setPanelState((prev) => {
      if (prev === "expanded") return "collapsed";
      if (prev === "collapsed") return "hidden";
      return "expanded";
    });
  }

  // Module not found
  if (!mod) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 48,
          minHeight: 400,
        }}
      >
        <h1
          style={{
            fontFamily: font.display,
            fontSize: 24,
            lineHeight: "30px",
            fontWeight: 600,
            color: "#FFFFFF",
            margin: 0,
          }}
        >
          Module not found
        </h1>
        <p
          style={{
            fontFamily: font.body,
            fontSize: 14,
            lineHeight: "20px",
            fontWeight: 400,
            color: "#737373",
            margin: 0,
            marginTop: 8,
            textAlign: "center",
          }}
        >
          This module doesn&apos;t exist or has been removed.
        </p>
        <div style={{ marginTop: 20 }}>
          <Link href="/learn" style={{ textDecoration: "none" }}>
            <OutlineButton>Back to Learn</OutlineButton>
          </Link>
        </div>
      </div>
    );
  }

  const panelWidth = panelState === "expanded" ? 280 : panelState === "collapsed" ? 48 : 0;
  const gated = isModuleGated(slug);
  const lastModule = isLastModule(slug);

  return (
    <div
      className="lesson-viewport"
      style={{
        margin: "-48px -32px",
        height: "100vh",
        overflow: "hidden",
        display: "flex",
      }}
    >
      <style>{`
        .video-cap { max-height: 360px; }
        @media (max-width: 768px) {
          .video-cap { max-height: 220px; }
          .lesson-viewport { flex-direction: column !important; height: auto !important; overflow: visible !important; margin: 0 !important; }
          .lesson-right-col { width: 100% !important; border-left: none !important; border-top: 1px solid var(--color-border-subtle); padding-top: 20px; }
          .lesson-right-col .lesson-panel-toggle { display: none !important; }
          .lesson-scroll-area { padding-left: 16px !important; padding-right: 16px !important; }
          .lesson-reopen-btn { display: none !important; }
          .lesson-bottom-nav { padding: 12px 16px !important; }
          .lesson-bottom-nav > div { grid-template-columns: 1fr !important; gap: 10px !important; }
          .lesson-bottom-nav > div > * { text-align: center; justify-content: center; }
          .lesson-tab-bar { overflow-x: auto; scrollbar-width: none; -ms-overflow-style: none; padding-left: 16px !important; padding-right: 16px !important; }
          .lesson-tab-bar::-webkit-scrollbar { display: none; }
          .lesson-tab-bar > div { white-space: nowrap; flex-wrap: nowrap; }
          .lesson-back-link { padding-left: 16px !important; padding-right: 16px !important; }
          .lesson-video-wrap { padding-left: 16px !important; padding-right: 16px !important; }
        }
      `}</style>
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
        {/* -- BACK LINK -- */}
        <div className="lesson-back-link" style={{ flexShrink: 0, padding: "16px 32px" }}>
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

        {/* -- VIDEO SECTION (collapsible) — hidden if no video URL -- */}
        {mockVideoUrl && (
          <>
            <div
              style={{
                flexShrink: 0,
                display: "grid",
                gridTemplateRows: videoCollapsed ? "0fr" : "1fr",
                transition: "grid-template-rows 250ms cubic-bezier(0.25, 1, 0.5, 1)",
              }}
            >
              <div
                style={{
                  overflow: "hidden",
                  minHeight: 0,
                  opacity: videoCollapsed ? 0 : 1,
                  transition: "opacity 150ms cubic-bezier(0.25, 1, 0.5, 1)",
                }}
              >
                <div className="lesson-video-wrap" style={{ padding: "0 32px" }}>
                  <div
                    className="video-cap"
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
                      src={mockVideoUrl}
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
                      paddingBottom: 16,
                    }}
                  >
                    Unit {mod.unitNumber} · Module {mod.moduleNumber} · {mod.track}
                  </p>
                </div>
              </div>
            </div>

            {/* -- VIDEO COLLAPSE TOGGLE -- */}
            <button
              onClick={() => setVideoCollapsed((v) => !v)}
              style={{
                flexShrink: 0,
                width: "100%",
                height: 28,
                backgroundColor: "var(--color-bg-surface-2)",
                borderTop: "1px solid var(--color-border-subtle)",
                borderBottom: "1px solid var(--color-border-subtle)",
                borderLeft: "none",
                borderRight: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                cursor: "pointer",
                color: "var(--color-text-tertiary)",
                transitionProperty: "background-color, color",
                transitionDuration: "var(--duration-fast)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--color-bg-surface-3)";
                e.currentTarget.style.color = "var(--color-text-primary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "var(--color-bg-surface-2)";
                e.currentTarget.style.color = "var(--color-text-tertiary)";
              }}
            >
              <ChevronUp
                style={{
                  width: 14,
                  height: 14,
                  color: "inherit",
                  transform: videoCollapsed ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 200ms",
                }}
              />
              <span
                style={{
                  fontFamily: font.mono,
                  fontSize: 11,
                  lineHeight: "14px",
                  fontWeight: 500,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: "inherit",
                }}
              >
                {videoCollapsed ? "Show video" : "Hide video"}
              </span>
            </button>
          </>
        )}

        {/* -- ADVISORY BANNER (gated module) -- */}
        {gated && (
          <div style={{ padding: "16px 32px 0" }}>
            <div
              style={{
                backgroundColor: "rgba(245,158,11,0.06)",
                border: "1px solid rgba(245,158,11,0.20)",
                borderRadius: 10,
                padding: "12px 16px",
                marginBottom: 20,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <AlertTriangle style={{ width: 16, height: 16, color: "#F59E0B", flexShrink: 0 }} />
              <span
                style={{
                  fontFamily: font.body,
                  fontSize: 14,
                  lineHeight: "20px",
                  fontWeight: 400,
                  color: "#B5B5B5",
                }}
              >
                Complete previous modules to unlock this content.
              </span>
            </div>
          </div>
        )}

        {/* -- TAB BAR -- */}
        <div
          className="lesson-tab-bar"
          style={{
            flexShrink: 0,
            padding: "16px 32px 0",
            backgroundColor: "var(--color-bg-base)",
            position: "relative",
          }}
        >
          <div style={{ display: "flex", borderBottom: "1px solid #242424", gap: 0, marginBottom: 24 }}>
            {tabs.map((tab) => {
              const isActive = activeTab === tab;
              const count = tabCounts[tab];
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    height: 40,
                    padding: "0 16px",
                    backgroundColor: "transparent",
                    border: "none",
                    borderBottom: isActive ? "2px solid #6366F1" : "2px solid transparent",
                    marginBottom: -1,
                    fontFamily: font.body,
                    fontSize: 14,
                    fontWeight: isActive ? 500 : 400,
                    color: isActive ? "#FFFFFF" : "#737373",
                    cursor: "pointer",
                    transitionProperty: "color, border-color",
                    transitionDuration: "120ms",
                    transitionTimingFunction: "ease",
                    display: "inline-flex",
                    alignItems: "center",
                  }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = "#B5B5B5"; }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = "#737373"; }}
                >
                  {tab}
                  {count != null && (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minWidth: 18,
                        height: 18,
                        borderRadius: 999,
                        backgroundColor: "#202020",
                        fontFamily: font.mono,
                        fontSize: 10,
                        color: "#737373",
                        marginLeft: 6,
                      }}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Hidden-state reopen button */}
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

        {/* -- TAB CONTENT (scrollable) -- */}
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

              <TabProgressHint isComplete={isComplete} />
            </div>
          )}

          {/* LESSON TAB */}
          {activeTab === "Lesson" && (
            <div>
              <Link
                href={`/learn/${slug}/lesson`}
                onClick={() => setReadLesson(true)}
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

              {/* Mark Complete — Lesson tab */}
              <div style={{ marginTop: 32 }}>
                <MarkCompleteSection
                  isComplete={isComplete}
                  onMarkComplete={handleMarkComplete}
                />
              </div>
            </div>
          )}

          {/* RESOURCES TAB */}
          {activeTab === "Resources" && (
            <div>
              {mockResources.length > 0 ? (
                <>
                  <SectionLabel>{`${mockResources.length} Resources`}</SectionLabel>
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
                </>
              ) : (
                <p
                  style={{
                    fontFamily: font.body,
                    fontSize: 14,
                    lineHeight: "20px",
                    fontWeight: 400,
                    color: "#737373",
                    textAlign: "center",
                    marginTop: 48,
                  }}
                >
                  No resources for this lesson.
                </p>
              )}

              <TabProgressHint isComplete={isComplete} />
            </div>
          )}

          {/* SESSIONS TAB */}
          {activeTab === "Sessions" && (
            <div>
              {mockSessions.length > 0 ? (
                <>
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
                </>
              ) : (
                <p
                  style={{
                    fontFamily: font.body,
                    fontSize: 14,
                    lineHeight: "20px",
                    fontWeight: 400,
                    color: "#737373",
                    textAlign: "center",
                    marginTop: 48,
                  }}
                >
                  No sessions scheduled for this module.
                </p>
              )}

              <TabProgressHint isComplete={isComplete} />
            </div>
          )}

          {/* QUESTIONS TAB */}
          {activeTab === "Questions" && quizQuestions.length > 0 && (
            <QuestionsTab
              onPass={handleQuizPass}
              isComplete={isComplete}
              onMarkComplete={handleMarkComplete}
            />
          )}
        </div>

        {/* -- BOTTOM NAV BAR -- */}
        <div
          className="lesson-bottom-nav"
          style={{
            flexShrink: 0,
            backgroundColor: "var(--color-bg-surface)",
            borderTop: "1px solid var(--color-border-subtle)",
            padding: "12px 24px",
            zIndex: 10,
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 12 }}>
            {/* LEFT — prev module */}
            <div style={{ minWidth: 0 }}>
              {nav.prev && (
                <Link href={`/learn/${nav.prev.slug}`} style={{ textDecoration: "none", display: "inline-flex" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      cursor: "pointer",
                      transitionProperty: "opacity",
                      transitionDuration: "var(--duration-fast)",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.7"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
                  >
                    <ArrowLeft style={{ width: 16, height: 16, color: "var(--color-text-tertiary)", flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <span
                        style={{
                          fontFamily: font.mono,
                          fontSize: 10,
                          lineHeight: "12px",
                          fontWeight: 500,
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                          color: "var(--color-text-tertiary)",
                          display: "block",
                        }}
                      >
                        Previous
                      </span>
                      <span
                        style={{
                          fontFamily: font.body,
                          fontSize: 13,
                          lineHeight: "18px",
                          fontWeight: 500,
                          color: "var(--color-text-primary)",
                          display: "block",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {nav.prev.title}
                      </span>
                    </div>
                  </div>
                </Link>
              )}
            </div>

            {/* CENTER — module position */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
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
                Module
              </span>
              <span
                style={{
                  fontFamily: font.display,
                  fontSize: 16,
                  lineHeight: "22px",
                  fontWeight: 600,
                  color: "var(--color-text-primary)",
                }}
              >
                {mod.moduleNumber} / {String(unitModuleCount).padStart(2, "0")}
              </span>
            </div>

            {/* RIGHT — next module */}
            <div style={{ minWidth: 0, display: "flex", justifyContent: "flex-end" }}>
              {nav.next && !lastModule ? (
                <Link href={`/learn/${nav.next.slug}`} style={{ textDecoration: "none", display: "inline-flex", maxWidth: "100%" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      cursor: "pointer",
                      transitionProperty: "opacity",
                      transitionDuration: "var(--duration-fast)",
                      minWidth: 0,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.7"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
                  >
                    <div style={{ textAlign: "right", minWidth: 0 }}>
                      <span
                        style={{
                          fontFamily: font.mono,
                          fontSize: 10,
                          lineHeight: "12px",
                          fontWeight: 500,
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                          color: "var(--color-text-tertiary)",
                          display: "block",
                        }}
                      >
                        Next
                      </span>
                      <span
                        style={{
                          fontFamily: font.body,
                          fontSize: 13,
                          lineHeight: "18px",
                          fontWeight: 500,
                          color: "var(--color-text-primary)",
                          display: "block",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {nav.next.title}
                      </span>
                    </div>
                    <ArrowRight style={{ width: 16, height: 16, color: "var(--color-text-tertiary)", flexShrink: 0 }} />
                  </div>
                </Link>
              ) : lastModule ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    cursor: "default",
                    minWidth: 0,
                  }}
                >
                  <div style={{ textAlign: "right", minWidth: 0 }}>
                    <span
                      style={{
                        fontFamily: font.body,
                        fontSize: 13,
                        lineHeight: "18px",
                        fontWeight: 500,
                        color: "#737373",
                        display: "block",
                      }}
                    >
                      You&apos;ve finished this unit
                    </span>
                  </div>
                </div>
              ) : null}
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
        {/* -- EXPANDED STATE -- */}
        {panelState === "expanded" && (
          <>
            {/* Panel header */}
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
              <span className="lesson-panel-toggle">
                <PanelToggle onClick={togglePanel} expanded={true} />
              </span>
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

              {/* Navigate — redesigned with cards */}
              <div>
                <SectionLabel>Navigate</SectionLabel>
                <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 16 }}>
                  {nav.prev && (
                    <Link href={`/learn/${nav.prev.slug}`} style={{ textDecoration: "none", display: "block" }}>
                      <div
                        style={{
                          backgroundColor: "var(--color-bg-surface-2)",
                          border: "1px solid var(--color-border-subtle)",
                          borderRadius: 14,
                          padding: "12px 14px",
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          cursor: "pointer",
                          transitionProperty: "background-color, border-color",
                          transitionDuration: "var(--duration-fast)",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = "var(--color-border-strong)";
                          e.currentTarget.style.backgroundColor = "var(--color-bg-surface-3)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = "var(--color-border-subtle)";
                          e.currentTarget.style.backgroundColor = "var(--color-bg-surface-2)";
                        }}
                      >
                        <ArrowLeft style={{ width: 16, height: 16, color: "var(--color-text-tertiary)", flexShrink: 0 }} />
                        <div style={{ minWidth: 0 }}>
                          <span style={{ fontFamily: font.mono, fontSize: 10, lineHeight: "12px", fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-text-tertiary)", display: "block" }}>
                            Previous Module
                          </span>
                          <p style={{ fontFamily: font.body, fontSize: 13, lineHeight: "18px", fontWeight: 500, color: "var(--color-text-primary)", margin: 0, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {nav.prev.title}
                          </p>
                        </div>
                      </div>
                    </Link>
                  )}
                  {nav.next && (
                    <Link href={`/learn/${nav.next.slug}`} style={{ textDecoration: "none", display: "block" }}>
                      <div
                        style={{
                          backgroundColor: "var(--color-bg-surface-2)",
                          border: "1px solid var(--color-border-subtle)",
                          borderRadius: 14,
                          padding: "12px 14px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          cursor: "pointer",
                          transitionProperty: "background-color, border-color",
                          transitionDuration: "var(--duration-fast)",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = "var(--color-border-strong)";
                          e.currentTarget.style.backgroundColor = "var(--color-bg-surface-3)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = "var(--color-border-subtle)";
                          e.currentTarget.style.backgroundColor = "var(--color-bg-surface-2)";
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <span style={{ fontFamily: font.mono, fontSize: 10, lineHeight: "12px", fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-text-tertiary)", display: "block" }}>
                            Next Module
                          </span>
                          <p style={{ fontFamily: font.body, fontSize: 13, lineHeight: "18px", fontWeight: 500, color: "var(--color-text-primary)", margin: 0, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {nav.next.title}
                          </p>
                        </div>
                        <ArrowRight style={{ width: 16, height: 16, color: "var(--color-text-tertiary)", flexShrink: 0 }} />
                      </div>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* -- COLLAPSED STATE -- */}
        {panelState === "collapsed" && (
          <>
            <div style={{ flexShrink: 0, padding: 10, display: "flex", justifyContent: "center" }}>
              <PanelToggle onClick={togglePanel} expanded={false} />
            </div>

            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "12px 0" }}>
              <IconWithTooltip icon={BookOpen} label="Lesson navigator" onClick={() => setPanelState("expanded")} />
              {nav.prev && (
                <Link href={`/learn/${nav.prev.slug}`} style={{ textDecoration: "none" }}>
                  <IconWithTooltip icon={ArrowLeft} label={`Previous module: ${nav.prev.title}`} />
                </Link>
              )}
              {nav.next && (
                <Link href={`/learn/${nav.next.slug}`} style={{ textDecoration: "none" }}>
                  <IconWithTooltip icon={ArrowRight} label={`Next module: ${nav.next.title}`} />
                </Link>
              )}
            </div>
          </>
        )}
      </aside>

      {/* ── Toast notification ── */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 50,
            background: "#1C1C1C",
            border: "1px solid #333333",
            borderRadius: 10,
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            minWidth: 280,
            maxWidth: 360,
            boxShadow: "0 16px 40px rgba(0,0,0,0.55)",
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              backgroundColor: toastDotColor[toast.type],
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontFamily: font.body,
              fontSize: 14,
              color: "#FFFFFF",
            }}
          >
            {toast.message}
          </span>
        </div>
      )}
    </div>
  );
}

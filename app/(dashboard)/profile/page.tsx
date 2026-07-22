"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { mockUnits } from "@/lib/mock-learn-data";

// ---------------------------------------------------------------------------
// Mock data — replaced with Supabase queries later
// ---------------------------------------------------------------------------
const mockUser = {
  firstName: "Amara",
  lastName: "Okonkwo",
  bio: "Product designer passionate about Bitcoin and open source design. Building for African users.",
  portfolioUrl: "https://figma.com/amara",
  track: "Design Lab",
  cohort: "Cohort 01",
  joined: "Jul 1, 2025",
  role: "LEARNER" as const,
  status: "Active" as const,
};

const mockSubmissions = [
  {
    title: "Bitcoin UX Audit \u2014 Wallets",
    date: "10 JUL 2025",
    status: "needs-revision" as const,
  },
  {
    title: "Bitcoin Mental Models Map",
    date: "28 JUN 2025",
    status: "passed" as const,
  },
];

// ---------------------------------------------------------------------------
// Shared style shortcuts
// ---------------------------------------------------------------------------
const font = {
  display: "var(--font-display), 'Space Grotesk', 'Inter', system-ui, sans-serif",
  body: "var(--font-body), 'Inter', system-ui, -apple-system, sans-serif",
  mono: "var(--font-mono), 'JetBrains Mono', 'SF Mono', monospace",
};

// ---------------------------------------------------------------------------
// Progress helpers
// ---------------------------------------------------------------------------
function getUnitProgress() {
  return mockUnits.map((unit) => {
    const complete = unit.modules.filter((m) => m.status === "passed").length;
    const total = unit.modules.length;
    return {
      id: unit.id,
      number: unit.number,
      title: unit.title,
      complete,
      total,
      percent: total > 0 ? Math.round((complete / total) * 100) : 0,
    };
  });
}

function getOverallProgress() {
  const allModules = mockUnits.flatMap((u) => u.modules);
  const total = allModules.length;
  const complete = allModules.filter((m) => m.status === "passed").length;
  return { total, complete, percent: total > 0 ? Math.round((complete / total) * 100) : 0 };
}

// ---------------------------------------------------------------------------
// Toast type
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
// Status pill colors
// ---------------------------------------------------------------------------
const submissionStatusStyles: Record<
  "passed" | "needs-revision",
  { bg: string; border: string; color: string; label: string }
> = {
  passed: {
    bg: "rgba(34,197,94,0.10)",
    border: "rgba(34,197,94,0.20)",
    color: "#4ADE80",
    label: "PASSED",
  },
  "needs-revision": {
    bg: "rgba(245,158,11,0.10)",
    border: "rgba(245,158,11,0.20)",
    color: "#F59E0B",
    label: "NEEDS REVISION",
  },
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function ProfilePage() {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState(mockUser.bio);
  const [portfolioUrl, setPortfolioUrl] = useState(mockUser.portfolioUrl);
  const [editBio, setEditBio] = useState(mockUser.bio);
  const [editPortfolioUrl, setEditPortfolioUrl] = useState(mockUser.portfolioUrl);
  const [toast, setToast] = useState<ToastData | null>(null);

  const showToast = useCallback((message: string, type: ToastData["type"] = "success") => {
    setToast({ message, type });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const unitProgress = getUnitProgress();
  const overall = getOverallProgress();

  const initials = `${mockUser.firstName[0]}${mockUser.lastName[0]}`;

  function handleEditStart() {
    setEditBio(bio);
    setEditPortfolioUrl(portfolioUrl);
    setIsEditing(true);
  }

  function handleSave() {
    setBio(editBio);
    setPortfolioUrl(editPortfolioUrl);
    setIsEditing(false);
    showToast("Profile updated");
  }

  function handleCancel() {
    setIsEditing(false);
  }

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .profile-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div style={{ maxWidth: 880, margin: "0 auto" }}>
        {/* ── ZONE 1: Page Header ── */}
        <header style={{ marginTop: 32 }}>
          <p
            style={{
              fontFamily: font.mono,
              fontSize: 11,
              lineHeight: "14px",
              fontWeight: 600,
              letterSpacing: "0.10em",
              textTransform: "uppercase",
              color: "#737373",
              margin: 0,
              marginBottom: 8,
            }}
          >
            DASHBOARD · PROFILE
          </p>
          <h1
            style={{
              fontFamily: font.display,
              fontSize: 28,
              lineHeight: "34px",
              fontWeight: 700,
              color: "#FFFFFF",
              margin: 0,
              marginBottom: 32,
            }}
          >
            My Profile
          </h1>
        </header>

        {/* ── ZONE 2: Two-Column Grid ── */}
        <div
          className="profile-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "280px 1fr",
            gap: 24,
            alignItems: "start",
            marginBottom: 24,
          }}
        >
          {/* ── LEFT COLUMN — Identity Card ── */}
          <div
            style={{
              backgroundColor: "#111111",
              border: "1px solid #242424",
              borderRadius: 14,
              padding: 24,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                backgroundColor: "#1C1C1C",
                border: "2px solid #333333",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
                overflow: "hidden",
              }}
            >
              <span
                style={{
                  fontFamily: font.display,
                  fontSize: 24,
                  fontWeight: 600,
                  color: "#737373",
                }}
              >
                {initials}
              </span>
            </div>

            {/* Name */}
            <span
              style={{
                fontFamily: font.display,
                fontSize: 20,
                fontWeight: 600,
                color: "#FFFFFF",
                marginBottom: 4,
              }}
            >
              {mockUser.firstName} {mockUser.lastName}
            </span>

            {/* Role pill */}
            <span
              style={{
                fontFamily: font.mono,
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                backgroundColor: "#1C1C1C",
                border: "1px solid #333333",
                color: "#737373",
                padding: "3px 10px",
                borderRadius: 999,
                marginBottom: 16,
              }}
            >
              {mockUser.role}
            </span>

            {/* Divider */}
            <div style={{ width: "100%", height: 1, backgroundColor: "#242424", margin: "16px 0" }} />

            {/* Track info */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%", textAlign: "left" }}>
              {[
                { label: "TRACK", value: mockUser.track },
                { label: "COHORT", value: mockUser.cohort },
                { label: "JOINED", value: mockUser.joined },
              ].map((row) => (
                <div
                  key={row.label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontFamily: font.mono,
                      fontSize: 10,
                      fontWeight: 500,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      color: "#737373",
                    }}
                  >
                    {row.label}
                  </span>
                  <span
                    style={{
                      fontFamily: font.body,
                      fontSize: 13,
                      color: "#FFFFFF",
                    }}
                  >
                    {row.value}
                  </span>
                </div>
              ))}

              {/* Status row */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontFamily: font.mono,
                    fontSize: 10,
                    fontWeight: 500,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: "#737373",
                  }}
                >
                  STATUS
                </span>
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      backgroundColor: "#22C55E",
                      display: "inline-block",
                    }}
                  />
                  <span
                    style={{
                      fontFamily: font.body,
                      fontSize: 13,
                      color: "#22C55E",
                    }}
                  >
                    {mockUser.status}
                  </span>
                </span>
              </div>
            </div>

            {/* Divider */}
            <div style={{ width: "100%", height: 1, backgroundColor: "#242424", margin: "16px 0" }} />

            {/* Edit profile button */}
            <button
              onClick={handleEditStart}
              style={{
                width: "100%",
                height: 36,
                backgroundColor: "transparent",
                border: "1px solid #333333",
                borderRadius: 8,
                color: "#FFFFFF",
                fontFamily: font.body,
                fontSize: 14,
                cursor: "pointer",
                transition: "background 120ms ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#161616")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              Edit profile
            </button>
          </div>

          {/* ── RIGHT COLUMN — Stacked Cards ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Card A — ABOUT */}
            <div
              style={{
                backgroundColor: "#111111",
                border: "1px solid #242424",
                borderRadius: 14,
                padding: 24,
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
                  color: "#737373",
                  display: "block",
                  marginBottom: 16,
                }}
              >
                ABOUT
              </span>

              {isEditing ? (
                <>
                  {/* Bio textarea */}
                  <textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    style={{
                      width: "100%",
                      minHeight: 96,
                      backgroundColor: "#181818",
                      border: "1px solid #333333",
                      borderRadius: 10,
                      padding: "12px 14px",
                      fontFamily: font.body,
                      fontSize: 14,
                      color: "#FFFFFF",
                      resize: "vertical",
                      outline: "none",
                      boxSizing: "border-box",
                      lineHeight: "22px",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "rgba(99,102,241,0.70)";
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.15)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "#333333";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />

                  {/* Portfolio URL input */}
                  <div style={{ marginTop: 16 }}>
                    <label
                      style={{
                        fontFamily: font.mono,
                        fontSize: 11,
                        fontWeight: 600,
                        letterSpacing: "0.10em",
                        textTransform: "uppercase",
                        color: "#B5B5B5",
                        display: "block",
                        marginBottom: 8,
                      }}
                    >
                      PORTFOLIO URL
                    </label>
                    <input
                      type="text"
                      value={editPortfolioUrl}
                      onChange={(e) => setEditPortfolioUrl(e.target.value)}
                      placeholder="https://your-portfolio.com"
                      style={{
                        width: "100%",
                        height: 40,
                        backgroundColor: "#181818",
                        border: "1px solid #333333",
                        borderRadius: 10,
                        padding: "0 14px",
                        fontFamily: font.body,
                        fontSize: 14,
                        color: "#FFFFFF",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = "rgba(99,102,241,0.70)";
                        e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.15)";
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = "#333333";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    />
                  </div>

                  {/* Button row */}
                  <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 10 }}>
                    <button
                      onClick={handleSave}
                      style={{
                        height: 36,
                        padding: "0 16px",
                        backgroundColor: "#6366F1",
                        color: "#FFFFFF",
                        borderRadius: 8,
                        fontFamily: font.body,
                        fontSize: 14,
                        fontWeight: 500,
                        border: "none",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#777AF5")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#6366F1")}
                    >
                      Save changes
                    </button>
                    <button
                      onClick={handleCancel}
                      style={{
                        height: 36,
                        padding: "0 16px",
                        backgroundColor: "transparent",
                        color: "#737373",
                        border: "none",
                        fontFamily: font.body,
                        fontSize: 14,
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Bio text */}
                  <p
                    style={{
                      fontFamily: font.body,
                      fontSize: 14,
                      lineHeight: 1.6,
                      color: "#B5B5B5",
                      margin: 0,
                    }}
                  >
                    {bio}
                  </p>

                  {/* Portfolio link */}
                  <div
                    style={{
                      marginTop: 12,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <ExternalLink style={{ width: 14, height: 14, color: "#6366F1", flexShrink: 0 }} />
                    <span
                      onClick={() => window.open(portfolioUrl, "_blank")}
                      style={{
                        fontFamily: font.body,
                        fontSize: 14,
                        color: "#6366F1",
                        cursor: "pointer",
                        transition: "color 120ms ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "#777AF5")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "#6366F1")}
                    >
                      {portfolioUrl.replace(/^https?:\/\//, "")}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Card B — PROGRESS */}
            <div
              style={{
                backgroundColor: "#111111",
                border: "1px solid #242424",
                borderRadius: 14,
                padding: 24,
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
                  color: "#737373",
                  display: "block",
                  marginBottom: 20,
                }}
              >
                LEARNING PROGRESS
              </span>

              {/* Global progress row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span
                  style={{
                    fontFamily: font.mono,
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.10em",
                    textTransform: "uppercase",
                    color: "#737373",
                  }}
                >
                  OVERALL COMPLETION
                </span>
                <span
                  style={{
                    fontFamily: font.mono,
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#FFFFFF",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {overall.percent}%
                </span>
              </div>

              {/* Global progress bar */}
              <div
                style={{
                  height: 4,
                  backgroundColor: "#1C1C1C",
                  borderRadius: 999,
                  overflow: "hidden",
                  marginTop: 8,
                  marginBottom: 20,
                }}
              >
                <div
                  style={{
                    width: `${overall.percent}%`,
                    height: 4,
                    backgroundColor: "#6366F1",
                    borderRadius: 999,
                  }}
                />
              </div>

              {/* Divider */}
              <div style={{ height: 1, backgroundColor: "#242424", marginBottom: 20 }} />

              {/* Per-unit progress */}
              {unitProgress.map((unit) => (
                <div key={unit.id} style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span
                      style={{
                        fontFamily: font.body,
                        fontSize: 13,
                        fontWeight: 500,
                        color: "#FFFFFF",
                      }}
                    >
                      {unit.title}
                    </span>
                    <span
                      style={{
                        fontFamily: font.mono,
                        fontSize: 11,
                        color: "#737373",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {unit.complete} / {unit.total}
                    </span>
                  </div>
                  <div
                    style={{
                      height: 3,
                      backgroundColor: "#1C1C1C",
                      borderRadius: 999,
                      overflow: "hidden",
                      marginTop: 6,
                    }}
                  >
                    <div
                      style={{
                        width: `${unit.percent}%`,
                        height: 3,
                        backgroundColor: "#6366F1",
                        borderRadius: 999,
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontFamily: font.mono,
                      fontSize: 10,
                      color: "#4A4A4A",
                      textTransform: "uppercase",
                      display: "block",
                      marginTop: 4,
                    }}
                  >
                    UNIT {unit.number}
                  </span>
                </div>
              ))}

              {/* Divider */}
              <div style={{ height: 1, backgroundColor: "#242424", margin: "20px 0" }} />

              {/* Stats row */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 12,
                }}
              >
                {[
                  { label: "MODULES DONE", value: "07" },
                  { label: "MISSIONS PASSED", value: "02" },
                  { label: "WEEK", value: "03" },
                ].map((stat) => (
                  <div key={stat.label}>
                    <span
                      style={{
                        fontFamily: font.mono,
                        fontSize: 10,
                        fontWeight: 500,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        color: "#737373",
                        display: "block",
                      }}
                    >
                      {stat.label}
                    </span>
                    <span
                      style={{
                        fontFamily: font.mono,
                        fontSize: 20,
                        fontWeight: 600,
                        color: "#FFFFFF",
                        display: "block",
                        marginTop: 4,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {stat.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Card C — SUBMISSIONS */}
            <div
              style={{
                backgroundColor: "#111111",
                border: "1px solid #242424",
                borderRadius: 14,
                padding: 24,
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
                  color: "#737373",
                  display: "block",
                  marginBottom: 16,
                }}
              >
                RECENT SUBMISSIONS
              </span>

              {/* Submission rows */}
              {mockSubmissions.map((sub, i) => {
                const style = submissionStatusStyles[sub.status];
                return (
                  <div
                    key={i}
                    style={{
                      padding: "12px 0",
                      borderBottom: i < mockSubmissions.length - 1 ? "1px solid #1C1C1C" : "none",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <span
                        style={{
                          fontFamily: font.body,
                          fontSize: 14,
                          fontWeight: 500,
                          color: "#FFFFFF",
                        }}
                      >
                        {sub.title}
                      </span>
                      <span
                        style={{
                          fontFamily: font.mono,
                          fontSize: 11,
                          color: "#737373",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {sub.date}
                      </span>
                    </div>
                    <span
                      style={{
                        fontFamily: font.mono,
                        fontSize: 10,
                        fontWeight: 500,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        backgroundColor: style.bg,
                        border: `1px solid ${style.border}`,
                        color: style.color,
                        padding: "3px 8px",
                        borderRadius: 999,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {style.label}
                    </span>
                  </div>
                );
              })}

              {/* Footer */}
              <div style={{ marginTop: 16 }}>
                <span
                  onClick={() => router.push("/missions")}
                  style={{
                    fontFamily: font.body,
                    fontSize: 13,
                    color: "#6366F1",
                    cursor: "pointer",
                    transition: "color 120ms ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#777AF5")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#6366F1")}
                >
                  View all submissions &rarr;
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

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
    </>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { Link2, Inbox, Megaphone } from "lucide-react";
import { ArrowRight } from "lucide-react";
import { SectionLabel } from "@/components/ui/custom/section-label";
import { PrimaryButton, OutlineButton } from "@/components/ui/custom/buttons";
import { mockAdminStats, mockReviewQueue } from "@/lib/mock-admin-data";

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

function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffMins = Math.floor(diffMs / 60000);

  if (diffDays > 30) {
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }
  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHours > 0) return `${diffHours}h ago`;
  if (diffMins > 0) return `${diffMins}m ago`;
  return "just now";
}

export default function AdminOverviewPage() {
  const router = useRouter();
  const pendingCount = mockReviewQueue.filter((r) => r.status === "pending").length;
  const hasPending = mockAdminStats.pendingReviews > 0;

  const stats = [
    {
      label: "TOTAL LEARNERS",
      value: String(mockAdminStats.totalLearners),
      context: "COHORT 01",
      valueColor: "var(--color-text-primary)",
      accent: false,
    },
    {
      label: "PENDING REVIEWS",
      value: String(mockAdminStats.pendingReviews),
      context: "NEEDS ATTENTION",
      valueColor: "var(--color-text-primary)",
      accent: hasPending,
    },
    {
      label: "MISSIONS PASSED",
      value: String(mockAdminStats.passedMissions),
      context: "OF 15 TOTAL",
      valueColor: "var(--color-text-primary)",
      accent: false,
    },
    {
      label: "THIS WEEK",
      value: String(mockAdminStats.submissionsThisWeek),
      context: "SUBMISSIONS",
      valueColor: "var(--color-text-primary)",
      accent: false,
    },
  ];

  const quickActions = [
    {
      title: "Generate Invite Link",
      desc: "Add new learners to a cohort",
      descColor: "var(--color-text-tertiary)",
      icon: Link2,
      iconColor: "var(--color-indigo-text)",
      href: "/admin/invites",
      urgent: false,
    },
    {
      title: "Review Queue",
      desc: pendingCount > 0 ? `${pendingCount} pending` : "All clear",
      descColor: "var(--color-text-tertiary)",
      icon: Inbox,
      iconColor: "var(--color-text-tertiary)",
      href: "/admin/review",
      urgent: pendingCount > 0,
    },
    {
      title: "Post Announcement",
      desc: "Notify your cohort",
      descColor: "var(--color-text-tertiary)",
      icon: Megaphone,
      iconColor: "var(--color-text-tertiary)",
      href: "/admin/announcements",
      urgent: false,
    },
  ];

  return (
    <div>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <div>
          {/* Context line */}
          <span
            style={{
              fontFamily: font.mono,
              fontSize: 11,
              lineHeight: "14px",
              fontWeight: 600,
              letterSpacing: "0.10em",
              textTransform: "uppercase",
              color: "var(--color-text-tertiary)",
              display: "block",
            }}
          >
            ADMIN · BITDESIGNERS AFRICA
          </span>

          {/* Title */}
          <h1
            style={{
              fontFamily: font.display,
              fontSize: 36,
              lineHeight: "42px",
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: "var(--color-text-primary)",
              margin: 0,
              marginTop: 10,
            }}
          >
            Dashboard
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontFamily: font.body,
              fontSize: 14,
              lineHeight: "22px",
              fontWeight: 400,
              color: "var(--color-text-secondary)",
              margin: 0,
              marginTop: 6,
            }}
          >
            Cohort 01 · Active
          </p>
        </div>

        <PrimaryButton onClick={() => router.push("/admin/invites")}>Invite Learner</PrimaryButton>
      </div>

      {/* Stats grid */}
      <div
        style={{ marginTop: 40, display: "grid", gap: 16 }}
        className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
      >
        {stats.map((stat) => (
          <div
            key={stat.label}
            style={{
              ...cardStyle,
              padding: stat.accent ? "20px 20px 20px 17px" : 20,
              borderLeft: stat.accent ? "3px solid var(--color-warning)" : undefined,
            }}
          >
            <span
              style={{
                fontFamily: font.mono,
                fontSize: 12,
                lineHeight: "16px",
                fontWeight: 600,
                letterSpacing: "0.10em",
                textTransform: "uppercase",
                color: "var(--color-text-tertiary)",
              }}
            >
              {stat.label}
            </span>
            <p
              style={{
                fontFamily: font.mono,
                fontSize: 32,
                lineHeight: "36px",
                fontWeight: 600,
                letterSpacing: "-0.02em",
                color: stat.valueColor,
                margin: 0,
                marginTop: 12,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {stat.value}
            </p>
            <p
              style={{
                fontFamily: font.mono,
                fontSize: 13,
                lineHeight: "18px",
                fontWeight: 500,
                color: "var(--color-text-tertiary)",
                textTransform: "uppercase",
                margin: 0,
                marginTop: 6,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {stat.context}
            </p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ marginTop: 48 }}>
        <div style={{ marginBottom: 16 }}>
          <SectionLabel>QUICK ACTIONS</SectionLabel>
        </div>
        <div
          style={{
            border: "1px solid var(--color-border-subtle)",
            borderRadius: 14,
            overflow: "hidden",
          }}
        >
          {quickActions.map((action, i) => {
            const Icon = action.icon;
            const iconBg = action.title === "Generate Invite Link"
              ? "var(--color-indigo-subtle)"
              : action.urgent
                ? "rgba(245,158,11,0.10)"
                : "var(--color-bg-surface-2)";
            return (
              <div
                key={action.title}
                role="button"
                tabIndex={0}
                onClick={() => router.push(action.href)}
                onKeyDown={(e) => { if (e.key === "Enter") router.push(action.href); }}
                style={{
                  padding: "16px 20px",
                  borderBottom: i < quickActions.length - 1 ? "1px solid var(--color-border-subtle)" : "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                  transitionProperty: "background-color",
                  transitionDuration: "120ms",
                  transitionTimingFunction: "ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#161616";
                  const arrow = e.currentTarget.querySelector("[data-arrow]") as HTMLElement | null;
                  if (arrow) arrow.style.color = "var(--color-text-primary)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  const arrow = e.currentTarget.querySelector("[data-arrow]") as HTMLElement | null;
                  if (arrow) arrow.style.color = "var(--color-text-tertiary)";
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      backgroundColor: iconBg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon style={{ width: 18, height: 18, color: action.iconColor }} />
                  </div>
                  <div>
                    <p
                      style={{
                        fontFamily: font.body,
                        fontSize: 14,
                        lineHeight: "20px",
                        fontWeight: 500,
                        color: "var(--color-text-primary)",
                        margin: 0,
                      }}
                    >
                      {action.title}
                    </p>
                    <p
                      style={{
                        fontFamily: font.body,
                        fontSize: 13,
                        lineHeight: "18px",
                        fontWeight: 400,
                        color: action.descColor,
                        margin: 0,
                        marginTop: 2,
                      }}
                    >
                      {action.desc}
                    </p>
                  </div>
                </div>
                <ArrowRight
                  data-arrow=""
                  style={{
                    width: 16,
                    height: 16,
                    color: "var(--color-text-tertiary)",
                    flexShrink: 0,
                    transitionProperty: "color",
                    transitionDuration: "var(--duration-fast)",
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Submissions */}
      <div style={{ marginTop: 48 }}>
        <div style={{ marginBottom: 16 }}>
          <SectionLabel>RECENT SUBMISSIONS</SectionLabel>
        </div>
        <div style={{ border: "1px solid #242424", borderRadius: 12, overflow: "hidden" }}>
          {mockReviewQueue.length === 0 ? (
            <p
              style={{
                fontFamily: font.body,
                fontSize: 14,
                fontWeight: 400,
                color: "#737373",
                margin: 0,
                padding: 24,
                textAlign: "center",
              }}
            >
              No recent submissions.
            </p>
          ) : (
            mockReviewQueue.map((item, i) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 20px",
                  borderBottom: i < mockReviewQueue.length - 1 ? "1px solid var(--color-border-subtle)" : "none",
                  gap: 16,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <p
                    style={{
                      fontFamily: font.body,
                      fontSize: 14,
                      fontWeight: 500,
                      color: "var(--color-text-primary)",
                      margin: 0,
                    }}
                  >
                    {item.learnerName}
                  </p>
                  <p
                    style={{
                      fontFamily: font.body,
                      fontSize: 13,
                      fontWeight: 400,
                      color: "var(--color-text-secondary)",
                      margin: 0,
                      marginTop: 2,
                    }}
                  >
                    {item.missionTitle}
                  </p>
                  <p
                    style={{
                      fontFamily: font.mono,
                      fontSize: 11,
                      lineHeight: "14px",
                      fontWeight: 500,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      color: "var(--color-text-tertiary)",
                      margin: 0,
                      marginTop: 2,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    VERSION {item.version} · {timeAgo(item.submittedAt)}
                  </p>
                </div>
                <OutlineButton size="small" onClick={() => router.push("/admin/review")}>
                  Review
                </OutlineButton>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

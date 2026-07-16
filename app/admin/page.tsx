"use client";

import { useRouter } from "next/navigation";
import { Link2, Inbox, Megaphone } from "lucide-react";
import { SectionLabel } from "@/components/ui/custom/section-label";
import { OutlineButton } from "@/components/ui/custom/buttons";
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
      valueColor: hasPending ? "var(--color-warning-text)" : "var(--color-text-primary)",
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
      descColor: pendingCount > 0 ? "var(--color-warning-text)" : "var(--color-text-tertiary)",
      icon: Inbox,
      iconColor: pendingCount > 0 ? "var(--color-warning-text)" : "var(--color-text-tertiary)",
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
            <SectionLabel>{stat.label}</SectionLabel>
            <p
              style={{
                fontFamily: font.mono,
                fontSize: 30,
                lineHeight: "34px",
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
        <SectionLabel>QUICK ACTIONS</SectionLabel>
        <div
          style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 16 }}
        >
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <div
                key={action.title}
                role="button"
                tabIndex={0}
                onClick={() => router.push(action.href)}
                onKeyDown={(e) => { if (e.key === "Enter") router.push(action.href); }}
                style={{
                  ...cardStyle,
                  padding: "16px 20px",
                  cursor: "pointer",
                  flex: "1 1 200px",
                  transitionProperty: "border-color, background-color",
                  transitionDuration: "var(--duration-fast)",
                  transitionTimingFunction: "var(--ease-out-quart)",
                  ...(action.urgent
                    ? {
                        borderColor: "rgba(245,158,11,0.30)",
                        backgroundColor: "rgba(245,158,11,0.10)",
                      }
                    : {}),
                }}
                onMouseEnter={(e) => {
                  if (!action.urgent) {
                    e.currentTarget.style.borderColor = "var(--color-border-strong)";
                    e.currentTarget.style.backgroundColor = "var(--color-bg-surface-2)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!action.urgent) {
                    e.currentTarget.style.borderColor = "var(--color-border-subtle)";
                    e.currentTarget.style.backgroundColor = "var(--color-bg-surface)";
                  }
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Icon style={{ width: 16, height: 16, color: action.iconColor, flexShrink: 0 }} />
                  <div>
                    <p
                      style={{
                        fontFamily: font.display,
                        fontSize: 14,
                        lineHeight: "20px",
                        fontWeight: 600,
                        color: "var(--color-text-primary)",
                        margin: 0,
                      }}
                    >
                      {action.title}
                    </p>
                    <p
                      style={{
                        fontFamily: font.body,
                        fontSize: 12,
                        lineHeight: "16px",
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
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Submissions */}
      <div style={{ marginTop: 48 }}>
        <SectionLabel>RECENT SUBMISSIONS</SectionLabel>
        <div style={{ marginTop: 16 }}>
          {mockReviewQueue.map((item, i) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 0",
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
          ))}
        </div>
      </div>
    </div>
  );
}

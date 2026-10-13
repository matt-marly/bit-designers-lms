"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { ArrowRight, CalendarClock, Inbox, Link2, Megaphone, type LucideIcon } from "lucide-react";
import { SectionLabel } from "@/components/ui/custom/section-label";
import { PrimaryButton, OutlineButton } from "@/components/ui/custom/buttons";
import { api } from "@/convex/_generated/api";
import { useNow } from "@/lib/use-now";
import { relativeTime } from "@/lib/time";
import { sessionDay, sessionTime } from "@/lib/sessions";

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

const mutedStyle: React.CSSProperties = {
  fontFamily: font.body,
  fontSize: 14,
  color: "var(--color-text-tertiary)",
  margin: 0,
};

function formatCount(count: { value: number; capped: boolean }) {
  return count.capped ? `${count.value}+` : String(count.value);
}

type QuickAction = {
  title: string;
  desc: string;
  icon: LucideIcon;
  href: string;
  tone: "indigo" | "warning" | "neutral";
};

export default function AdminOverviewPage() {
  const router = useRouter();
  const clock = useNow(60_000);
  const data = useQuery(api.adminOverview.overview, clock > 0 ? { now: clock } : "skip");

  if (data === undefined) {
    return <p style={mutedStyle}>Loading dashboard…</p>;
  }
  if (data === null) {
    return <p style={mutedStyle}>You don&apos;t have access to the admin dashboard.</p>;
  }

  const subtitle =
    data.activeCohorts.length === 0
      ? "No active cohorts"
      : data.activeCohorts.length === 1
        ? `${data.activeCohorts[0].name} · ${data.activeCohorts[0].trackName}`
        : `${data.activeCohorts.length} active cohorts`;

  const stats = [
    {
      label: "ACTIVE LEARNERS",
      value: formatCount(data.learners),
      context: data.activeCohorts.length === 1 ? data.activeCohorts[0].name : `${data.activeCohorts.length} COHORTS`,
      accent: false,
    },
    { label: "WAITING FOR REVIEW", value: formatCount(data.waiting), context: data.waiting.value > 0 ? "NEEDS ATTENTION" : "ALL CLEAR", accent: data.waiting.value > 0 },
    { label: "SUBMITTED", value: formatCount(data.submittedThisWeek), context: "LAST 7 DAYS", accent: false },
    { label: "REVIEWED", value: formatCount(data.reviewedThisWeek), context: "LAST 7 DAYS", accent: false },
  ];

  const quickActions: QuickAction[] = [];
  if (data.can.invite) {
    quickActions.push({ title: "Invite learners", desc: "Add people to a cohort", icon: Link2, href: "/admin/invites", tone: "indigo" });
  }
  if (data.can.review) {
    quickActions.push({
      title: "Review queue",
      desc: data.waiting.value > 0 ? `${formatCount(data.waiting)} waiting` : "All clear",
      icon: Inbox,
      href: "/admin/review",
      tone: data.waiting.value > 0 ? "warning" : "neutral",
    });
  }
  if (data.can.announce) {
    quickActions.push({ title: "Post an announcement", desc: "Reach a cohort or everyone", icon: Megaphone, href: "/admin/announcements", tone: "neutral" });
  }
  if (data.can.schedule) {
    quickActions.push({
      title: "Live sessions",
      desc: data.nextSession
        ? `Next: ${data.nextSession.title} · ${sessionDay(data.nextSession.scheduledAt)}, ${sessionTime(data.nextSession.scheduledAt)}`
        : "Nothing scheduled",
      icon: CalendarClock,
      href: "/admin/sessions",
      tone: "neutral",
    });
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
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
          <p style={{ fontFamily: font.body, fontSize: 14, lineHeight: "22px", color: "var(--color-text-secondary)", margin: 0, marginTop: 6 }}>
            {subtitle}
          </p>
        </div>
        {data.can.invite && <PrimaryButton onClick={() => router.push("/admin/invites")}>Invite learner</PrimaryButton>}
      </div>

      <div style={{ marginTop: 40, display: "grid", gap: 16 }} className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
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
                color: "var(--color-text-primary)",
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
              }}
            >
              {stat.context}
            </p>
          </div>
        ))}
      </div>

      {quickActions.length > 0 && (
        <div style={{ marginTop: 48 }}>
          <div style={{ marginBottom: 16 }}>
            <SectionLabel>QUICK ACTIONS</SectionLabel>
          </div>
          <div style={{ border: "1px solid var(--color-border-subtle)", borderRadius: 14, overflow: "hidden" }}>
            {quickActions.map((action, i) => {
              const Icon = action.icon;
              const iconBg =
                action.tone === "indigo"
                  ? "var(--color-indigo-subtle)"
                  : action.tone === "warning"
                    ? "rgba(245,158,11,0.10)"
                    : "var(--color-bg-surface-2)";
              const iconColor =
                action.tone === "indigo"
                  ? "var(--color-indigo-text)"
                  : action.tone === "warning"
                    ? "var(--color-warning)"
                    : "var(--color-text-tertiary)";
              return (
                <div
                  key={action.title}
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(action.href)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") router.push(action.href);
                  }}
                  style={{
                    padding: "16px 20px",
                    borderBottom: i < quickActions.length - 1 ? "1px solid var(--color-border-subtle)" : "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 16,
                    transition: "background-color 120ms ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#161616";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
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
                      <Icon style={{ width: 18, height: 18, color: iconColor }} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontFamily: font.body, fontSize: 14, lineHeight: "20px", fontWeight: 500, color: "var(--color-text-primary)", margin: 0 }}>
                        {action.title}
                      </p>
                      <p
                        style={{
                          fontFamily: font.body,
                          fontSize: 13,
                          lineHeight: "18px",
                          color: "var(--color-text-tertiary)",
                          margin: 0,
                          marginTop: 2,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {action.desc}
                      </p>
                    </div>
                  </div>
                  <ArrowRight style={{ width: 16, height: 16, color: "var(--color-text-tertiary)", flexShrink: 0 }} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {data.can.review && (
        <div style={{ marginTop: 48 }}>
          <div style={{ marginBottom: 16 }}>
            <SectionLabel>WAITING LONGEST</SectionLabel>
          </div>
          <div style={{ border: "1px solid var(--color-border-subtle)", borderRadius: 14, overflow: "hidden" }}>
            {data.recent.length === 0 ? (
              <p style={{ ...mutedStyle, padding: 24, textAlign: "center" }}>Nothing is waiting for review.</p>
            ) : (
              data.recent.map((item, i) => (
                <div
                  key={item._id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px 20px",
                    borderBottom: i < data.recent.length - 1 ? "1px solid var(--color-border-subtle)" : "none",
                    gap: 16,
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontFamily: font.body, fontSize: 14, fontWeight: 500, color: "var(--color-text-primary)", margin: 0 }}>
                      {item.learnerName}
                    </p>
                    <p style={{ fontFamily: font.body, fontSize: 13, color: "var(--color-text-secondary)", margin: 0, marginTop: 2 }}>
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
                      }}
                    >
                      {item.trackName} · Version {item.version} · {relativeTime(item.submittedAt, clock)}
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
      )}
    </div>
  );
}

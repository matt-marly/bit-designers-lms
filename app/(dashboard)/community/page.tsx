"use client";

import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { MessageCircle, ArrowRight, ExternalLink } from "lucide-react";
import { SectionLabel } from "@/components/ui/custom/section-label";
import { api } from "@/convex/_generated/api";
import { Avatar } from "@/components/admin/ui";
import { LoadingLine, TrackChips } from "@/components/learn/ui";
import { useLearnerTrack } from "@/lib/use-learner-track";

const font = {
  display: "var(--font-display), 'Space Grotesk', 'Inter', system-ui, sans-serif",
  body: "var(--font-body), 'Inter', system-ui, -apple-system, sans-serif",
  mono: "var(--font-mono), 'JetBrains Mono', 'SF Mono', monospace",
};

/* ─── Brand icon SVGs (lucide-react removed brand icons) ─── */

function TwitterIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 18, height: 18, color: "#FFFFFF" }}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function LinkedinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 18, height: 18, color: "#FFFFFF" }}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

/* ─── Channel data ─── */

const channels = [
  {
    id: "discord",
    name: "Discord",
    description:
      "The main hub. Announcements, help, weekly check-ins, and cohort discussion.",
    url: "https://discord.gg/bitcoindesign",
    iconBg: "#5865F2",
    iconBorder: false,
    icon: "discord",
  },
  {
    id: "twitter",
    name: "Twitter / X",
    description:
      "Follow for Bitcoin design content, program updates, and community highlights.",
    url: "https://twitter.com/bitcoindesign",
    iconBg: "#000000",
    iconBorder: true,
    icon: "twitter",
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    description:
      "Cohort group chat for quick questions, wins, and real-time support.",
    url: "https://chat.whatsapp.com/bitcoindesigners",
    iconBg: "#25D366",
    iconBorder: false,
    icon: "whatsapp",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    description:
      "Connect professionally. Follow the org page for public updates and opportunities.",
    url: "https://linkedin.com/company/bitcoindesigners",
    iconBg: "#0A66C2",
    iconBorder: false,
    icon: "linkedin",
  },
] as const;

type Directory = NonNullable<FunctionReturnType<typeof api.community.directory>>;
type Person = Directory["cohorts"][number]["members"][number];
type ShowcaseItem = FunctionReturnType<typeof api.community.showcase>[number];

function monthYear(ms: number) {
  return new Date(ms).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function cohortPeriod(cohort: { startsAt: number; endsAt: number | null }) {
  return cohort.endsAt ? `${monthYear(cohort.startsAt)} — ${monthYear(cohort.endsAt)}` : `Started ${monthYear(cohort.startsAt)}`;
}

function PersonCard({ person, badge }: { person: Person; badge?: string }) {
  return (
    <div
      style={{
        backgroundColor: "var(--color-bg-surface)",
        border: "1px solid var(--color-border-subtle)",
        borderRadius: 14,
        padding: 16,
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
        minWidth: 0,
      }}
    >
      <Avatar name={person.fullName} src={person.avatarUrl} size={40} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <p style={{ fontFamily: font.display, fontSize: 15, lineHeight: "21px", fontWeight: 600, color: "var(--color-text-primary)", margin: 0 }}>
            {person.fullName}
          </p>
          {badge && (
            <span
              style={{
                fontFamily: font.mono,
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "#A5B4FC",
                border: "1px solid rgba(99,102,241,0.35)",
                backgroundColor: "rgba(99,102,241,0.10)",
                borderRadius: 999,
                padding: "1px 8px",
              }}
            >
              {badge}
            </span>
          )}
        </div>
        {person.bio && (
          <p
            className="line-clamp-2"
            style={{ fontFamily: font.body, fontSize: 13, lineHeight: "19px", color: "var(--color-text-secondary)", margin: "4px 0 0" }}
          >
            {person.bio}
          </p>
        )}
        {person.portfolioUrl && (
          <a
            href={person.portfolioUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              marginTop: 6,
              fontFamily: font.body,
              fontSize: 12,
              color: "#A5B4FC",
              textDecoration: "none",
              maxWidth: "100%",
            }}
          >
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {person.portfolioUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}
            </span>
            <ExternalLink aria-hidden style={{ width: 11, height: 11, flexShrink: 0 }} />
          </a>
        )}
      </div>
    </div>
  );
}

function ShowcaseCard({ item }: { item: ShowcaseItem }) {
  return (
    <a
      href={item.linkUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group"
      style={{
        backgroundColor: "var(--color-bg-surface)",
        border: "1px solid var(--color-border-subtle)",
        borderRadius: 14,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        textDecoration: "none",
        transition: "border-color 120ms ease, background-color 120ms ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--color-border-strong)";
        e.currentTarget.style.backgroundColor = "#161616";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--color-border-subtle)";
        e.currentTarget.style.backgroundColor = "var(--color-bg-surface)";
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <p style={{ fontFamily: font.display, fontSize: 15, lineHeight: "21px", fontWeight: 600, color: "var(--color-text-primary)", margin: 0 }}>
          {item.missionTitle}
        </p>
        <ExternalLink aria-hidden style={{ width: 14, height: 14, color: "var(--color-text-tertiary)", flexShrink: 0, marginTop: 3 }} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Avatar name={item.learner.fullName} src={item.learner.avatarUrl} size={24} />
        <span style={{ fontFamily: font.body, fontSize: 13, color: "var(--color-text-secondary)" }}>{item.learner.fullName}</span>
        <span style={{ fontFamily: font.mono, fontSize: 11, color: "var(--color-text-tertiary)", marginLeft: "auto" }}>
          {new Date(item.reviewedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </span>
      </div>
    </a>
  );
}

/* ─── Channel icon renderer ─── */

function ChannelIcon({ channel }: { channel: (typeof channels)[number] }) {
  return (
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: channel.iconBg,
        border: channel.iconBorder
          ? "1px solid var(--color-border-subtle)"
          : "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {(channel.icon === "discord" || channel.icon === "whatsapp") && (
        <MessageCircle style={{ width: 18, height: 18, color: "#FFFFFF" }} />
      )}
      {channel.icon === "twitter" && <TwitterIcon />}
      {channel.icon === "linkedin" && <LinkedinIcon />}
    </div>
  );
}

/* ─── Channel card ─── */

function ChannelCard({ channel }: { channel: (typeof channels)[number] }) {
  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => window.open(channel.url, "_blank")}
      onKeyDown={(e) => {
        if (e.key === "Enter") window.open(channel.url, "_blank");
      }}
      className="group"
      style={{
        backgroundColor: "var(--color-bg-surface)",
        border: "1px solid var(--color-border-subtle)",
        borderRadius: 14,
        padding: 20,
        cursor: "pointer",
        transitionProperty: "border-color, background-color",
        transitionDuration: "var(--duration-fast)",
        transitionTimingFunction: "var(--ease-out-quart)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--color-border-strong)";
        e.currentTarget.style.backgroundColor = "#161616";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--color-border-subtle)";
        e.currentTarget.style.backgroundColor = "var(--color-bg-surface)";
      }}
    >
      {/* Left */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <ChannelIcon channel={channel} />
        <div>
          <p
            style={{
              fontFamily: font.display,
              fontSize: 15,
              lineHeight: "21px",
              fontWeight: 600,
              color: "var(--color-text-primary)",
              margin: 0,
            }}
          >
            {channel.name}
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
            {channel.description}
          </p>
        </div>
      </div>

      {/* Right arrow */}
      <ArrowRight
        className="group-hover:text-[var(--color-text-primary)]"
        style={{
          width: 16,
          height: 16,
          color: "var(--color-text-tertiary)",
          flexShrink: 0,
          marginLeft: 16,
          transitionProperty: "color",
          transitionDuration: "var(--duration-fast)",
          transitionTimingFunction: "var(--ease-out-quart)",
        }}
      />
    </div>
  );
}

/* ─── Page ─── */

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
  gap: 12,
  marginTop: 20,
} as const;

const mutedTextStyle = {
  fontFamily: font.body,
  fontSize: 13,
  lineHeight: "19px",
  color: "var(--color-text-tertiary)",
  margin: 0,
} as const;

export default function CommunityPage() {
  const { loading, tracks, track, selectTrack } = useLearnerTrack();
  const directory = useQuery(api.community.directory, track ? { trackId: track.trackId } : "skip");
  const showcase = useQuery(api.community.showcase, track ? { trackId: track.trackId } : "skip");
  const contextLine = [track?.cohort?.name, track?.name].filter(Boolean).join(" · ");

  return (
    <div
      className="max-md:px-5 max-md:py-6"
      style={{ maxWidth: 760, margin: "0 auto", padding: "48px 32px" }}
    >
      {track && (
        <TrackChips tracks={tracks} selectedId={track.trackId} onSelect={selectTrack} />
      )}

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
          marginBottom: 12,
        }}
      >
        {contextLine || "\u00A0"}
      </span>

      {/* Title */}
      <h1
        style={{
          fontFamily: font.display,
          fontSize: 44,
          lineHeight: 1.1,
          fontWeight: 600,
          letterSpacing: "-0.02em",
          color: "var(--color-text-primary)",
          margin: 0,
        }}
      >
        Community
      </h1>

      {/* Subtitle */}
      <p
        style={{
          fontFamily: font.body,
          fontSize: 15,
          lineHeight: "24px",
          fontWeight: 400,
          color: "var(--color-text-secondary)",
          margin: 0,
          marginTop: 8,
          maxWidth: 420,
        }}
      >
        Connect with your cohort and the wider BitDesigners Africa community.
      </p>

      {/* Divider */}
      <div
        style={{
          height: 1,
          backgroundColor: "var(--color-border-subtle)",
          marginTop: 32,
          marginBottom: 40,
        }}
      />

      {/* ── Community Channels ── */}
      <div style={{ marginBottom: 0 }}>
        <SectionLabel>JOIN THE CONVERSATION</SectionLabel>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            marginTop: 20,
          }}
        >
          {channels.map((channel) => (
            <ChannelCard key={channel.id} channel={channel} />
          ))}
        </div>
      </div>

      {loading || (track && directory === undefined) ? (
        <div style={{ marginTop: 48 }}>
          <LoadingLine>Loading your community…</LoadingLine>
        </div>
      ) : !track || !directory ? (
        <p style={{ ...mutedTextStyle, marginTop: 48 }}>
          You&apos;ll see your cohort here once you&apos;re enrolled in a track.
        </p>
      ) : (
        <>
          {directory.cohorts.map((cohort) => (
            <section key={cohort._id} style={{ marginTop: 48 }}>
              <SectionLabel>{cohort.isOwn ? "YOUR COHORT" : cohort.name.toUpperCase()}</SectionLabel>
              <p style={{ ...mutedTextStyle, marginTop: 6 }}>
                {[cohort.isOwn ? cohort.name : null, cohortPeriod(cohort), `${cohort.members.length} ${cohort.members.length === 1 ? "designer" : "designers"}`]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              {cohort.members.length === 0 ? (
                <p style={{ ...mutedTextStyle, marginTop: 20 }}>No one has joined this cohort yet.</p>
              ) : (
                <div style={gridStyle}>
                  {cohort.members.map((person) => (
                    <PersonCard key={person._id} person={person} />
                  ))}
                </div>
              )}
            </section>
          ))}

          {directory.mentors.length > 0 && (
            <section style={{ marginTop: 48 }}>
              <SectionLabel>MENTORS</SectionLabel>
              <div style={gridStyle}>
                {directory.mentors.map((person) => (
                  <PersonCard key={person._id} person={person} badge={person.role === "lead_mentor" ? "Lead" : "Mentor"} />
                ))}
              </div>
            </section>
          )}

          <section style={{ marginTop: 48 }}>
            <SectionLabel>SHOWCASE</SectionLabel>
            <p style={{ ...mutedTextStyle, marginTop: 6 }}>
              Work that passed review in {track.name}. You can hide yours from your profile.
            </p>
            {showcase === undefined ? (
              <div style={{ marginTop: 20 }}>
                <LoadingLine>Loading showcase…</LoadingLine>
              </div>
            ) : showcase.length === 0 ? (
              <p style={{ ...mutedTextStyle, marginTop: 20 }}>
                Nothing here yet. Passed missions will appear as reviews come in.
              </p>
            ) : (
              <div style={gridStyle}>
                {showcase.map((item) => (
                  <ShowcaseCard key={item._id} item={item} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

"use client";

import { MessageCircle, ArrowRight } from "lucide-react";
import { SectionLabel } from "@/components/ui/custom/section-label";

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
    url: "https://discord.gg/placeholder",
    iconBg: "#5865F2",
    iconBorder: false,
    icon: "discord",
  },
  {
    id: "twitter",
    name: "Twitter / X",
    description:
      "Follow for Bitcoin design content, program updates, and community highlights.",
    url: "https://twitter.com/bitdesignersafrica",
    iconBg: "#000000",
    iconBorder: true,
    icon: "twitter",
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    description:
      "Cohort group chat for quick questions, wins, and real-time support.",
    url: "https://chat.whatsapp.com/placeholder",
    iconBg: "#25D366",
    iconBorder: false,
    icon: "whatsapp",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    description:
      "Connect professionally. Follow the org page for public updates and opportunities.",
    url: "https://linkedin.com/company/bitdesignersafrica",
    iconBg: "#0A66C2",
    iconBorder: false,
    icon: "linkedin",
  },
] as const;

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
        e.currentTarget.style.backgroundColor = "var(--color-bg-surface-2)";
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

export default function CommunityPage() {
  return (
    <div
      className="max-md:px-5 max-md:py-6"
      style={{ maxWidth: 760, margin: "0 auto", padding: "48px 32px" }}
    >
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
        COHORT 01 · DESIGN LAB
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

      {/* ── Cohort Section ── */}
      <div style={{ marginTop: 48 }}>
        <SectionLabel>YOUR COHORT</SectionLabel>
        <p
          style={{
            fontFamily: font.body,
            fontSize: 13,
            lineHeight: "19px",
            fontWeight: 400,
            color: "var(--color-text-tertiary)",
            margin: 0,
            marginTop: 6,
            marginBottom: 20,
          }}
        >
          Cohort 01 · 7 members · Design Lab & Open Source Lab
        </p>

        {/* Cohort card */}
        <div
          style={{
            backgroundColor: "var(--color-bg-surface)",
            border: "1px solid var(--color-border-subtle)",
            borderRadius: 14,
            padding: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          {/* Left column */}
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
              Bitcoin for Designers — Cohort 01
            </p>
            <p
              style={{
                fontFamily: font.mono,
                fontSize: 12,
                lineHeight: "16px",
                fontWeight: 500,
                color: "var(--color-text-tertiary)",
                margin: 0,
                marginTop: 4,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              July 2025 — September 2025
            </p>
            <p
              style={{
                fontFamily: font.body,
                fontSize: 13,
                lineHeight: "19px",
                fontWeight: 400,
                color: "var(--color-text-secondary)",
                margin: 0,
                marginTop: 4,
              }}
            >
              7 designers · Nigeria & Ghana
            </p>
          </div>

          {/* Right button */}
          <button
            onClick={() => window.open("https://discord.gg/placeholder", "_blank")}
            className="inline-flex items-center justify-center"
            style={{
              height: 36,
              padding: "0 14px",
              borderRadius: 10,
              backgroundColor: "transparent",
              color: "var(--color-text-primary)",
              border: "1px solid var(--color-border-strong)",
              fontFamily: font.body,
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              transitionProperty: "background-color, border-color",
              transitionDuration: "var(--duration-fast)",
              transitionTimingFunction: "var(--ease-out-quart)",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.22)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.borderColor = "var(--color-border-strong)";
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.08)";
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)";
            }}
          >
            Meet on Discord
          </button>
        </div>
      </div>

      {/* ── Footer note ── */}
      <p
        style={{
          fontFamily: font.body,
          fontSize: 13,
          lineHeight: "19px",
          fontWeight: 400,
          color: "var(--color-text-tertiary)",
          margin: 0,
          marginTop: 48,
          textAlign: "center",
        }}
      >
        More community features coming after Cohort 01.
      </p>
    </div>
  );
}

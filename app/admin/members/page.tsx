"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { mockMembers } from "@/lib/mock-community-data";

const font = {
  display: "var(--font-display), 'Space Grotesk', 'Inter', system-ui, sans-serif",
  body: "var(--font-body), 'Inter', system-ui, -apple-system, sans-serif",
  mono: "var(--font-mono), 'JetBrains Mono', 'SF Mono', monospace",
};

function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 13, height: 13 }}>
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

export default function MembersPage() {
  const [search, setSearch] = useState("");

  const filtered = mockMembers.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.role.toLowerCase().includes(search.toLowerCase()) ||
    m.track.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <h1 style={{ fontFamily: font.display, fontSize: 36, lineHeight: "42px", fontWeight: 600, letterSpacing: "-0.02em", color: "var(--color-text-primary)", margin: 0 }}>
        Members
      </h1>
      <p style={{ fontFamily: font.body, fontSize: 14, lineHeight: "22px", fontWeight: 400, color: "var(--color-text-secondary)", margin: 0, marginTop: 6, marginBottom: 32 }}>
        Cohort 01 · {mockMembers.length} members
      </p>

      {/* Search */}
      <input
        type="text"
        placeholder="Search members..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: "100%", height: 40, padding: "0 14px", borderRadius: 10,
          backgroundColor: "var(--color-bg-surface-2)", border: "1px solid var(--color-border-strong)",
          color: "var(--color-text-primary)", fontFamily: font.body, fontSize: "14.5px", lineHeight: "22px", fontWeight: 400,
          outline: "none", boxSizing: "border-box", marginBottom: 20,
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.70)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.15)"; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = "var(--color-border-strong)"; e.currentTarget.style.boxShadow = "none"; }}
      />

      {/* Table */}
      <div style={{ border: "1px solid var(--color-border-subtle)", borderRadius: 14, overflow: "hidden" }}>
        {/* Header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1.5fr 1.5fr 1fr 1fr",
            padding: "10px 20px",
            backgroundColor: "var(--color-bg-surface-2)",
            borderBottom: "1px solid var(--color-border-subtle)",
            gap: 12,
          }}
          className="max-md:hidden"
        >
          {["NAME", "ROLE", "TRACK", "STATUS", "LINKS"].map((h) => (
            <span
              key={h}
              style={{
                fontFamily: font.mono, fontSize: 10, fontWeight: 600, letterSpacing: "0.10em",
                textTransform: "uppercase", color: "var(--color-text-tertiary)",
                textAlign: h === "LINKS" ? "right" : "left",
              }}
            >
              {h}
            </span>
          ))}
        </div>

        {/* Rows */}
        {filtered.map((member, i) => (
          <div
            key={member.id}
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1.5fr 1.5fr 1fr 1fr",
              padding: "14px 20px",
              borderBottom: i < filtered.length - 1 ? "1px solid var(--color-border-subtle)" : "none",
              alignItems: "center",
              gap: 12,
              transitionProperty: "background-color",
              transitionDuration: "var(--duration-fast)",
              transitionTimingFunction: "var(--ease-out-quart)",
            }}
            className="max-md:!grid-cols-1"
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1C1C1C")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            {/* Name */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
              <div
                style={{
                  width: 32, height: 32, borderRadius: 999, flexShrink: 0,
                  backgroundColor: "var(--color-bg-surface-3)",
                  border: "1px solid var(--color-border-subtle)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: font.mono, fontSize: 10, fontWeight: 500,
                  color: "var(--color-text-tertiary)", textTransform: "uppercase",
                }}
              >
                {member.initials}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontFamily: font.body, fontSize: 14, fontWeight: 500, color: "var(--color-text-primary)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {member.name}
                </p>
                <p style={{ fontFamily: font.mono, fontSize: 11, fontWeight: 400, color: "var(--color-text-tertiary)", margin: 0, marginTop: 1 }}>
                  {member.location}
                </p>
              </div>
            </div>

            {/* Role */}
            <span style={{ fontFamily: font.body, fontSize: 13, fontWeight: 400, color: "var(--color-text-secondary)" }}>
              {member.role}
            </span>

            {/* Track */}
            <span style={{ fontFamily: font.mono, fontSize: 11, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-text-tertiary)" }}>
              {member.track === "Design Lab" ? "DESIGN LAB" : "OPEN SOURCE LAB"}
            </span>

            {/* Status */}
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {member.status === "mentor" ? (
                <span style={{ fontFamily: font.body, fontSize: 12, fontWeight: 500, color: "var(--color-indigo-text)" }}>Mentor</span>
              ) : (
                <>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "var(--color-success-text)", flexShrink: 0 }} />
                  <span style={{ fontFamily: font.body, fontSize: 12, fontWeight: 400, color: "var(--color-text-secondary)" }}>Active</span>
                </>
              )}
            </div>

            {/* Links */}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              {member.portfolioUrl && (
                <a
                  href={member.portfolioUrl} target="_blank" rel="noopener noreferrer"
                  style={{ color: "var(--color-text-tertiary)", transitionProperty: "color", transitionDuration: "var(--duration-fast)", transitionTimingFunction: "var(--ease-out-quart)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-text-primary)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-tertiary)")}
                >
                  <ExternalLink style={{ width: 13, height: 13 }} />
                </a>
              )}
              {member.githubUrl && (
                <a
                  href={member.githubUrl} target="_blank" rel="noopener noreferrer"
                  style={{ color: "var(--color-text-tertiary)", transitionProperty: "color", transitionDuration: "var(--duration-fast)", transitionTimingFunction: "var(--ease-out-quart)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-text-primary)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-tertiary)")}
                >
                  <GithubIcon />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

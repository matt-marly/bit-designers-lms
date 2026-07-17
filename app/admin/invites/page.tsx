"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle, Copy } from "lucide-react";
import { SectionLabel } from "@/components/ui/custom/section-label";
import { PrimaryButton } from "@/components/ui/custom/buttons";
import { mockInvites } from "@/lib/mock-admin-data";

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

function TogglePill({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "8px 16px",
        borderRadius: 10,
        border: `1px solid ${selected ? "var(--color-indigo-border)" : "var(--color-border-strong)"}`,
        backgroundColor: selected ? "var(--color-indigo-subtle)" : "var(--color-bg-surface-2)",
        color: selected ? "var(--color-indigo-text)" : "var(--color-text-tertiary)",
        fontFamily: font.body,
        fontSize: 13,
        fontWeight: 500,
        cursor: "pointer",
        transitionProperty: "background-color, border-color, color",
        transitionDuration: "var(--duration-fast)",
        transitionTimingFunction: "var(--ease-out-quart)",
      }}
    >
      {label}
    </button>
  );
}

export default function InvitesPage() {
  const [selectedTrack, setSelectedTrack] = useState("Design Lab");
  const [selectedLimit, setSelectedLimit] = useState(10);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [inviteList, setInviteList] = useState(mockInvites);

  function handleGenerate() {
    const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const prefix = selectedTrack === "Design Lab" ? "DL" : "OSL";
    setGeneratedCode(`BDA-${prefix}-2025-${suffix}`);
  }

  function handleCopy(code: string, id: string) {
    const url = `https://app.bitdesigners.africa/join/${code}`;
    navigator.clipboard.writeText(url).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function handleDeactivate(inviteId: string) {
    setInviteList((prev) =>
      prev.map((inv) => (inv.id === inviteId ? { ...inv, status: "inactive" as const } : inv))
    );
  }

  return (
    <div>
      <h1 style={{ fontFamily: font.display, fontSize: 36, lineHeight: "42px", fontWeight: 600, letterSpacing: "-0.02em", color: "var(--color-text-primary)", margin: 0 }}>
        Invite Links
      </h1>
      <p style={{ fontFamily: font.body, fontSize: 14, lineHeight: "22px", fontWeight: 400, color: "var(--color-text-secondary)", margin: 0, marginTop: 6, marginBottom: 32 }}>
        Generate invite links for learners to join a cohort.
      </p>

      {/* 3-step workflow */}
      <div style={{ display: "flex", gap: 0, alignItems: "center", marginBottom: 32 }}>
        {[
          { num: "01", title: "Generate Link", desc: "Choose track, cohort, and usage limit" },
          { num: "02", title: "Share with Applicant", desc: "Copy and send the invite URL directly" },
          { num: "03", title: "Learner Signs Up", desc: "They join with track and cohort pre-assigned" },
        ].map((step, i) => (
          <div key={step.num} style={{ display: "contents" }}>
            <div style={{ flex: 1, textAlign: "center", padding: "0 16px" }}>
              <p style={{ fontFamily: font.mono, fontSize: 11, fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--color-text-tertiary)", margin: 0, marginBottom: 6 }}>{step.num}</p>
              <p style={{ fontFamily: font.body, fontSize: 14, fontWeight: 500, color: "var(--color-text-primary)", margin: 0 }}>{step.title}</p>
              <p style={{ fontFamily: font.body, fontSize: 12, fontWeight: 400, color: "var(--color-text-secondary)", margin: 0, marginTop: 3 }}>{step.desc}</p>
            </div>
            {i < 2 && <ArrowRight style={{ width: 16, height: 16, color: "var(--color-text-tertiary)", flexShrink: 0 }} />}
          </div>
        ))}
      </div>
      <div style={{ height: 1, backgroundColor: "var(--color-border-subtle)", marginBottom: 32 }} />

      {/* Generate card */}
      <div style={{ ...cardStyle, padding: 24, marginBottom: 32 }}>
        <SectionLabel>GENERATE NEW INVITE</SectionLabel>

        <div style={{ marginTop: 20 }}>
          <label style={{ fontFamily: font.body, fontSize: 14, fontWeight: 500, color: "var(--color-text-primary)", display: "block", marginBottom: 8 }}>Track</label>
          <div style={{ display: "flex", gap: 8 }}>
            <TogglePill label="Design Lab" selected={selectedTrack === "Design Lab"} onClick={() => setSelectedTrack("Design Lab")} />
            <TogglePill label="Open Source Lab" selected={selectedTrack === "Open Source Lab"} onClick={() => setSelectedTrack("Open Source Lab")} />
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <label style={{ fontFamily: font.body, fontSize: 14, fontWeight: 500, color: "var(--color-text-primary)", display: "block", marginBottom: 8 }}>Cohort</label>
          <TogglePill label="Cohort 01" selected onClick={() => {}} />
        </div>

        <div style={{ marginTop: 20 }}>
          <label style={{ fontFamily: font.body, fontSize: 14, fontWeight: 500, color: "var(--color-text-primary)", display: "block", marginBottom: 8 }}>Usage limit</label>
          <div style={{ display: "flex", gap: 8 }}>
            {[5, 10, 20].map((n) => (
              <TogglePill key={n} label={String(n)} selected={selectedLimit === n} onClick={() => setSelectedLimit(n)} />
            ))}
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <PrimaryButton fullWidth onClick={handleGenerate}>Generate Invite Link</PrimaryButton>
        </div>

        {generatedCode && (
          <div style={{ marginTop: 12, backgroundColor: "var(--color-bg-surface-2)", border: "1px solid var(--color-border-subtle)", borderRadius: 14, padding: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div>
              <SectionLabel>INVITE CODE</SectionLabel>
              <p style={{ fontFamily: font.mono, fontSize: 16, lineHeight: "22px", fontWeight: 600, color: "var(--color-text-primary)", margin: 0, marginTop: 6 }}>
                {generatedCode}
              </p>
            </div>
            <button
              onClick={() => handleCopy(generatedCode, "generated")}
              className="inline-flex items-center justify-center"
              style={{
                height: 32, padding: "0 12px", borderRadius: 10,
                backgroundColor: copiedId === "generated" ? "transparent" : "var(--color-indigo)",
                color: copiedId === "generated" ? "var(--color-success-text)" : "var(--color-text-on-accent)",
                border: copiedId === "generated" ? "1px solid var(--color-success-border)" : "none",
                fontFamily: font.body, fontSize: "14.5px", fontWeight: 500, gap: 6, cursor: "pointer", whiteSpace: "nowrap",
              }}
            >
              {copiedId === "generated" ? (<><CheckCircle style={{ width: 14, height: 14 }} />Copied!</>) : (<><Copy style={{ width: 14, height: 14 }} />Copy Link</>)}
            </button>
          </div>
        )}
      </div>

      {/* Existing invites */}
      <SectionLabel>ACTIVE INVITES</SectionLabel>
      <div style={{ marginTop: 16, border: "1px solid var(--color-border-subtle)", borderRadius: 14, overflow: "hidden" }}>
        {inviteList.map((invite, i) => (
          <div
            key={invite.id}
            style={{
              padding: "16px 20px",
              borderBottom: i < inviteList.length - 1 ? "1px solid var(--color-border-subtle)" : "none",
              opacity: invite.status === "inactive" ? 0.5 : 1,
              transitionProperty: "background-color",
              transitionDuration: "var(--duration-fast)",
              transitionTimingFunction: "var(--ease-out-quart)",
              display: "flex",
              alignItems: "center",
              gap: 20,
              flexWrap: "wrap",
            }}
            onMouseEnter={(e) => { if (invite.status !== "inactive") e.currentTarget.style.backgroundColor = "#1C1C1C"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
          >
            {/* Left: code + meta */}
            <div style={{ flex: "1 1 200px", minWidth: 0 }}>
              <p style={{ fontFamily: font.mono, fontSize: 14, lineHeight: "20px", fontWeight: 600, color: "var(--color-text-primary)", margin: 0 }}>
                {invite.code}
              </p>
              <p style={{ fontFamily: font.mono, fontSize: 10, fontWeight: 400, color: "var(--color-text-tertiary)", margin: 0, marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 320 }}>
                https://app.bitdesigners.africa/join/{invite.code}
              </p>
              <div style={{ display: "flex", gap: 12, marginTop: 6, flexWrap: "wrap", alignItems: "center" }}>
                {[invite.track.toUpperCase(), invite.cohortName, `Expires ${new Date(invite.expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`].map((tag) => (
                  <span key={tag} style={{ fontFamily: font.mono, fontSize: 10, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-text-tertiary)", backgroundColor: "var(--color-bg-surface-3)", border: "1px solid var(--color-border-subtle)", borderRadius: 999, padding: "3px 8px" }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Center: usage count (text only) */}
            <div style={{ display: "flex", alignItems: "baseline", gap: 4, flexShrink: 0 }}>
              <span style={{ fontFamily: font.display, fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)" }}>
                {invite.usageCount} / {invite.usageLimit}
              </span>
              <span style={{ fontFamily: font.body, fontSize: 12, fontWeight: 400, color: "var(--color-text-tertiary)" }}>
                used
              </span>
            </div>

            {/* Right: actions */}
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <button
                onClick={() => handleCopy(invite.code, invite.id)}
                className="inline-flex items-center justify-center"
                style={{
                  height: 28, padding: "0 10px", borderRadius: 10, backgroundColor: "transparent",
                  color: copiedId === invite.id ? "var(--color-success-text)" : "var(--color-text-primary)",
                  border: `1px solid ${copiedId === invite.id ? "var(--color-success-border)" : "var(--color-border-strong)"}`,
                  fontFamily: font.body, fontSize: 13, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap",
                  transitionProperty: "background-color, border-color, color", transitionDuration: "var(--duration-fast)", transitionTimingFunction: "var(--ease-out-quart)",
                }}
                onMouseEnter={(e) => { if (copiedId !== invite.id) e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
              >
                {copiedId === invite.id ? "Copied!" : "Copy"}
              </button>
              {invite.status === "active" && (
                <button
                  onClick={() => handleDeactivate(invite.id)}
                  className="inline-flex items-center justify-center"
                  style={{
                    height: 28, padding: "0 10px", borderRadius: 10, backgroundColor: "transparent",
                    color: "var(--color-text-primary)", border: "1px solid var(--color-border-strong)",
                    fontFamily: font.body, fontSize: 13, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap",
                    transitionProperty: "background-color, border-color, color", transitionDuration: "var(--duration-fast)", transitionTimingFunction: "var(--ease-out-quart)",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--color-danger-border)"; e.currentTarget.style.color = "var(--color-danger-text)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-border-strong)"; e.currentTarget.style.color = "var(--color-text-primary)"; }}
                >
                  Deactivate
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

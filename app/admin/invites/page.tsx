"use client";

import { useState, useEffect, useCallback } from "react";
import { CheckCircle, Copy } from "lucide-react";
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

const fieldLabelStyle: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.10em",
  textTransform: "uppercase",
  color: "#B5B5B5",
  display: "block",
  marginBottom: 8,
};

type ToastData = {
  message: string;
  type: "success" | "error";
};

const toastDotColor: Record<ToastData["type"], string> = {
  success: "#22C55E",
  error: "#EF4444",
};

export default function InvitesPage() {
  const [selectedTrack, setSelectedTrack] = useState("Design Lab");
  const [selectedCohort, setSelectedCohort] = useState("cohort-01");
  const [selectedLimit, setSelectedLimit] = useState(10);
  const [limitError, setLimitError] = useState<string | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [inviteList, setInviteList] = useState(mockInvites);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastData | null>(null);

  const showToast = useCallback((message: string, type: ToastData["type"] = "success") => {
    setToast({ message, type });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), toast.type === "error" ? 5000 : 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  function validateLimit(value: number): string | null {
    if (value < 1) return "Usage limit must be at least 1";
    if (value > 100) return "Usage limit cannot exceed 100";
    return null;
  }

  function handleLimitChange(value: number) {
    setSelectedLimit(value);
    setLimitError(validateLimit(value));
  }

  function handleGenerate() {
    const error = validateLimit(selectedLimit);
    if (error) {
      setLimitError(error);
      return;
    }
    const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const prefix = selectedTrack === "Design Lab" ? "DL" : "OSL";
    const code = `BDA-${prefix}-2025-${suffix}`;
    setGeneratedCode(code);

    const cohortNames: Record<string, string> = {
      "cohort-01": "Cohort 01",
      "cohort-02": "Cohort 02",
      "cohort-03": "Cohort 03",
    };

    const newInvite = {
      id: `inv-${Date.now()}`,
      code,
      track: selectedTrack,
      cohortId: selectedCohort,
      cohortName: cohortNames[selectedCohort] || selectedCohort,
      createdAt: new Date().toISOString().split("T")[0],
      expiresAt: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
      usageCount: 0,
      usageLimit: selectedLimit,
      status: "active" as "active" | "inactive",
      createdBy: "Adeyemi Matthew",
    };

    setInviteList((prev) => [newInvite, ...prev]);
    showToast("Invite link created");
  }

  function handleCopy(code: string, id: string) {
    const url = `https://app.bitdesigners.africa/join/${code}`;
    navigator.clipboard.writeText(url).then(
      () => {
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
        showToast("Copied to clipboard");
      },
      () => {
        showToast("Could not copy — copy the link manually", "error");
      }
    );
  }

  function handleDeactivate(inviteId: string) {
    setInviteList((prev) => prev.filter((inv) => inv.id !== inviteId));
    setConfirmingId(null);
    showToast("Invite deactivated");
  }

  const activeInvites = inviteList.filter((inv) => inv.status === "active");

  return (
    <div>
      <style>{`
        input[type=number]::-webkit-outer-spin-button,
        input[type=number]::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type=number] { -moz-appearance: textfield; }
        @keyframes toast-enter {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <h1 style={{ fontFamily: font.display, fontSize: 36, lineHeight: "42px", fontWeight: 600, letterSpacing: "-0.02em", color: "var(--color-text-primary)", margin: 0, marginBottom: 32 }}>
        Invite Links
      </h1>

      {/* Generate card */}
      <div style={{ ...cardStyle, padding: 24, marginBottom: 32 }}>
        <SectionLabel>GENERATE NEW INVITE</SectionLabel>

        <div style={{ marginTop: 20 }}>
          <label style={fieldLabelStyle}>Track</label>
          <div style={{ display: "flex", gap: 0, border: "1px solid #333333", borderRadius: 8, overflow: "hidden", width: "fit-content" }}>
            {(["Design Lab", "Open Source Lab"] as const).map((track, i) => (
              <button
                key={track}
                onClick={() => setSelectedTrack(track)}
                style={{
                  height: 36,
                  padding: "0 20px",
                  border: "none",
                  borderRight: i === 0 ? "1px solid #333333" : "none",
                  borderRadius: 0,
                  fontFamily: font.body,
                  fontSize: 14,
                  fontWeight: selectedTrack === track ? 500 : 400,
                  color: selectedTrack === track ? "#A5B4FC" : "#737373",
                  backgroundColor: selectedTrack === track ? "rgba(99,102,241,0.12)" : "transparent",
                  cursor: "pointer",
                  transition: "background-color 120ms ease",
                }}
              >
                {track}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <label style={fieldLabelStyle}>Cohort</label>
          <div style={{ position: "relative" }}>
            <select
              value={selectedCohort}
              onChange={(e) => setSelectedCohort(e.target.value)}
              style={{
                height: 40,
                width: "100%",
                backgroundColor: "#181818",
                border: "1px solid #333333",
                borderRadius: 10,
                padding: "0 14px",
                paddingRight: 40,
                fontFamily: font.body,
                fontSize: 14,
                color: "#FFFFFF",
                cursor: "pointer",
                outline: "none",
                appearance: "none",
                WebkitAppearance: "none",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.70)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.15)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "#333333"; e.currentTarget.style.boxShadow = "none"; }}
            >
              <option value="cohort-01">Cohort 01</option>
              <option value="cohort-02">Cohort 02</option>
              <option value="cohort-03">Cohort 03</option>
            </select>
            <svg
              style={{
                position: "absolute",
                right: 14,
                top: "50%",
                transform: "translateY(-50%)",
                width: 16,
                height: 16,
                color: "#737373",
                pointerEvents: "none",
              }}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <label style={fieldLabelStyle}>Usage limit</label>
          <input
            type="number"
            min={1}
            max={100}
            value={selectedLimit}
            onChange={(e) => handleLimitChange(Number(e.target.value))}
            style={{
              height: 40,
              width: "100%",
              backgroundColor: "#181818",
              border: `1px solid ${limitError ? "rgba(239,68,68,0.55)" : "#333333"}`,
              borderRadius: 10,
              padding: "0 14px",
              fontFamily: font.body,
              fontSize: 14,
              color: "#FFFFFF",
              outline: "none",
              appearance: "none",
              WebkitAppearance: "none",
              MozAppearance: "textfield" as React.CSSProperties["MozAppearance"],
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = limitError ? "rgba(239,68,68,0.55)" : "rgba(99,102,241,0.70)";
              e.currentTarget.style.boxShadow = limitError ? "0 0 0 3px rgba(239,68,68,0.15)" : "0 0 0 3px rgba(99,102,241,0.15)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = limitError ? "rgba(239,68,68,0.55)" : "#333333";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
          {limitError ? (
            <p style={{ fontFamily: font.body, fontSize: 12, color: "#F87171", margin: 0, marginTop: 6 }}>
              {limitError}
            </p>
          ) : (
            <p style={{ fontFamily: font.body, fontSize: 12, color: "#737373", margin: 0, marginTop: 6 }}>
              Number of learners who can use this link
            </p>
          )}
        </div>

        <div style={{ marginTop: 20 }}>
          <PrimaryButton fullWidth onClick={handleGenerate}>Generate Invite Link</PrimaryButton>
        </div>

        {generatedCode && (
          <div style={{ marginTop: 12, backgroundColor: "#181818", border: "1px solid #242424", borderRadius: 10, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
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
                backgroundColor: "transparent",
                color: copiedId === "generated" ? "var(--color-success-text)" : "#FFFFFF",
                border: copiedId === "generated" ? "1px solid var(--color-success-border)" : "1px solid #333333",
                fontFamily: font.body, fontSize: 13, fontWeight: 500, gap: 6, cursor: "pointer", whiteSpace: "nowrap",
              }}
            >
              {copiedId === "generated" ? (<><CheckCircle style={{ width: 14, height: 14 }} />Copied!</>) : (<><Copy style={{ width: 14, height: 14 }} />Copy Link</>)}
            </button>
          </div>
        )}
      </div>

      {/* Existing invites */}
      <SectionLabel>ACTIVE INVITES</SectionLabel>
      <div style={{ marginTop: 16, border: "1px solid #242424", borderRadius: 12, overflow: "hidden" }}>
        {activeInvites.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center" }}>
            <p style={{ fontFamily: font.body, fontSize: 14, color: "#737373", margin: 0 }}>
              No active invite links.
            </p>
          </div>
        ) : (
          activeInvites.map((invite, i) => (
            <div
              key={invite.id}
              style={{
                padding: "16px 20px",
                borderBottom: i < activeInvites.length - 1 ? "1px solid #242424" : "none",
                transitionProperty: "background-color",
                transitionDuration: "var(--duration-fast)",
                transitionTimingFunction: "var(--ease-out-quart)",
                display: "flex",
                alignItems: "center",
                gap: 20,
                flexWrap: "wrap",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#1C1C1C"; }}
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

              {/* Center: usage count */}
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, flexShrink: 0 }}>
                <span style={{ fontFamily: font.display, fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)" }}>
                  {invite.usageCount} / {invite.usageLimit}
                </span>
                <span style={{ fontFamily: font.body, fontSize: 12, fontWeight: 400, color: "var(--color-text-tertiary)" }}>
                  used
                </span>
              </div>

              {/* Right: actions */}
              <div style={{ display: "flex", gap: 8, flexShrink: 0, alignItems: "center" }}>
                {confirmingId === invite.id ? (
                  <>
                    <span style={{ fontFamily: font.body, fontSize: 13, color: "#737373" }}>
                      Deactivate this invite?
                    </span>
                    <button
                      onClick={() => handleDeactivate(invite.id)}
                      className="inline-flex items-center justify-center"
                      style={{
                        height: 28, padding: "0 12px", borderRadius: 10, backgroundColor: "transparent",
                        color: "#F87171", border: "1px solid rgba(239,68,68,0.35)",
                        fontFamily: font.body, fontSize: 13, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap",
                      }}
                    >
                      Yes, deactivate
                    </button>
                    <button
                      onClick={() => setConfirmingId(null)}
                      className="inline-flex items-center justify-center"
                      style={{
                        height: 28, padding: "0 12px", borderRadius: 0, backgroundColor: "transparent",
                        color: "var(--color-text-secondary)", border: "none",
                        fontFamily: font.body, fontSize: 13, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap",
                      }}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
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
                    <button
                      onClick={() => setConfirmingId(invite.id)}
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
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div
          role={toast.type === "error" ? "alert" : "status"}
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
            animation: "toast-enter 240ms cubic-bezier(0.25, 1, 0.5, 1)",
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
          <span style={{ fontFamily: font.body, fontSize: 14, color: "#FFFFFF" }}>
            {toast.message}
          </span>
        </div>
      )}
    </div>
  );
}

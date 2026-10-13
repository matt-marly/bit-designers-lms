"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, X } from "lucide-react";
import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import type { FunctionReturnType } from "convex/server";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  CO_MENTOR_DEFAULT_PERMISSIONS,
  PLATFORM_ROLE_PRESETS,
  TRACK_PERMISSION_INFO,
  TRACK_ROLE_INFO,
  type PlatformPermission,
  type PlatformRole,
  type TrackPermission,
  type TrackRole,
} from "@/convex/lib/permissions";
import { SectionLabel } from "@/components/ui/custom/section-label";
import { PrimaryButton } from "@/components/ui/custom/buttons";
import { hasPlatformPermission } from "@/lib/access";
import { PermissionCheckbox, PlatformAccessEditor } from "@/components/admin/platform-access-editor";

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

const controlStyle: React.CSSProperties = {
  height: 40,
  width: "100%",
  backgroundColor: "#181818",
  border: "1px solid #333333",
  borderRadius: 10,
  padding: "0 14px",
  fontFamily: font.body,
  fontSize: 14,
  color: "#FFFFFF",
  outline: "none",
  boxSizing: "border-box",
};

const smallButtonStyle: React.CSSProperties = {
  height: 28,
  padding: "0 10px",
  borderRadius: 10,
  backgroundColor: "transparent",
  color: "var(--color-text-primary)",
  border: "1px solid var(--color-border-strong)",
  fontFamily: font.body,
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const focusHandlers = {
  onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = "rgba(99,102,241,0.70)";
    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.15)";
  },
  onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = "#333333";
    e.currentTarget.style.boxShadow = "none";
  },
};

type ToastData = {
  message: string;
  type: "success" | "error";
};

const toastDotColor: Record<ToastData["type"], string> = {
  success: "#22C55E",
  error: "#EF4444",
};

type InvitableTrack = FunctionReturnType<typeof api.tracks.listForInviting>[number];
type InvitationItem = FunctionReturnType<typeof api.invitations.listForManager>["page"][number];

type TrackGrantDraft = {
  trackId: Id<"tracks">;
  role: TrackRole;
  cohortId?: Id<"cohorts">;
  permissions: TrackPermission[];
};

const statusStyle: Record<InvitationItem["status"], { label: string; color: string; background: string }> = {
  pending: { label: "Sending", color: "#FBBF24", background: "rgba(251,191,36,0.10)" },
  sending: { label: "Sending", color: "#FBBF24", background: "rgba(251,191,36,0.10)" },
  sent: { label: "Sent", color: "#A5B4FC", background: "rgba(99,102,241,0.12)" },
  accepted: { label: "Accepted", color: "#4ADE80", background: "rgba(34,197,94,0.10)" },
  revoked: { label: "Revoked", color: "#737373", background: "rgba(255,255,255,0.04)" },
  failed: { label: "Failed", color: "#F87171", background: "rgba(239,68,68,0.10)" },
};

function errorMessage(err: unknown) {
  return err instanceof ConvexError ? String(err.data) : "Something went wrong. Please try again.";
}

function allowedRoles(track: InvitableTrack): TrackRole[] {
  const roles: TrackRole[] = [];
  if (track.canInviteStudents) roles.push("student");
  if (track.canAddCoMentor) roles.push("co_mentor");
  if (track.canAssignLead) roles.push("lead_mentor");
  return roles;
}

function defaultGrant(track: InvitableTrack, role: TrackRole): TrackGrantDraft {
  return {
    trackId: track._id,
    role,
    cohortId: role === "student" ? track.cohorts[0]?._id : undefined,
    permissions:
      role === "co_mentor"
        ? CO_MENTOR_DEFAULT_PERMISSIONS.filter((p) => track.grantablePermissions.includes(p))
        : [],
  };
}

export default function InvitesPage() {
  const me = useQuery(api.users.me);
  const tracks = useQuery(api.tracks.listForInviting);
  const createInvitation = useMutation(api.invitations.create);

  const [email, setEmail] = useState("");
  const [platformRole, setPlatformRole] = useState<PlatformRole>("member");
  const [permissions, setPermissions] = useState<PlatformPermission[]>([]);
  const [trackGrants, setTrackGrants] = useState<TrackGrantDraft[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);

  const showToast = useCallback((message: string, type: ToastData["type"] = "success") => {
    setToast({ message, type });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), toast.type === "error" ? 5000 : 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  if (!me || tracks === undefined) {
    return null;
  }

  const canGrantPlatform = hasPlatformPermission(me, "invites.manage");
  const unusedTracks = tracks.filter(
    (track) => allowedRoles(track).length > 0 && !trackGrants.some((g) => g.trackId === track._id),
  );

  function addTrack(trackId: string) {
    const track = tracks?.find((t) => t._id === trackId);
    if (!track) return;
    setTrackGrants((prev) => [...prev, defaultGrant(track, allowedRoles(track)[0])]);
  }

  function updateGrant(trackId: Id<"tracks">, update: (grant: TrackGrantDraft) => TrackGrantDraft) {
    setTrackGrants((prev) => prev.map((g) => (g.trackId === trackId ? update(g) : g)));
  }

  function removeGrant(trackId: Id<"tracks">) {
    setTrackGrants((prev) => prev.filter((g) => g.trackId !== trackId));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const missingCohort = trackGrants.find((g) => g.role === "student" && !g.cohortId);
    if (missingCohort) {
      const trackName = tracks?.find((t) => t._id === missingCohort.trackId)?.name ?? "a track";
      showToast(`Pick a cohort for ${trackName}`, "error");
      return;
    }

    setSubmitting(true);
    try {
      const result = await createInvitation({
        email,
        platformRole: canGrantPlatform ? platformRole : "member",
        permissions: canGrantPlatform ? permissions : [],
        trackGrants: trackGrants.map((g) => ({
          trackId: g.trackId,
          role: g.role,
          cohortId: g.role === "student" ? g.cohortId : undefined,
          permissions: g.role === "co_mentor" ? g.permissions : [],
        })),
      });
      showToast(
        result === "sent"
          ? `Invitation sent to ${email.trim()}`
          : `${email.trim()} already has an account, so their access was updated`,
      );
      setEmail("");
      setPlatformRole("member");
      setPermissions([]);
      setTrackGrants([]);
    } catch (err) {
      showToast(errorMessage(err), "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <style>{`
        @keyframes toast-enter {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <h1 style={{ fontFamily: font.display, fontSize: 36, lineHeight: "42px", fontWeight: 600, letterSpacing: "-0.02em", color: "var(--color-text-primary)", margin: 0, marginBottom: 32 }}>
        Invitations
      </h1>

      <form onSubmit={handleSubmit} style={{ ...cardStyle, padding: 24, marginBottom: 32 }}>
        <SectionLabel>INVITE SOMEONE</SectionLabel>

        <div style={{ marginTop: 20 }}>
          <label style={fieldLabelStyle}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            required
            style={controlStyle}
            {...focusHandlers}
          />
        </div>

        {canGrantPlatform && (
          <div style={{ marginTop: 24 }}>
            <label style={fieldLabelStyle}>Platform role</label>
            <PlatformAccessEditor
              me={me}
              platformRole={platformRole}
              permissions={permissions}
              onChange={(role, perms) => {
                setPlatformRole(role);
                setPermissions(perms);
              }}
            />
          </div>
        )}

        <div style={{ marginTop: 24 }}>
          <label style={fieldLabelStyle}>Track access</label>
          {trackGrants.length === 0 && (
            <p style={{ fontFamily: font.body, fontSize: 13, color: "#737373", margin: 0, marginBottom: 12 }}>
              {tracks.length === 0
                ? "There are no tracks you can invite people into."
                : "Add a track to make this person a student or mentor there."}
            </p>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {trackGrants.map((grant) => {
              const track = tracks.find((t) => t._id === grant.trackId);
              if (!track) return null;
              return (
                <TrackGrantRow
                  key={grant.trackId}
                  track={track}
                  grant={grant}
                  onChangeRole={(role) => updateGrant(track._id, () => defaultGrant(track, role))}
                  onChangeCohort={(cohortId) => updateGrant(track._id, (g) => ({ ...g, cohortId }))}
                  onTogglePermission={(permission) =>
                    updateGrant(track._id, (g) => ({
                      ...g,
                      permissions: g.permissions.includes(permission)
                        ? g.permissions.filter((p) => p !== permission)
                        : [...g.permissions, permission],
                    }))
                  }
                  onRemove={() => removeGrant(track._id)}
                />
              );
            })}
          </div>

          {unusedTracks.length > 0 && (
            <div style={{ position: "relative", marginTop: 12, maxWidth: 280 }}>
              <Plus style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "#737373", pointerEvents: "none" }} />
              <select
                value=""
                onChange={(e) => addTrack(e.target.value)}
                style={{ ...controlStyle, paddingLeft: 32, cursor: "pointer", appearance: "none", WebkitAppearance: "none" }}
                {...focusHandlers}
              >
                <option value="" disabled>
                  Add a track
                </option>
                {unusedTracks.map((track) => (
                  <option key={track._id} value={track._id}>
                    {track.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div style={{ marginTop: 24 }}>
          {/* PrimaryButton renders a type-less <button>, so it submits the form. */}
          <PrimaryButton fullWidth disabled={submitting || !email.trim()}>
            {submitting ? "Sending..." : "Send invitation"}
          </PrimaryButton>
        </div>
      </form>

      <InvitationList onToast={showToast} />

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
          <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: toastDotColor[toast.type], flexShrink: 0 }} />
          <span style={{ fontFamily: font.body, fontSize: 14, color: "#FFFFFF" }}>{toast.message}</span>
        </div>
      )}
    </div>
  );
}

function TrackGrantRow({
  track,
  grant,
  onChangeRole,
  onChangeCohort,
  onTogglePermission,
  onRemove,
}: {
  track: InvitableTrack;
  grant: TrackGrantDraft;
  onChangeRole: (role: TrackRole) => void;
  onChangeCohort: (cohortId: Id<"cohorts">) => void;
  onTogglePermission: (permission: TrackPermission) => void;
  onRemove: () => void;
}) {
  const roles = allowedRoles(track);

  return (
    <div style={{ border: "1px solid #242424", borderRadius: 12, padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <span style={{ fontFamily: font.body, fontSize: 14, fontWeight: 600, color: "#FFFFFF" }}>{track.name}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", border: "1px solid #333333", borderRadius: 8, overflow: "hidden" }}>
            {roles.map((role, i) => {
              const selected = grant.role === role;
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => onChangeRole(role)}
                  style={{
                    height: 32,
                    padding: "0 14px",
                    border: "none",
                    borderRight: i < roles.length - 1 ? "1px solid #333333" : "none",
                    fontFamily: font.body,
                    fontSize: 13,
                    fontWeight: selected ? 500 : 400,
                    color: selected ? "#A5B4FC" : "#737373",
                    backgroundColor: selected ? "rgba(99,102,241,0.12)" : "transparent",
                    cursor: "pointer",
                  }}
                >
                  {TRACK_ROLE_INFO[role].label}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove ${track.name}`}
            style={{ ...smallButtonStyle, height: 32, width: 32, padding: 0, display: "inline-flex", alignItems: "center", justifyContent: "center" }}
          >
            <X style={{ width: 14, height: 14 }} />
          </button>
        </div>
      </div>

      <p style={{ fontFamily: font.body, fontSize: 12, color: "#737373", margin: 0, marginTop: 8 }}>
        {TRACK_ROLE_INFO[grant.role].description}
        {grant.role === "lead_mentor" && ". An existing lead becomes a co-mentor."}
      </p>

      {grant.role === "student" && (
        <div style={{ marginTop: 12 }}>
          <label style={fieldLabelStyle}>Cohort</label>
          {track.cohorts.length === 0 ? (
            <p style={{ fontFamily: font.body, fontSize: 13, color: "#F87171", margin: 0 }}>
              This track has no open cohorts yet. Create one first.
            </p>
          ) : (
            <select
              value={grant.cohortId ?? ""}
              onChange={(e) => onChangeCohort(e.target.value as Id<"cohorts">)}
              style={{ ...controlStyle, cursor: "pointer" }}
              {...focusHandlers}
            >
              {track.cohorts.map((cohort) => (
                <option key={cohort._id} value={cohort._id}>
                  {cohort.name}
                  {cohort.status === "draft" ? " (draft)" : ""}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {grant.role === "co_mentor" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 8, marginTop: 12 }}>
          {track.grantablePermissions.map((permission) => (
            <PermissionCheckbox
              key={permission}
              label={TRACK_PERMISSION_INFO[permission].label}
              description={TRACK_PERMISSION_INFO[permission].description}
              checked={grant.permissions.includes(permission)}
              onChange={() => onTogglePermission(permission)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function describeAccess(invitation: InvitationItem) {
  const parts: string[] = [];
  if (invitation.platformRole !== "member") {
    parts.push(PLATFORM_ROLE_PRESETS[invitation.platformRole].label);
  } else if (invitation.permissions.length > 0) {
    parts.push(`${invitation.permissions.length} platform permission${invitation.permissions.length === 1 ? "" : "s"}`);
  }
  invitation.trackGrants.forEach((grant, i) => {
    parts.push(`${TRACK_ROLE_INFO[grant.role].label} · ${invitation.trackNames[i] ?? "Track"}`);
  });
  return parts;
}

function InvitationList({ onToast }: { onToast: (message: string, type?: ToastData["type"]) => void }) {
  const { results, status, loadMore } = usePaginatedQuery(
    api.invitations.listForManager,
    {},
    { initialNumItems: 20 },
  );
  const revoke = useMutation(api.invitations.revoke);
  const resend = useMutation(api.invitations.resend);
  const [confirmingId, setConfirmingId] = useState<Id<"invitations"> | null>(null);
  const [busyId, setBusyId] = useState<Id<"invitations"> | null>(null);

  async function run(invitationId: Id<"invitations">, action: () => Promise<null>, success: string) {
    setBusyId(invitationId);
    try {
      await action();
      onToast(success);
    } catch (err) {
      onToast(errorMessage(err), "error");
    } finally {
      setBusyId(null);
      setConfirmingId(null);
    }
  }

  return (
    <>
      <SectionLabel>INVITATIONS</SectionLabel>
      <div style={{ marginTop: 16, border: "1px solid #242424", borderRadius: 12, overflow: "hidden" }}>
        {status === "LoadingFirstPage" ? (
          <p style={{ fontFamily: font.body, fontSize: 14, color: "#737373", margin: 0, padding: 24, textAlign: "center" }}>
            Loading...
          </p>
        ) : results.length === 0 ? (
          <p style={{ fontFamily: font.body, fontSize: 14, color: "#737373", margin: 0, padding: 24, textAlign: "center" }}>
            No invitations yet.
          </p>
        ) : (
          results.map((invitation, i) => {
            const badge = statusStyle[invitation.status];
            const canRevoke = ["pending", "sending", "sent", "failed"].includes(invitation.status);
            const canResend = invitation.status === "sent" || invitation.status === "failed";
            const busy = busyId === invitation._id;
            return (
              <div
                key={invitation._id}
                style={{
                  padding: "16px 20px",
                  borderBottom: i < results.length - 1 ? "1px solid #242424" : "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 20,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ flex: "1 1 260px", minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <span style={{ fontFamily: font.body, fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)" }}>
                      {invitation.email}
                    </span>
                    <span style={{ fontFamily: font.mono, fontSize: 10, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", color: badge.color, backgroundColor: badge.background, borderRadius: 999, padding: "3px 8px" }}>
                      {badge.label}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                    {describeAccess(invitation).map((tag) => (
                      <span key={tag} style={{ fontFamily: font.mono, fontSize: 10, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-text-tertiary)", backgroundColor: "var(--color-bg-surface-3)", border: "1px solid var(--color-border-subtle)", borderRadius: 999, padding: "3px 8px" }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                  <p style={{ fontFamily: font.body, fontSize: 12, color: "var(--color-text-tertiary)", margin: 0, marginTop: 6 }}>
                    {invitation.invitedByName ? `Invited by ${invitation.invitedByName} · ` : ""}
                    {new Date(invitation._creationTime).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                  {invitation.status === "failed" && invitation.error && (
                    <p style={{ fontFamily: font.body, fontSize: 12, color: "#F87171", margin: 0, marginTop: 6 }}>
                      {invitation.error}
                    </p>
                  )}
                </div>

                <div style={{ display: "flex", gap: 8, flexShrink: 0, alignItems: "center" }}>
                  {confirmingId === invitation._id ? (
                    <>
                      <span style={{ fontFamily: font.body, fontSize: 13, color: "#737373" }}>Revoke this invitation?</span>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => run(invitation._id, () => revoke({ invitationId: invitation._id }), "Invitation revoked")}
                        style={{ ...smallButtonStyle, color: "#F87171", border: "1px solid rgba(239,68,68,0.35)" }}
                      >
                        Yes, revoke
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmingId(null)}
                        style={{ ...smallButtonStyle, border: "none", color: "var(--color-text-secondary)" }}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      {canResend && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => run(invitation._id, () => resend({ invitationId: invitation._id }), "Invitation resent")}
                          style={smallButtonStyle}
                        >
                          Resend
                        </button>
                      )}
                      {canRevoke && (
                        <button type="button" onClick={() => setConfirmingId(invitation._id)} style={smallButtonStyle}>
                          Revoke
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
      {status === "CanLoadMore" && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
          <button type="button" onClick={() => loadMore(20)} style={smallButtonStyle}>
            Load more
          </button>
        </div>
      )}
    </>
  );
}

"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  CO_MENTOR_DEFAULT_PERMISSIONS,
  TRACK_PERMISSIONS,
  TRACK_PERMISSION_INFO,
  type TrackPermission,
} from "@/convex/lib/permissions";
import { PermissionCheckbox } from "../platform-access-editor";
import type { TrackAdmin } from "./track-detail";
import {
  Avatar,
  ConfirmStrip,
  SectionHeader,
  StatusBadge,
  cardStyle,
  controlStyle,
  errorMessage,
  fieldLabelStyle,
  focusHandlers,
  font,
  ghostButtonStyle,
  smallButtonStyle,
  type ShowToast,
} from "../ui";

type StaffMember = TrackAdmin["staff"][number];
type StaffRole = StaffMember["role"];

function sameSet<T>(a: readonly T[], b: readonly T[]) {
  return a.length === b.length && a.every((item) => b.includes(item));
}

function firstNameOf(name: string) {
  return name.split(" ")[0] || name;
}

export function StaffSection({ data, onToast }: { data: TrackAdmin; onToast: ShowToast }) {
  const { track, capabilities, staff } = data;
  const trackActive = track.status === "active";
  const canAdd = trackActive && (capabilities.canManageCoMentors || capabilities.canAssignLead);
  const hasLead = staff.some((s) => s.role === "lead_mentor");
  const [adding, setAdding] = useState(false);

  return (
    <section>
      <SectionHeader
        title="Mentors"
        meta={staff.length > 0 ? staff.length : undefined}
        action={
          canAdd && !adding ? (
            <button
              type="button"
              onClick={() => setAdding(true)}
              style={{ ...smallButtonStyle, display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <Plus style={{ width: 14, height: 14 }} />
              Add mentor
            </button>
          ) : undefined
        }
      />

      {adding && (
        <div style={{ ...cardStyle, padding: 20, marginBottom: 12 }}>
          <AddMentorForm
            data={data}
            suggestLead={!hasLead && capabilities.canAssignLead}
            onDone={(message) => {
              setAdding(false);
              if (message) onToast(message);
            }}
            onToast={onToast}
          />
        </div>
      )}

      <div style={{ border: "1px solid var(--color-border-subtle)", borderRadius: 14, overflow: "hidden" }}>
        {!hasLead && (
          <div
            style={{
              padding: "14px 20px",
              borderBottom: staff.length > 0 ? "1px solid var(--color-border-subtle)" : "none",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span aria-hidden style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#FBBF24", flexShrink: 0 }} />
            <span style={{ fontFamily: font.body, fontSize: 13, color: "var(--color-text-secondary)" }}>
              This track has no lead mentor.
              {capabilities.canAssignLead && trackActive
                ? " Add one, or promote a co-mentor."
                : " Someone who manages tracks needs to assign one."}
            </span>
          </div>
        )}
        {staff.map((member, i) => (
          <StaffRow
            key={member.userId}
            member={member}
            data={data}
            last={i === staff.length - 1}
            onToast={onToast}
          />
        ))}
      </div>
    </section>
  );
}

function StaffRow({
  member,
  data,
  last,
  onToast,
}: {
  member: StaffMember;
  data: TrackAdmin;
  last: boolean;
  onToast: ShowToast;
}) {
  const setCoMentorPermissions = useMutation(api.tracks.setCoMentorPermissions);
  const setLead = useMutation(api.tracks.setLead);
  const removeMember = useMutation(api.tracks.removeMember);

  const { track, capabilities } = data;
  const trackActive = track.status === "active";
  const isLead = member.role === "lead_mentor";
  const firstName = firstNameOf(member.fullName);

  const canEditPermissions = !isLead && capabilities.canManageCoMentors && trackActive;
  const canPromote = !isLead && capabilities.canAssignLead && trackActive;
  const canRemove = isLead ? capabilities.canAssignLead : capabilities.canManageCoMentors;

  const [panel, setPanel] = useState<"permissions" | "promote" | "remove" | null>(null);
  const [permissions, setPermissions] = useState<TrackPermission[]>(member.permissions);
  const [busy, setBusy] = useState(false);

  const dirty = !sameSet(permissions, member.permissions);

  function openPanel(next: "permissions" | "promote" | "remove") {
    if (next === "permissions") setPermissions(member.permissions);
    setPanel((prev) => (prev === next ? null : next));
  }

  async function run(action: () => Promise<null>, success: string) {
    setBusy(true);
    try {
      await action();
      onToast(success);
      setPanel(null);
    } catch (err) {
      onToast(errorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ borderBottom: last ? "none" : "1px solid var(--color-border-subtle)" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "14px 20px",
          flexWrap: "wrap",
          backgroundColor: panel ? "#141414" : "transparent",
          transitionProperty: "background-color",
          transitionDuration: "var(--duration-fast)",
          transitionTimingFunction: "var(--ease-out-quart)",
        }}
      >
        <Avatar name={member.fullName} />
        <div style={{ flex: "1 1 240px", minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontFamily: font.body, fontSize: 14, fontWeight: 500, color: "var(--color-text-primary)" }}>
              {member.fullName}
            </span>
            <StatusBadge tone={isLead ? "indigo" : "neutral"}>{isLead ? "Lead mentor" : "Co-mentor"}</StatusBadge>
            {member.isSelf && (
              <span style={{ fontFamily: font.mono, fontSize: 10, letterSpacing: "0.08em", color: "var(--color-text-tertiary)" }}>
                YOU
              </span>
            )}
            {member.userStatus === "suspended" && <StatusBadge tone="warning">Suspended</StatusBadge>}
          </div>
          <p
            style={{
              fontFamily: font.mono,
              fontSize: 11,
              color: "var(--color-text-tertiary)",
              margin: 0,
              marginTop: 2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {member.email}
          </p>
          <p style={{ fontFamily: font.body, fontSize: 12, color: "var(--color-text-secondary)", margin: 0, marginTop: 6 }}>
            {isLead
              ? "Every track permission"
              : member.permissions.length === 0
                ? "No track permissions"
                : TRACK_PERMISSIONS.filter((p) => member.permissions.includes(p))
                    .map((p) => TRACK_PERMISSION_INFO[p].label)
                    .join(" · ")}
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {canEditPermissions && (
            <button
              type="button"
              onClick={() => openPanel("permissions")}
              aria-expanded={panel === "permissions"}
              style={{
                ...smallButtonStyle,
                borderColor: panel === "permissions" ? "rgba(99,102,241,0.55)" : "var(--color-border-strong)",
                color: panel === "permissions" ? "#A5B4FC" : "var(--color-text-primary)",
              }}
            >
              Permissions
            </button>
          )}
          {canPromote && (
            <button type="button" onClick={() => openPanel("promote")} style={smallButtonStyle}>
              Make lead
            </button>
          )}
          {canRemove && (
            <button type="button" onClick={() => openPanel("remove")} style={ghostButtonStyle}>
              Remove
            </button>
          )}
        </div>
      </div>

      {panel === "permissions" && (
        <div style={{ padding: "4px 20px 20px", backgroundColor: "#141414" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 8 }}>
            {TRACK_PERMISSIONS.map((permission) => {
              const grantable = capabilities.grantablePermissions.includes(permission);
              return (
                <PermissionCheckbox
                  key={permission}
                  label={TRACK_PERMISSION_INFO[permission].label}
                  description={
                    grantable
                      ? TRACK_PERMISSION_INFO[permission].description
                      : "You don't have this permission, so you can't change it"
                  }
                  checked={permissions.includes(permission)}
                  disabled={!grantable}
                  onChange={() =>
                    setPermissions((prev) =>
                      prev.includes(permission) ? prev.filter((p) => p !== permission) : [...prev, permission],
                    )
                  }
                />
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button
              type="button"
              disabled={!dirty || busy}
              onClick={() =>
                run(
                  () => setCoMentorPermissions({ trackId: track._id, userId: member.userId, permissions }),
                  `Updated ${firstName}'s permissions`,
                )
              }
              style={{
                ...smallButtonStyle,
                height: 34,
                border: "none",
                backgroundColor: "var(--color-indigo)",
                opacity: !dirty || busy ? 0.4 : 1,
                cursor: !dirty || busy ? "not-allowed" : "pointer",
              }}
            >
              {busy ? "Saving…" : "Save permissions"}
            </button>
            <button type="button" onClick={() => setPanel(null)} style={ghostButtonStyle}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {panel === "promote" && (
        <ConfirmStrip
          message={`Make ${firstName} the lead mentor of ${track.name}? The current lead, if any, becomes a co-mentor and keeps every permission.`}
          confirmLabel="Make lead"
          busy={busy}
          onConfirm={() => run(() => setLead({ trackId: track._id, userId: member.userId }), `${firstName} now leads ${track.name}`)}
          onCancel={() => setPanel(null)}
        />
      )}

      {panel === "remove" && (
        <ConfirmStrip
          message={`Remove ${firstName} from ${track.name}'s mentors? They lose their track permissions but keep their account.`}
          confirmLabel="Remove"
          danger
          busy={busy}
          onConfirm={() => run(() => removeMember({ trackId: track._id, userId: member.userId }), `${firstName} removed from ${track.name}`)}
          onCancel={() => setPanel(null)}
        />
      )}
    </div>
  );
}

function AddMentorForm({
  data,
  suggestLead,
  onDone,
  onToast,
}: {
  data: TrackAdmin;
  suggestLead: boolean;
  onDone: (message?: string) => void;
  onToast: ShowToast;
}) {
  const createInvitation = useMutation(api.invitations.create);
  const { track, capabilities } = data;
  const roles: StaffRole[] = [
    ...(capabilities.canManageCoMentors ? (["co_mentor"] as const) : []),
    ...(capabilities.canAssignLead ? (["lead_mentor"] as const) : []),
  ];

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<StaffRole>(suggestLead ? "lead_mentor" : roles[0] ?? "co_mentor");
  const [permissions, setPermissions] = useState<TrackPermission[]>(
    CO_MENTOR_DEFAULT_PERMISSIONS.filter((p) => capabilities.grantablePermissions.includes(p)),
  );
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const address = email.trim();
    if (!address) return;
    setSaving(true);
    try {
      const result = await createInvitation({
        email: address,
        platformRole: "member",
        permissions: [],
        trackGrants: [{ trackId: track._id, role, permissions: role === "co_mentor" ? permissions : [] }],
      });
      const roleLabel = role === "lead_mentor" ? "lead mentor" : "co-mentor";
      onDone(result === "applied" ? `Added ${address} as ${roleLabel}` : `Invitation sent to ${address}`);
    } catch (err) {
      onToast(errorMessage(err), "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
        <div style={{ flex: "1 1 260px" }}>
          <label htmlFor="add-mentor-email" style={fieldLabelStyle}>
            Email
          </label>
          <input
            id="add-mentor-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            required
            autoFocus
            style={controlStyle}
            {...focusHandlers}
          />
        </div>
        {roles.length > 1 && (
          <div>
            <span style={fieldLabelStyle}>Role</span>
            <div
              role="group"
              aria-label="Mentor role"
              style={{ display: "inline-flex", border: "1px solid var(--color-border-strong)", borderRadius: 10, overflow: "hidden" }}
            >
              {roles.map((option, i) => {
                const selected = role === option;
                return (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setRole(option)}
                    style={{
                      height: 38,
                      padding: "0 14px",
                      border: "none",
                      borderRight: i < roles.length - 1 ? "1px solid var(--color-border-strong)" : "none",
                      backgroundColor: selected ? "rgba(99,102,241,0.12)" : "transparent",
                      color: selected ? "#A5B4FC" : "var(--color-text-tertiary)",
                      fontFamily: font.body,
                      fontSize: 13,
                      fontWeight: selected ? 500 : 400,
                      cursor: "pointer",
                    }}
                  >
                    {option === "lead_mentor" ? "Lead mentor" : "Co-mentor"}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {role === "co_mentor" ? (
        <div style={{ marginTop: 16 }}>
          <span style={fieldLabelStyle}>Track permissions</span>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 8 }}>
            {TRACK_PERMISSIONS.map((permission) => {
              const grantable = capabilities.grantablePermissions.includes(permission);
              return (
                <PermissionCheckbox
                  key={permission}
                  label={TRACK_PERMISSION_INFO[permission].label}
                  description={
                    grantable
                      ? TRACK_PERMISSION_INFO[permission].description
                      : "You don't have this permission, so you can't grant it"
                  }
                  checked={permissions.includes(permission)}
                  disabled={!grantable}
                  onChange={() =>
                    setPermissions((prev) =>
                      prev.includes(permission) ? prev.filter((p) => p !== permission) : [...prev, permission],
                    )
                  }
                />
              );
            })}
          </div>
        </div>
      ) : (
        <p style={{ fontFamily: font.body, fontSize: 12, color: "var(--color-text-tertiary)", margin: 0, marginTop: 12 }}>
          The lead mentor owns the track and gets every track permission. If there&apos;s already a lead, they become a
          co-mentor.
        </p>
      )}

      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 16, flexWrap: "wrap" }}>
        <button
          type="submit"
          disabled={!email.trim() || saving}
          style={{
            ...smallButtonStyle,
            height: 34,
            border: "none",
            backgroundColor: "var(--color-indigo)",
            opacity: !email.trim() || saving ? 0.4 : 1,
            cursor: !email.trim() || saving ? "not-allowed" : "pointer",
          }}
        >
          {saving ? "Adding…" : "Add mentor"}
        </button>
        <button type="button" onClick={() => onDone()} style={ghostButtonStyle}>
          Cancel
        </button>
        <span style={{ fontFamily: font.body, fontSize: 12, color: "var(--color-text-tertiary)" }}>
          Existing members join right away. Anyone else gets an invitation email.
        </span>
      </div>
    </form>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import type { FunctionReturnType } from "convex/server";
import { api } from "@/convex/_generated/api";
import {
  PLATFORM_ROLE_PRESETS,
  TRACK_ROLE_INFO,
  type PlatformPermission,
  type PlatformRole,
} from "@/convex/lib/permissions";
import { PrimaryButton } from "@/components/ui/custom/buttons";
import { PlatformAccessEditor } from "@/components/admin/platform-access-editor";
import { initials, type Me } from "@/lib/access";

const font = {
  display: "var(--font-display), 'Space Grotesk', 'Inter', system-ui, sans-serif",
  body: "var(--font-body), 'Inter', system-ui, -apple-system, sans-serif",
  mono: "var(--font-mono), 'JetBrains Mono', 'SF Mono', monospace",
};

const PAGE_SIZE = 25;

type Member = FunctionReturnType<typeof api.users.listForManagement>["page"][number];
type StatusFilter = "all" | "active" | "suspended";

type ToastData = {
  message: string;
  type: "success" | "error";
};

const toastDotColor: Record<ToastData["type"], string> = {
  success: "#22C55E",
  error: "#EF4444",
};

const smallButtonStyle: React.CSSProperties = {
  height: 30,
  padding: "0 12px",
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

const sectionLabelStyle: React.CSSProperties = {
  fontFamily: font.mono,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.10em",
  textTransform: "uppercase",
  color: "#B5B5B5",
  margin: 0,
  marginBottom: 10,
};

function errorMessage(err: unknown) {
  return err instanceof ConvexError ? String(err.data) : "Something went wrong. Please try again.";
}

function sameSet<T>(a: readonly T[], b: readonly T[]) {
  return a.length === b.length && a.every((item) => b.includes(item));
}

function isCustomised(member: Pick<Member, "platformRole" | "permissions">) {
  return !sameSet(member.permissions, PLATFORM_ROLE_PRESETS[member.platformRole].permissions);
}

function matchesSearch(member: Member, query: string) {
  if (!query) return true;
  const haystack = [
    member.fullName,
    member.email,
    PLATFORM_ROLE_PRESETS[member.platformRole].label,
    ...member.trackRoles.map((r) => r.trackName),
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

export default function MembersPage() {
  const me = useQuery(api.users.me);
  const { results, status, loadMore } = usePaginatedQuery(
    api.users.listForManagement,
    {},
    { initialNumItems: PAGE_SIZE },
  );

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [openId, setOpenId] = useState<Member["_id"] | null>(null);
  const [toast, setToast] = useState<ToastData | null>(null);

  const showToast = useCallback((message: string, type: ToastData["type"] = "success") => {
    setToast({ message, type });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), toast.type === "error" ? 5000 : 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const query = search.trim().toLowerCase();
  const filtered = results.filter(
    (m) => (statusFilter === "all" || m.status === statusFilter) && matchesSearch(m, query),
  );
  const suspendedCount = results.filter((m) => m.status === "suspended").length;
  const loadedAll = status === "Exhausted";

  return (
    <div>
      <style>{`
        @keyframes toast-enter {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          [data-toast] { animation: none !important; }
        }
      `}</style>

      <h1
        style={{
          fontFamily: font.display,
          fontSize: 36,
          lineHeight: "42px",
          fontWeight: 600,
          letterSpacing: "-0.02em",
          color: "var(--color-text-primary)",
          margin: 0,
        }}
      >
        Members
      </h1>
      <p
        style={{
          fontFamily: font.body,
          fontSize: 14,
          lineHeight: "22px",
          color: "var(--color-text-secondary)",
          margin: 0,
          marginTop: 6,
          marginBottom: 32,
        }}
      >
        {status === "LoadingFirstPage"
          ? "Loading people…"
          : `${results.length}${loadedAll ? "" : "+"} ${results.length === 1 ? "person" : "people"}` +
            (suspendedCount > 0 ? ` · ${suspendedCount} suspended` : "")}
      </p>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 20 }}>
        <input
          type="search"
          placeholder="Search by name, email, role or track"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search members"
          style={{
            flex: "1 1 280px",
            height: 40,
            padding: "0 14px",
            borderRadius: 10,
            backgroundColor: "var(--color-bg-surface-2)",
            border: "1px solid var(--color-border-strong)",
            color: "var(--color-text-primary)",
            fontFamily: font.body,
            fontSize: "14.5px",
            outline: "none",
            boxSizing: "border-box",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "rgba(99,102,241,0.70)";
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.15)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "var(--color-border-strong)";
            e.currentTarget.style.boxShadow = "none";
          }}
        />
        <div
          role="group"
          aria-label="Filter by status"
          style={{ display: "flex", border: "1px solid var(--color-border-strong)", borderRadius: 10, overflow: "hidden" }}
        >
          {(["all", "active", "suspended"] as const).map((value, i) => {
            const selected = statusFilter === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={selected}
                onClick={() => setStatusFilter(value)}
                style={{
                  height: 38,
                  padding: "0 14px",
                  border: "none",
                  borderRight: i < 2 ? "1px solid var(--color-border-strong)" : "none",
                  backgroundColor: selected ? "rgba(99,102,241,0.12)" : "transparent",
                  color: selected ? "#A5B4FC" : "#737373",
                  fontFamily: font.body,
                  fontSize: 13,
                  fontWeight: selected ? 500 : 400,
                  textTransform: "capitalize",
                  cursor: "pointer",
                  transitionProperty: "background-color, color",
                  transitionDuration: "var(--duration-fast)",
                  transitionTimingFunction: "var(--ease-out-quart)",
                }}
              >
                {value}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ border: "1px solid var(--color-border-subtle)", borderRadius: 14, overflow: "hidden" }}>
        <div
          className="max-md:hidden"
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0,2.2fr) minmax(0,1.2fr) minmax(0,2fr) 110px 96px",
            gap: 16,
            padding: "10px 20px",
            backgroundColor: "var(--color-bg-surface-2)",
            borderBottom: "1px solid var(--color-border-subtle)",
          }}
        >
          {["Person", "Platform role", "Tracks", "Status", ""].map((h) => (
            <span
              key={h || "actions"}
              style={{
                fontFamily: font.mono,
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.10em",
                textTransform: "uppercase",
                color: "var(--color-text-tertiary)",
              }}
            >
              {h}
            </span>
          ))}
        </div>

        {status === "LoadingFirstPage" && <EmptyRow>Loading…</EmptyRow>}
        {status !== "LoadingFirstPage" && filtered.length === 0 && (
          <EmptyRow>
            {results.length === 0
              ? "No one has joined yet. Send an invitation to get started."
              : loadedAll
                ? "No one matches your filters."
                : "No one matches in the people loaded so far. Load more to keep looking."}
          </EmptyRow>
        )}

        {me &&
          filtered.map((member, i) => (
            <MemberRow
              key={member._id}
              me={me}
              member={member}
              last={i === filtered.length - 1}
              open={openId === member._id}
              onToggle={() => setOpenId((prev) => (prev === member._id ? null : member._id))}
              onClose={() => setOpenId(null)}
              onToast={showToast}
            />
          ))}
      </div>

      {status === "CanLoadMore" && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
          <button type="button" onClick={() => loadMore(PAGE_SIZE)} style={smallButtonStyle}>
            Load more
          </button>
        </div>
      )}

      {toast && (
        <div
          data-toast
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

function EmptyRow({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontFamily: font.body,
        fontSize: 14,
        color: "var(--color-text-tertiary)",
        margin: 0,
        padding: "28px 20px",
        textAlign: "center",
      }}
    >
      {children}
    </p>
  );
}

function MemberRow({
  me,
  member,
  last,
  open,
  onToggle,
  onClose,
  onToast,
}: {
  me: Me;
  member: Member;
  last: boolean;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  onToast: (message: string, type?: ToastData["type"]) => void;
}) {
  const suspended = member.status === "suspended";
  const panelId = `member-panel-${member._id}`;

  return (
    <div style={{ borderBottom: last ? "none" : "1px solid var(--color-border-subtle)" }}>
      <div
        className="max-md:!grid-cols-1"
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0,2.2fr) minmax(0,1.2fr) minmax(0,2fr) 110px 96px",
          gap: 16,
          padding: "14px 20px",
          alignItems: "center",
          backgroundColor: open ? "#141414" : "transparent",
          opacity: suspended && !open ? 0.6 : 1,
          transitionProperty: "background-color, opacity",
          transitionDuration: "var(--duration-fast)",
          transitionTimingFunction: "var(--ease-out-quart)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          <div
            aria-hidden
            style={{
              width: 34,
              height: 34,
              borderRadius: 999,
              flexShrink: 0,
              backgroundColor: "var(--color-bg-surface-3)",
              border: "1px solid var(--color-border-subtle)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: font.mono,
              fontSize: 11,
              fontWeight: 500,
              color: "var(--color-text-secondary)",
            }}
          >
            {initials(member.fullName)}
          </div>
          <div style={{ minWidth: 0 }}>
            <p
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontFamily: font.body,
                fontSize: 14,
                fontWeight: 500,
                color: "var(--color-text-primary)",
                margin: 0,
              }}
            >
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {member.fullName}
              </span>
              {member.isSelf && <Tag>You</Tag>}
            </p>
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
          </div>
        </div>

        <div style={{ minWidth: 0 }}>
          <span
            style={{
              fontFamily: font.body,
              fontSize: 13,
              color: member.platformRole === "member" ? "var(--color-text-tertiary)" : "var(--color-text-secondary)",
            }}
          >
            {PLATFORM_ROLE_PRESETS[member.platformRole].label}
          </span>
          {isCustomised(member) && (
            <span
              title={`${member.permissions.length} platform permission${member.permissions.length === 1 ? "" : "s"}, adjusted from the preset`}
              style={{ fontFamily: font.mono, fontSize: 10, color: "#A5B4FC", marginLeft: 6, letterSpacing: "0.06em" }}
            >
              CUSTOM
            </span>
          )}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, minWidth: 0 }}>
          {member.trackRoles.length === 0 ? (
            <span style={{ fontFamily: font.body, fontSize: 13, color: "var(--color-text-tertiary)" }}>—</span>
          ) : (
            member.trackRoles.map((r) => (
              <Tag key={`${r.trackId}-${r.role}-${r.cohortName ?? ""}`} accent={r.role !== "student"}>
                {r.trackName} · {TRACK_ROLE_INFO[r.role].label}
                {r.cohortName ? ` · ${r.cohortName}` : ""}
              </Tag>
            ))
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            aria-hidden
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              flexShrink: 0,
              backgroundColor: suspended ? "#FBBF24" : "#4ADE80",
            }}
          />
          <span style={{ fontFamily: font.body, fontSize: 12, color: "var(--color-text-secondary)" }}>
            {suspended ? "Suspended" : "Active"}
          </span>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          {member.canEdit ? (
            <button
              type="button"
              onClick={onToggle}
              aria-expanded={open}
              aria-controls={panelId}
              style={{
                ...smallButtonStyle,
                borderColor: open ? "rgba(99,102,241,0.55)" : "var(--color-border-strong)",
                color: open ? "#A5B4FC" : "var(--color-text-primary)",
              }}
            >
              {open ? "Close" : "Manage"}
            </button>
          ) : (
            <span
              title={
                member.isSelf
                  ? "Ask another admin to change your access"
                  : "Only a super admin can manage super admins"
              }
              style={{ fontFamily: font.mono, fontSize: 10, letterSpacing: "0.08em", color: "var(--color-text-tertiary)" }}
            >
              {member.isSelf ? "—" : "PROTECTED"}
            </span>
          )}
        </div>
      </div>

      {open && member.canEdit && (
        <ManagePanel id={panelId} me={me} member={member} onClose={onClose} onToast={onToast} />
      )}
    </div>
  );
}

function Tag({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        height: 22,
        padding: "0 8px",
        borderRadius: 999,
        border: `1px solid ${accent ? "rgba(99,102,241,0.35)" : "var(--color-border-subtle)"}`,
        backgroundColor: accent ? "rgba(99,102,241,0.08)" : "transparent",
        color: accent ? "#A5B4FC" : "var(--color-text-secondary)",
        fontFamily: font.body,
        fontSize: 12,
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      {children}
    </span>
  );
}

function ManagePanel({
  id,
  me,
  member,
  onClose,
  onToast,
}: {
  id: string;
  me: Me;
  member: Member;
  onClose: () => void;
  onToast: (message: string, type?: ToastData["type"]) => void;
}) {
  const updatePermissions = useMutation(api.users.updatePermissions);
  const setStatus = useMutation(api.users.setStatus);

  const [platformRole, setPlatformRole] = useState<PlatformRole>(member.platformRole);
  const [permissions, setPermissions] = useState<PlatformPermission[]>(member.permissions);
  const [saving, setSaving] = useState(false);
  const [confirmingStatus, setConfirmingStatus] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);

  const dirty = platformRole !== member.platformRole || !sameSet(permissions, member.permissions);
  const suspended = member.status === "suspended";
  const firstName = member.fullName.split(" ")[0] || member.fullName;

  async function save() {
    setSaving(true);
    try {
      await updatePermissions({ userId: member._id, platformRole, permissions });
      onToast(`Updated ${firstName}'s access`);
      onClose();
    } catch (err) {
      onToast(errorMessage(err), "error");
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus() {
    setChangingStatus(true);
    try {
      await setStatus({ userId: member._id, status: suspended ? "active" : "suspended" });
      onToast(suspended ? `${firstName} can sign in again` : `${firstName} has been suspended`);
      setConfirmingStatus(false);
    } catch (err) {
      onToast(errorMessage(err), "error");
    } finally {
      setChangingStatus(false);
    }
  }

  return (
    <div
      id={id}
      style={{
        padding: "20px 20px 24px",
        backgroundColor: "#141414",
        borderTop: "1px solid var(--color-border-subtle)",
      }}
    >
      <p style={sectionLabelStyle}>Platform access</p>
      <PlatformAccessEditor
        me={me}
        platformRole={platformRole}
        permissions={permissions}
        onChange={(role, perms) => {
          setPlatformRole(role);
          setPermissions(perms);
        }}
      />
      <p style={{ fontFamily: font.body, fontSize: 12, color: "#737373", margin: 0, marginTop: 12 }}>
        Platform permissions apply to every track. Mentor and student roles are managed on the Tracks page.
      </p>

      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 16 }}>
        <PrimaryButton onClick={save} disabled={!dirty || saving} size="small">
          {saving ? "Saving…" : "Save changes"}
        </PrimaryButton>
        {dirty && !saving && (
          <button
            type="button"
            onClick={() => {
              setPlatformRole(member.platformRole);
              setPermissions(member.permissions);
            }}
            style={{ ...smallButtonStyle, border: "none", color: "var(--color-text-tertiary)" }}
          >
            Discard
          </button>
        )}
      </div>

      <div
        style={{
          marginTop: 24,
          paddingTop: 20,
          borderTop: "1px solid var(--color-border-subtle)",
          display: "flex",
          gap: 16,
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
        }}
      >
        <div style={{ minWidth: 0, flex: "1 1 320px" }}>
          <p style={{ ...sectionLabelStyle, marginBottom: 4 }}>{suspended ? "Suspended" : "Account"}</p>
          <p style={{ fontFamily: font.body, fontSize: 13, color: "var(--color-text-secondary)", margin: 0 }}>
            {suspended
              ? `${firstName} can't use the platform. Reactivating restores the access shown above.`
              : `Suspending blocks ${firstName} from the platform right away. Their access and progress are kept.`}
          </p>
        </div>

        {confirmingStatus ? (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontFamily: font.body, fontSize: 13, color: "var(--color-text-secondary)" }}>
              {suspended ? `Reactivate ${firstName}?` : `Suspend ${firstName}?`}
            </span>
            <button
              type="button"
              onClick={toggleStatus}
              disabled={changingStatus}
              style={{
                ...smallButtonStyle,
                borderColor: suspended ? "rgba(99,102,241,0.55)" : "rgba(239,68,68,0.55)",
                backgroundColor: suspended ? "rgba(99,102,241,0.12)" : "rgba(239,68,68,0.10)",
                color: suspended ? "#A5B4FC" : "#F87171",
                opacity: changingStatus ? 0.5 : 1,
                cursor: changingStatus ? "not-allowed" : "pointer",
              }}
            >
              {changingStatus ? "Working…" : suspended ? "Reactivate" : "Suspend"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmingStatus(false)}
              disabled={changingStatus}
              style={{ ...smallButtonStyle, border: "none", color: "var(--color-text-tertiary)" }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingStatus(true)}
            style={{
              ...smallButtonStyle,
              color: suspended ? "var(--color-text-primary)" : "#F87171",
            }}
          >
            {suspended ? "Reactivate account" : "Suspend account"}
          </button>
        )}
      </div>
    </div>
  );
}

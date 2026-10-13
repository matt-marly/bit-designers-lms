"use client";

import {
  PLATFORM_PERMISSIONS,
  PLATFORM_PERMISSION_INFO,
  PLATFORM_ROLES,
  PLATFORM_ROLE_PRESETS,
  type PlatformPermission,
  type PlatformRole,
} from "@/convex/lib/permissions";
import type { Me } from "@/lib/access";

const font = {
  body: "var(--font-body), 'Inter', system-ui, -apple-system, sans-serif",
};

export function PermissionCheckbox({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
}) {
  return (
    <label
      style={{
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
        padding: "10px 12px",
        border: `1px solid ${checked ? "rgba(99,102,241,0.35)" : "#242424"}`,
        borderRadius: 10,
        backgroundColor: checked ? "rgba(99,102,241,0.06)" : "transparent",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        style={{ marginTop: 2, accentColor: "#6366F1" }}
      />
      <span>
        <span style={{ display: "block", fontFamily: font.body, fontSize: 13, fontWeight: 500, color: "#FFFFFF" }}>
          {label}
        </span>
        {description && (
          <span style={{ display: "block", fontFamily: font.body, fontSize: 12, color: "#737373", marginTop: 2 }}>
            {description}
          </span>
        )}
      </span>
    </label>
  );
}

/**
 * Role preset chips plus the platform permission checklist. Permissions the
 * editor doesn't hold are locked: they can neither be granted nor removed.
 */
export function PlatformAccessEditor({
  me,
  platformRole,
  permissions,
  onChange,
}: {
  me: Me;
  platformRole: PlatformRole;
  permissions: PlatformPermission[];
  onChange: (platformRole: PlatformRole, permissions: PlatformPermission[]) => void;
}) {
  const isSuperAdmin = me.user.platformRole === "super_admin";
  const grantable = PLATFORM_PERMISSIONS.filter((p) => isSuperAdmin || me.user.permissions.includes(p));
  const presets = PLATFORM_ROLES.filter((role) => role !== "super_admin" || isSuperAdmin);

  function choosePreset(role: PlatformRole) {
    const fromPreset = PLATFORM_ROLE_PRESETS[role].permissions.filter((p) => grantable.includes(p));
    const locked = permissions.filter((p) => !grantable.includes(p));
    onChange(role, [...new Set([...fromPreset, ...locked])]);
  }

  function toggle(permission: PlatformPermission) {
    onChange(
      platformRole,
      permissions.includes(permission)
        ? permissions.filter((p) => p !== permission)
        : [...permissions, permission],
    );
  }

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {presets.map((role) => {
          const selected = platformRole === role;
          return (
            <button
              key={role}
              type="button"
              onClick={() => choosePreset(role)}
              title={PLATFORM_ROLE_PRESETS[role].description}
              aria-pressed={selected}
              style={{
                height: 34,
                padding: "0 14px",
                borderRadius: 999,
                border: `1px solid ${selected ? "rgba(99,102,241,0.55)" : "#333333"}`,
                backgroundColor: selected ? "rgba(99,102,241,0.12)" : "transparent",
                color: selected ? "#A5B4FC" : "#B5B5B5",
                fontFamily: font.body,
                fontSize: 13,
                fontWeight: selected ? 500 : 400,
                cursor: "pointer",
              }}
            >
              {PLATFORM_ROLE_PRESETS[role].label}
            </button>
          );
        })}
      </div>
      <p style={{ fontFamily: font.body, fontSize: 12, color: "#737373", margin: 0, marginTop: 8 }}>
        {PLATFORM_ROLE_PRESETS[platformRole].description}. You can adjust the permissions below.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 8,
          marginTop: 16,
        }}
      >
        {PLATFORM_PERMISSIONS.map((permission) => {
          const canChange = grantable.includes(permission);
          return (
            <PermissionCheckbox
              key={permission}
              label={PLATFORM_PERMISSION_INFO[permission].label}
              description={
                canChange
                  ? PLATFORM_PERMISSION_INFO[permission].description
                  : "You don't have this permission, so you can't change it"
              }
              checked={permissions.includes(permission)}
              disabled={!canChange}
              onChange={() => toggle(permission)}
            />
          );
        })}
      </div>
    </div>
  );
}

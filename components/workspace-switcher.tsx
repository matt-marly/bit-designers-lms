"use client";

import Link from "next/link";
import { GraduationCap, LayoutDashboard } from "lucide-react";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

type Workspace = "learn" | "admin";

const workspaces: { id: Workspace; label: string; href: string; icon: React.ElementType }[] = [
  { id: "learn", label: "Learn", href: "/home", icon: GraduationCap },
  { id: "admin", label: "Admin", href: "/admin", icon: LayoutDashboard },
];

/** Switch between the learner and admin areas. Renders nothing for people without admin access. */
export function WorkspaceSwitcher({ current, fullWidth }: { current: Workspace; fullWidth?: boolean }) {
  const { isAuthenticated } = useConvexAuth();
  const me = useQuery(api.users.me, isAuthenticated ? {} : "skip");

  if (!me?.hasAdminAccess) {
    return null;
  }

  return (
    <nav
      aria-label="Switch workspace"
      style={{
        display: fullWidth ? "flex" : "inline-flex",
        width: fullWidth ? "100%" : undefined,
        padding: 2,
        gap: 2,
        backgroundColor: "var(--color-bg-surface-2)",
        border: "1px solid var(--color-border-subtle)",
        borderRadius: 10,
      }}
    >
      {workspaces.map(({ id, label, href, icon: Icon }) => {
        const active = id === current;
        return (
          <Link
            key={id}
            href={href}
            aria-current={active ? "page" : undefined}
            style={{
              flex: fullWidth ? 1 : undefined,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              height: 28,
              padding: "0 12px",
              borderRadius: 8,
              fontFamily: "var(--font-body), 'Inter', system-ui, sans-serif",
              fontSize: 13,
              fontWeight: 500,
              textDecoration: "none",
              color: active ? "var(--color-text-primary)" : "var(--color-text-tertiary)",
              backgroundColor: active ? "var(--color-bg-surface-3)" : "transparent",
              boxShadow: active ? "inset 0 0 0 1px var(--color-border-strong)" : "none",
              transitionProperty: "background-color, color",
              transitionDuration: "var(--duration-fast)",
              transitionTimingFunction: "var(--ease-out-quart)",
            }}
            onMouseEnter={(e) => {
              if (!active) e.currentTarget.style.color = "var(--color-text-secondary)";
            }}
            onMouseLeave={(e) => {
              if (!active) e.currentTarget.style.color = "var(--color-text-tertiary)";
            }}
          >
            <Icon style={{ width: 14, height: 14 }} aria-hidden="true" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

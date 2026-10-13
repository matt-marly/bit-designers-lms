"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function NotificationBell({ size = 36 }: { size?: number }) {
  const pathname = usePathname();
  const { isAuthenticated } = useConvexAuth();
  const unread = useQuery(api.notifications.unreadCount, isAuthenticated ? {} : "skip") ?? 0;
  const active = pathname === "/notifications";
  const badge = unread > 99 ? "99+" : String(unread);

  return (
    <Link
      href="/notifications"
      aria-label={unread > 0 ? `Notifications, ${badge} unread` : "Notifications"}
      aria-current={active ? "page" : undefined}
      style={{
        position: "relative",
        width: size,
        height: size,
        borderRadius: 10,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        color: active ? "var(--color-text-primary)" : "var(--color-text-secondary)",
        backgroundColor: active ? "var(--color-bg-surface-3)" : "transparent",
        transition: "background-color 120ms ease, color 120ms ease",
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.04)";
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.backgroundColor = "transparent";
      }}
    >
      <Bell aria-hidden style={{ width: 18, height: 18 }} />
      {unread > 0 && (
        <span
          aria-hidden
          style={{
            position: "absolute",
            top: 4,
            right: 2,
            minWidth: 16,
            height: 16,
            padding: "0 4px",
            borderRadius: 999,
            backgroundColor: "var(--color-indigo)",
            color: "#fff",
            fontFamily: "var(--font-mono), 'JetBrains Mono', 'SF Mono', monospace",
            fontSize: 9,
            fontWeight: 600,
            lineHeight: "16px",
            textAlign: "center",
            boxShadow: "0 0 0 2px var(--color-bg-surface)",
          }}
        >
          {badge}
        </span>
      )}
    </Link>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { mockReviewQueue } from "@/lib/mock-admin-data";

const font = {
  body: "var(--font-body), 'Inter', system-ui, -apple-system, sans-serif",
  mono: "var(--font-mono), 'JetBrains Mono', 'SF Mono', monospace",
};

const tabs: { href: string; label: string; exact?: boolean; showCount?: boolean }[] = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/cohorts", label: "Cohorts" },
  { href: "/admin/invites", label: "Invites" },
  { href: "/admin/review", label: "Review Queue", showCount: true },
  { href: "/admin/announcements", label: "Announcements" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const pendingCount = mockReviewQueue.filter((r) => r.status === "pending").length;

  return (
    <div>
      {/* Admin tab nav */}
      <div
        style={{
          backgroundColor: "var(--color-bg-surface)",
          borderBottom: "1px solid var(--color-border-subtle)",
          padding: "0 32px",
          display: "flex",
          alignItems: "center",
          gap: 0,
          overflowX: "auto",
        }}
        className="max-md:px-5"
      >
        {tabs.map((tab) => {
          const isActive = tab.exact
            ? pathname === tab.href
            : pathname === tab.href || pathname.startsWith(tab.href + "/");

          return (
            <Link
              key={tab.href}
              href={tab.href}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "14px 16px",
                fontFamily: font.body,
                fontSize: 14,
                fontWeight: 500,
                color: isActive ? "var(--color-text-primary)" : "var(--color-text-tertiary)",
                textDecoration: "none",
                borderBottom: isActive ? "2px solid var(--color-indigo)" : "2px solid transparent",
                marginBottom: -1,
                whiteSpace: "nowrap",
                transitionProperty: "color",
                transitionDuration: "var(--duration-fast)",
                transitionTimingFunction: "var(--ease-out-quart)",
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.color = "var(--color-text-secondary)";
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.color = "var(--color-text-tertiary)";
              }}
            >
              {tab.label}
              {"showCount" in tab && tab.showCount && pendingCount > 0 && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: 18,
                    height: 18,
                    borderRadius: 999,
                    backgroundColor: "var(--color-bg-surface-3)",
                    border: "1px solid var(--color-border-subtle)",
                    fontFamily: font.mono,
                    fontSize: 10,
                    fontWeight: 500,
                    color: "var(--color-text-secondary)",
                    padding: "0 4px",
                  }}
                >
                  {pendingCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Page content */}
      <div
        className="max-md:px-5 max-md:py-6"
        style={{ maxWidth: 880, margin: "0 auto", padding: "48px 32px 64px" }}
      >
        {children}
      </div>
    </div>
  );
}

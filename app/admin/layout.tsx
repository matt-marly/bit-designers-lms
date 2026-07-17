"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const font = {
  body: "var(--font-body), 'Inter', system-ui, -apple-system, sans-serif",
  mono: "var(--font-mono), 'JetBrains Mono', 'SF Mono', monospace",
};

const tabs: { href: string; label: string; exact?: boolean; showCount?: boolean }[] = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/cohorts", label: "Cohorts" },
  { href: "/admin/members", label: "Members" },
  { href: "/admin/invites", label: "Invites" },
  { href: "/admin/review", label: "Review Queue", showCount: true },
  { href: "/admin/announcements", label: "Announcements" },
  { href: "/admin/sessions", label: "Sessions" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "var(--color-bg-base)",
      }}
    >
      {/* Admin top bar */}
      <header
        style={{
          height: 56,
          flexShrink: 0,
          backgroundColor: "var(--color-bg-surface)",
          borderBottom: "1px solid var(--color-border-subtle)",
          padding: "0 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
        className="max-md:px-4"
      >
        {/* Left: logo + divider + ADMIN */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
          <img
            src="/logo-white.svg"
            alt="BitDesigners Africa"
            style={{ height: 20, width: "auto", display: "block", filter: "brightness(0) invert(1)" }}
          />
          <div
            style={{
              width: 1,
              height: 16,
              backgroundColor: "var(--color-border-subtle)",
            }}
          />
          <span
            style={{
              fontFamily: font.mono,
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.10em",
              textTransform: "uppercase",
              color: "var(--color-text-tertiary)",
            }}
          >
            ADMIN
          </span>
        </div>

        {/* Center: tabs */}
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            height: 56,
            overflowX: "auto",
          }}
          className="max-lg:hidden"
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
                  display: "flex",
                  alignItems: "center",
                  height: 56,
                  padding: "0 16px",
                  fontFamily: font.body,
                  fontSize: 13,
                  fontWeight: 500,
                  color: isActive ? "var(--color-text-primary)" : "var(--color-text-tertiary)",
                  textDecoration: "none",
                  borderBottom: isActive ? "2px solid var(--color-indigo)" : "2px solid transparent",
                  marginBottom: -1,
                  whiteSpace: "nowrap",
                  gap: 6,
                  transitionProperty: "color",
                  transitionDuration: "120ms",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.color = "var(--color-text-secondary)";
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.color = "var(--color-text-tertiary)";
                }}
              >
                {tab.label}
                {tab.showCount && (
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
                      color: "var(--color-text-tertiary)",
                      padding: "0 4px",
                    }}
                  >
                    2
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right: user info */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          {/* Avatar */}
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 999,
              backgroundColor: "var(--color-bg-surface-3)",
              border: "1px solid var(--color-border-subtle)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: font.mono,
              fontSize: 10,
              fontWeight: 500,
              color: "var(--color-text-tertiary)",
            }}
          >
            AM
          </div>

          {/* Name + role */}
          <div className="max-md:hidden">
            <p
              style={{
                fontFamily: font.body,
                fontSize: 13,
                fontWeight: 500,
                color: "var(--color-text-primary)",
                margin: 0,
                lineHeight: "16px",
              }}
            >
              Adeyemi Matthew
            </p>
            <span
              style={{
                fontFamily: font.mono,
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "var(--color-text-tertiary)",
                backgroundColor: "var(--color-bg-surface-3)",
                border: "1px solid var(--color-border-subtle)",
                borderRadius: 999,
                padding: "2px 8px",
                display: "inline-block",
                marginTop: 2,
                lineHeight: "12px",
              }}
            >
              Admin
            </span>
          </div>
        </div>
      </header>

      {/* Mobile tab nav (below lg breakpoint) */}
      <div
        className="flex items-center lg:hidden"
        style={{
          backgroundColor: "var(--color-bg-surface)",
          borderBottom: "1px solid var(--color-border-subtle)",
          overflowX: "auto",
          padding: "0 16px",
        }}
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
                display: "flex",
                alignItems: "center",
                height: 44,
                padding: "0 12px",
                fontFamily: font.body,
                fontSize: 12,
                fontWeight: 500,
                color: isActive ? "var(--color-text-primary)" : "var(--color-text-tertiary)",
                textDecoration: "none",
                borderBottom: isActive ? "2px solid var(--color-indigo)" : "2px solid transparent",
                marginBottom: -1,
                whiteSpace: "nowrap",
                gap: 4,
              }}
            >
              {tab.label}
              {tab.showCount && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: 16,
                    height: 16,
                    borderRadius: 999,
                    backgroundColor: "var(--color-bg-surface-3)",
                    border: "1px solid var(--color-border-subtle)",
                    fontFamily: font.mono,
                    fontSize: 9,
                    fontWeight: 500,
                    color: "var(--color-text-tertiary)",
                    padding: "0 3px",
                  }}
                >
                  2
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Content area */}
      <div
        style={{ flex: 1, overflowY: "auto" }}
      >
        <div
          className="max-md:px-5 max-md:py-6"
          style={{ maxWidth: 960, margin: "0 auto", padding: "40px 48px" }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

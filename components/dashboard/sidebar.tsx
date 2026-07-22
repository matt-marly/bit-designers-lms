"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, LayoutGroup } from "framer-motion";
import {
  Home,
  BookOpen,
  Target,
  Radio,
  FolderOpen,
  Library,
  Users,
  Search,
  ExternalLink,
  LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const navGroups = [
  {
    label: "LEARN",
    items: [
      { href: "/home", label: "Home", icon: Home },
      { href: "/learn", label: "Learn", icon: BookOpen },
      { href: "/missions", label: "Missions", icon: Target },
      { href: "/live", label: "Live", icon: Radio },
    ],
  },
  {
    label: "EXPLORE",
    items: [
      { href: "/materials", label: "Materials", icon: FolderOpen },
      { href: "/reference", label: "Reference", icon: Library },
      { href: "/community", label: "Community", icon: Users },
    ],
  },
] as const;

export function Sidebar({ onSearchClick }: { onSearchClick?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <aside
      aria-label="Sidebar"
      className="fixed inset-y-0 left-0 z-30 hidden md:flex md:flex-col"
      style={{
        width: 260,
        height: "100vh",
        backgroundColor: "var(--color-bg-surface)",
        borderRight: "1px solid var(--color-border-subtle)",
        padding: 16,
      }}
    >
      {/* Logo zone — 64px height */}
      <div style={{ height: 64, display: "flex", alignItems: "center", paddingLeft: 12 }}>
        <Link href="/home">
          <img
            src="/logo-white.svg"
            alt="BitDesigners Africa"
            style={{ height: 24, width: "auto", display: "block", filter: "brightness(0) invert(1)" }}
          />
        </Link>
      </div>

      <nav role="navigation" aria-label="Main navigation" style={{ flex: 1 }}>
        <LayoutGroup>
          {navGroups.map((group) => (
            <div key={group.label}>
              {/* §4.8 Nav group header: label token, text-tertiary, padding 20px 12px 8px */}
              <p
                style={{
                  fontFamily: "var(--font-mono), 'JetBrains Mono', 'SF Mono', monospace",
                  fontSize: 11,
                  lineHeight: "14px",
                  fontWeight: 600,
                  letterSpacing: "0.10em",
                  textTransform: "uppercase",
                  color: "var(--color-text-tertiary)",
                  padding: "20px 12px 8px",
                  margin: 0,
                }}
              >
                {group.label}
              </p>

              <ul style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {group.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    pathname.startsWith(item.href + "/");
                  const Icon = item.icon;

                  return (
                    <li key={item.href} style={{ position: "relative", listStyle: "none" }}>
                      {/* §4.8 Active marker: 2px × 16px indigo bar, left edge */}
                      {isActive && (
                        <motion.div
                          layoutId="sidebar-nav-indicator"
                          style={{
                            position: "absolute",
                            top: "50%",
                            left: 0,
                            width: 2,
                            height: 16,
                            borderRadius: 999,
                            backgroundColor: "var(--color-indigo)",
                            transform: "translateY(-50%)",
                          }}
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 28,
                          }}
                        />
                      )}
                      <Link
                        href={item.href}
                        aria-current={isActive ? "page" : undefined}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          height: 40,
                          padding: "0 12px",
                          borderRadius: 10,
                          fontSize: "14.5px",
                          lineHeight: "22px",
                          fontWeight: 500,
                          fontFamily: "var(--font-body), 'Inter', system-ui, sans-serif",
                          color: isActive
                            ? "var(--color-text-primary)"
                            : "var(--color-text-secondary)",
                          backgroundColor: isActive
                            ? "var(--color-bg-surface-3)"
                            : "transparent",
                          textDecoration: "none",
                          transitionProperty: "background-color, color",
                          transitionDuration: "var(--duration-fast)",
                          transitionTimingFunction: "var(--ease-out-quart)",
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.04)";
                            e.currentTarget.style.color = "var(--color-text-primary)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.backgroundColor = "transparent";
                            e.currentTarget.style.color = "var(--color-text-secondary)";
                          }
                        }}
                      >
                        <Icon style={{ width: 18, height: 18, flexShrink: 0 }} aria-hidden="true" />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </LayoutGroup>
      </nav>

      {/* Search trigger */}
      <button
        onClick={onSearchClick}
        aria-label="Search (\u2318K)"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          padding: "8px 12px",
          margin: "8px 0",
          backgroundColor: "var(--color-bg-surface-2)",
          border: "1px solid var(--color-border-subtle)",
          borderRadius: 10,
          cursor: "pointer",
          transitionProperty: "border-color",
          transitionDuration: "var(--duration-fast)",
          transitionTimingFunction: "var(--ease-out-quart)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "var(--color-border-strong)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "var(--color-border-subtle)";
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Search
            style={{ width: 14, height: 14, color: "var(--color-text-tertiary)" }}
            aria-hidden="true"
          />
          <span
            style={{
              fontFamily: "var(--font-body), 'Inter', system-ui, sans-serif",
              fontSize: 13,
              fontWeight: 400,
              color: "var(--color-text-tertiary)",
            }}
          >
            Search...
          </span>
        </span>
        <kbd
          style={{
            fontFamily: "var(--font-mono), 'JetBrains Mono', 'SF Mono', monospace",
            fontSize: 11,
            fontWeight: 500,
            color: "var(--color-text-tertiary)",
            backgroundColor: "var(--color-bg-surface-3)",
            border: "1px solid var(--color-border-subtle)",
            borderRadius: 6,
            padding: "2px 6px",
            lineHeight: "14px",
          }}
        >
          {"\u2318"}K
        </kbd>
      </button>

      {/* User zone */}
      <div
        style={{
          padding: 16,
          borderTop: "1px solid var(--color-border-subtle)",
        }}
      >
        <Link
          href="/profile"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "6px 8px",
            margin: "-6px -8px",
            borderRadius: 8,
            cursor: "pointer",
            textDecoration: "none",
            transition: "background 120ms ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#161616")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 999,
              backgroundColor: "var(--color-bg-surface-3)",
              border: "1px solid var(--color-border-subtle)",
              flexShrink: 0,
            }}
          />
          <div style={{ minWidth: 0, flex: 1 }}>
            <p
              style={{
                margin: 0,
                fontFamily: "var(--font-body), 'Inter', system-ui, sans-serif",
                fontSize: "14.5px",
                fontWeight: 500,
                color: "var(--color-text-primary)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              Amara
            </p>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                height: 20,
                borderRadius: 6,
                backgroundColor: "var(--color-indigo-subtle)",
                border: "1px solid var(--color-indigo-border)",
                padding: "0 8px",
                fontFamily: "var(--font-mono), 'JetBrains Mono', 'SF Mono', monospace",
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "var(--color-indigo-text)",
                lineHeight: "12px",
                marginTop: 2,
              }}
            >
              Learner
            </span>
          </div>
        </Link>
      </div>

      {/* Admin link — TODO: restrict to admin/mentor role */}
      <button
        onClick={() => window.open("/admin", "_blank")}
        aria-label="Admin dashboard"
        style={{
          padding: "8px 12px",
          marginTop: 4,
          display: "flex",
          alignItems: "center",
          gap: 8,
          cursor: "pointer",
          opacity: 0.6,
          background: "none",
          border: "none",
          width: "100%",
          transitionProperty: "opacity",
          transitionDuration: "var(--duration-fast)",
          transitionTimingFunction: "var(--ease-out-quart)",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.6")}
      >
        <ExternalLink
          style={{ width: 11, height: 11, color: "var(--color-text-tertiary)" }}
          aria-hidden="true"
        />
        <span
          style={{
            fontFamily: "var(--font-body), 'Inter', system-ui, sans-serif",
            fontSize: 11,
            fontWeight: 400,
            color: "var(--color-text-tertiary)",
          }}
        >
          Admin
        </span>
      </button>

      {/* Log out */}
      <button
        onClick={handleLogout}
        style={{
          padding: "8px 0",
          marginLeft: 12,
          display: "flex",
          alignItems: "center",
          gap: 8,
          cursor: "pointer",
          background: "none",
          border: "none",
          fontFamily: "var(--font-body), 'Inter', system-ui, sans-serif",
          fontSize: 13,
          fontWeight: 400,
          color: "#737373",
          transition: "color 120ms ease",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#F87171")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#737373")}
      >
        <LogOut style={{ width: 14, height: 14 }} aria-hidden="true" />
        Log out
      </button>
    </aside>
  );
}

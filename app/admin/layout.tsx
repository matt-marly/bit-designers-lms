"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { motion, LayoutGroup } from "framer-motion";
import {
  LayoutDashboard,
  Layers,
  BookOpen,
  Map,
  Users,
  Send,
  ClipboardCheck,
  Megaphone,
  Radio,
  FolderOpen,
} from "lucide-react";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  canInvite,
  hasAnyTrackPermission,
  hasPlatformPermission,
  initials,
  roleLabel,
  type Me,
} from "@/lib/access";
import { WorkspaceSwitcher } from "@/components/workspace-switcher";

const font = {
  body: "var(--font-body), 'Inter', system-ui, -apple-system, sans-serif",
  mono: "var(--font-mono), 'JetBrains Mono', 'SF Mono', monospace",
};

type Tab = {
  href: string;
  label: string;
  exact?: boolean;
  showCount?: boolean;
  icon: React.ComponentType<{ style?: React.CSSProperties; "aria-hidden"?: boolean | "true" | "false" }>;
  canSee: (me: Me) => boolean;
};

const allTabs: Tab[] = [
  { href: "/admin", label: "Overview", exact: true, icon: LayoutDashboard, canSee: () => true },
  {
    href: "/admin/tracks",
    label: "Tracks",
    icon: Layers,
    canSee: (me) => hasPlatformPermission(me, "tracks.manage") || hasAnyTrackPermission(me, "track.cohorts"),
  },
  {
    href: "/admin/curriculum",
    label: "Curriculum",
    icon: BookOpen,
    canSee: (me) => hasPlatformPermission(me, "content.manage") || hasAnyTrackPermission(me, "track.content"),
  },
  {
    href: "/admin/roadmaps",
    label: "Roadmaps",
    icon: Map,
    canSee: (me) => hasPlatformPermission(me, "content.manage") || hasAnyTrackPermission(me, "track.content"),
  },
  {
    href: "/admin/members",
    label: "Members",
    icon: Users,
    canSee: (me) => hasPlatformPermission(me, "users.manage"),
  },
  { href: "/admin/invites", label: "Invites", icon: Send, canSee: canInvite },
  {
    href: "/admin/review",
    label: "Review Queue",
    showCount: true,
    icon: ClipboardCheck,
    canSee: (me) => hasPlatformPermission(me, "reviews.manage") || hasAnyTrackPermission(me, "track.reviews"),
  },
  {
    href: "/admin/announcements",
    label: "Announcements",
    icon: Megaphone,
    canSee: (me) =>
      hasPlatformPermission(me, "announcements.global") || hasAnyTrackPermission(me, "track.announcements"),
  },
  {
    href: "/admin/sessions",
    label: "Sessions",
    icon: Radio,
    canSee: (me) => hasPlatformPermission(me, "workshops.manage") || hasAnyTrackPermission(me, "track.workshops"),
  },
  {
    href: "/admin/resources",
    label: "Resources",
    icon: FolderOpen,
    canSee: (me) => hasPlatformPermission(me, "resources.manage"),
  },
];

function isTabActive(tab: Tab, pathname: string) {
  return tab.exact ? pathname === tab.href : pathname === tab.href || pathname.startsWith(tab.href + "/");
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  // Clerk decides signed-in vs signed-out. Convex auth briefly reads as
  // unauthenticated while it fetches a fresh token (e.g. right after sign-up),
  // so redirecting on it would bounce signed-in users to /login.
  const { isLoaded: clerkLoaded, isSignedIn } = useAuth();
  const { isAuthenticated } = useConvexAuth();
  const me = useQuery(api.users.me, isAuthenticated ? {} : "skip");
  const hasAccess = me?.hasAdminAccess === true && me.user.status === "active";
  const tabs = me && hasAccess ? allTabs.filter((tab) => tab.canSee(me)) : [];
  const canReview = tabs.some((tab) => tab.showCount);
  const waitingCount = useQuery(api.reviews.waitingCount, canReview ? {} : "skip");
  const countLabel = waitingCount === undefined || waitingCount === 0 ? null : waitingCount >= 100 ? "99+" : String(waitingCount);
  const currentTab = allTabs.find((tab) => isTabActive(tab, pathname));
  const canSeeCurrent = me && hasAccess ? (currentTab?.canSee(me) ?? true) : false;

  useEffect(() => {
    if (!clerkLoaded) return;
    if (!isSignedIn) {
      router.replace("/login");
    } else if (me !== undefined && me !== null && !hasAccess) {
      router.replace("/home");
    } else if (hasAccess && !canSeeCurrent) {
      router.replace("/admin");
    }
  }, [clerkLoaded, isSignedIn, me, hasAccess, canSeeCurrent, router]);

  if (!me || !hasAccess || !canSeeCurrent) {
    return null;
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--color-bg-base)" }}>
      {/* Desktop side nav — mirrors the learner sidebar */}
      <aside
        aria-label="Admin navigation"
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
        <div style={{ height: 64, display: "flex", alignItems: "center", gap: 12, paddingLeft: 12 }}>
          <Link href="/admin">
            <img
              src="/logo-white.svg"
              alt="BitDesigners Africa"
              style={{ height: 24, width: "auto", display: "block", filter: "brightness(0) invert(1)" }}
            />
          </Link>
          <span
            style={{
              fontFamily: font.mono,
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.10em",
              color: "var(--color-text-tertiary)",
              backgroundColor: "var(--color-bg-surface-3)",
              border: "1px solid var(--color-border-subtle)",
              borderRadius: 6,
              padding: "3px 8px",
              lineHeight: "12px",
            }}
          >
            ADMIN
          </span>
        </div>

        <nav role="navigation" aria-label="Admin sections" style={{ flex: 1, overflowY: "auto" }}>
          <LayoutGroup>
            <div>
              <p
                style={{
                  fontFamily: font.mono,
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
                Manage
              </p>

              <ul style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {tabs.map((tab) => {
                  const isActive = isTabActive(tab, pathname);
                  const Icon = tab.icon;

                  return (
                    <li key={tab.href} style={{ position: "relative", listStyle: "none" }}>
                      {isActive && (
                        <motion.div
                          layoutId="admin-nav-indicator"
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
                        href={tab.href}
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
                          fontFamily: font.body,
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
                        <span style={{ flex: 1 }}>{tab.label}</span>
                        {tab.showCount && countLabel && (
                          <span
                            aria-label={`${countLabel} waiting`}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              minWidth: 20,
                              height: 20,
                              borderRadius: 999,
                              backgroundColor: "var(--color-bg-surface-3)",
                              border: "1px solid var(--color-border-subtle)",
                              fontFamily: font.mono,
                              fontSize: 10,
                              fontWeight: 500,
                              color: "var(--color-text-tertiary)",
                              padding: "0 6px",
                            }}
                          >
                            {countLabel}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </LayoutGroup>
        </nav>

        <div style={{ marginBottom: 8 }}>
          <WorkspaceSwitcher current="admin" fullWidth />
        </div>

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
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: font.mono,
                fontSize: 10,
                fontWeight: 500,
                color: "var(--color-text-tertiary)",
                flexShrink: 0,
              }}
            >
              {initials(me.user.fullName)}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p
                style={{
                  margin: 0,
                  fontFamily: font.body,
                  fontSize: "14.5px",
                  fontWeight: 500,
                  color: "var(--color-text-primary)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {me.user.fullName}
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
                  fontFamily: font.mono,
                  fontSize: 10,
                  fontWeight: 500,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: "var(--color-indigo-text)",
                  lineHeight: "12px",
                  marginTop: 2,
                }}
              >
                {roleLabel(me)}
              </span>
            </div>
          </Link>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-[#242424] bg-[#090909] px-4 md:hidden">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Link href="/admin" aria-label="Admin overview">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-white.svg"
              alt="BitDesigners Africa"
              style={{ height: 20, width: "auto", display: "block", filter: "brightness(0) invert(1)" }}
            />
          </Link>
          <span
            style={{
              fontFamily: font.mono,
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.10em",
              color: "var(--color-text-tertiary)",
            }}
          >
            ADMIN
          </span>
        </div>
        <Link href="/profile" aria-label="Your profile" className="rounded-full">
          <div
            style={{
              width: 30,
              height: 30,
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
            {initials(me.user.fullName)}
          </div>
        </Link>
      </header>

      {/* Mobile section nav — horizontal scroll below the top bar */}
      <div
        className="fixed inset-x-0 top-14 z-30 flex items-center md:hidden"
        style={{
          backgroundColor: "var(--color-bg-surface)",
          borderBottom: "1px solid var(--color-border-subtle)",
          overflowX: "auto",
          padding: "0 12px",
        }}
      >
        {tabs.map((tab) => {
          const isActive = isTabActive(tab, pathname);

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
              {tab.showCount && countLabel && (
                <span
                  aria-label={`${countLabel} waiting`}
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
                  {countLabel}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Content area */}
      <main
        role="main"
        aria-label="Admin content"
        className="min-h-screen pt-[100px] md:pt-0 md:ml-[260px]"
        style={{ flex: 1, overflowY: "auto" }}
      >
        <div
          className="max-md:px-5 max-md:py-6"
          style={{ maxWidth: 960, margin: "0 auto", padding: "40px 48px" }}
        >
          {children}
        </div>
      </main>
    </div>
  );
}

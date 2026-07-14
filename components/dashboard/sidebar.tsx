"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, LayoutGroup } from "framer-motion";
import {
  Home,
  BookOpen,
  Target,
  Radio,
  FolderOpen,
  Users,
} from "lucide-react";

const navItems = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/learn", label: "Learn", icon: BookOpen },
  { href: "/missions", label: "Missions", icon: Target },
  { href: "/live", label: "Live", icon: Radio },
  { href: "/resources", label: "Resources", icon: FolderOpen },
  { href: "/community", label: "Community", icon: Users },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-[#242424] bg-[#090909] md:flex md:flex-col"
      style={{ height: "100vh" }}
    >
      <div className="flex h-16 items-center px-6">
        <Link href="/home">
          <img
            src="/logo-white.svg"
            alt="BitDesigners Africa"
            style={{ height: "24px", width: "auto", display: "block", filter: "brightness(0) invert(1)" }}
          />
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4">
        <LayoutGroup>
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                pathname.startsWith(item.href + "/");
              const Icon = item.icon;

              return (
                <li key={item.href} className="relative">
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-nav-indicator"
                      className="absolute inset-y-0 left-0 w-[3px] rounded-full bg-[#6366F1]"
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 28,
                      }}
                    />
                  )}
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg border-0 px-3 py-2.5 text-sm font-medium outline-none transition-colors ${
                      isActive
                        ? "bg-[#1A1A1A] text-[#FFFFFF]"
                        : "text-[#B5B5B5] hover:bg-[#111111] hover:text-[#FFFFFF]"
                    }`}
                  >
                    <Icon className="h-[18px] w-[18px] shrink-0" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </LayoutGroup>
      </nav>

      <div
        style={{
          padding: "16px",
          borderTop: "1px solid #242424",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "9999px",
            backgroundColor: "#1A1A1A",
            border: "1px solid #242424",
            flexShrink: 0,
          }}
        />
        <div style={{ minWidth: 0, flex: 1 }}>
          <p
            style={{
              margin: 0,
              fontSize: "14px",
              fontWeight: 500,
              color: "#FFFFFF",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            Member
          </p>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              borderRadius: "9999px",
              backgroundColor: "#1E1B4B",
              padding: "2px 8px",
              fontSize: "11px",
              fontWeight: 500,
              color: "#6366F1",
              lineHeight: "16px",
            }}
          >
            Learner
          </span>
        </div>
      </div>
    </aside>
  );
}

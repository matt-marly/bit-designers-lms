"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Home,
  BookOpen,
  Map,
  Target,
  Radio,
  FolderOpen,
  Library,
  Users,
  LayoutDashboard,
} from "lucide-react";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Avatar } from "@/components/admin/ui";
import { NotificationBell } from "@/components/dashboard/notification-bell";

const navItems = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/learn", label: "Learn", icon: BookOpen },
  { href: "/roadmaps", label: "Paths", icon: Map },
  { href: "/missions", label: "Missions", icon: Target },
  { href: "/live", label: "Live", icon: Radio },
  { href: "/materials", label: "Materials", icon: FolderOpen },
  { href: "/reference", label: "Reference", icon: Library },
  { href: "/community", label: "Community", icon: Users },
] as const;

export function MobileTopBar() {
  const { isAuthenticated } = useConvexAuth();
  const me = useQuery(api.users.me, isAuthenticated ? {} : "skip");

  return (
    <header
      className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-[#242424] bg-[#090909] px-4 md:hidden"
    >
      <Link href="/home" aria-label="Home">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-white.svg"
          alt="BitDesigners Africa"
          style={{ height: 20, width: "auto", display: "block", filter: "brightness(0) invert(1)" }}
        />
      </Link>
      <div className="flex items-center gap-2">
        <NotificationBell />
        <Link href="/profile" aria-label="Your profile" className="rounded-full">
          <Avatar name={me?.user.fullName ?? ""} src={me?.avatarUrl} size={30} />
        </Link>
      </div>
    </header>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const { isAuthenticated } = useConvexAuth();
  const me = useQuery(api.users.me, isAuthenticated ? {} : "skip");

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-[#242424] bg-[#090909] md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex flex-col items-center gap-0.5 border-0 px-2 py-1 outline-none"
              >
                <motion.div
                  animate={{
                    scale: isActive ? 1.15 : 1,
                    color: isActive ? "#6366F1" : "#B5B5B5",
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 28,
                  }}
                >
                  <Icon className="h-5 w-5" />
                </motion.div>
              </Link>
            </li>
          );
        })}
        {me?.hasAdminAccess && (
          <li className="border-l border-[#242424] pl-2">
            <Link
              href="/admin"
              aria-label="Admin"
              className="flex flex-col items-center gap-0.5 border-0 px-2 py-1 text-[#B5B5B5] outline-none"
            >
              <LayoutDashboard className="h-5 w-5" />
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
}

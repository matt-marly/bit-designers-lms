"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Home,
  BookOpen,
  Target,
  Radio,
  FolderOpen,
  Library,
  Users,
} from "lucide-react";

const navItems = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/learn", label: "Learn", icon: BookOpen },
  { href: "/missions", label: "Missions", icon: Target },
  { href: "/live", label: "Live", icon: Radio },
  { href: "/resources", label: "Resources", icon: FolderOpen },
  { href: "/reference", label: "Reference", icon: Library },
  { href: "/community", label: "Community", icon: Users },
] as const;

export function MobileNav() {
  const pathname = usePathname();

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
      </ul>
    </nav>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Sidebar } from "@/components/dashboard/sidebar";
import { MobileNav, MobileTopBar } from "@/components/dashboard/mobile-nav";
import { PageTransition } from "@/components/dashboard/page-transition";
import { CommandPalette } from "@/components/ui/command-palette";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const router = useRouter();
  const { isAuthenticated } = useConvexAuth();
  const me = useQuery(api.users.me, isAuthenticated ? {} : "skip");
  const needsWelcome = me != null && me.user.onboardedAt === undefined;

  const openPalette = useCallback(() => setCommandPaletteOpen(true), []);
  const closePalette = useCallback(() => setCommandPaletteOpen(false), []);

  useEffect(() => {
    if (needsWelcome) router.replace("/welcome");
  }, [needsWelcome, router]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--color-bg-base)" }}>
      <Sidebar onSearchClick={openPalette} />
      <MobileTopBar />
      <MobileNav />

      <main
        role="main"
        aria-label="Main content"
        className="dashboard-main min-h-screen pt-14 pb-20 md:pt-0 md:pb-0 md:ml-[260px]"
        style={{ flex: 1, overflowY: "auto" }}
      >
        <PageTransition>{children}</PageTransition>
      </main>

      <CommandPalette isOpen={commandPaletteOpen} onClose={closePalette} />
    </div>
  );
}

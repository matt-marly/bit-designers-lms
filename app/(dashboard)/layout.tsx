import { Sidebar } from "@/components/dashboard/sidebar";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { PageTransition } from "@/components/dashboard/page-transition";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--color-bg-base)" }}>
      <Sidebar />
      <MobileNav />

      <main
        className="dashboard-main min-h-screen pb-20 md:pb-0 md:ml-[260px]"
        style={{ flex: 1, overflowY: "auto" }}
      >
        <PageTransition>{children}</PageTransition>
      </main>
    </div>
  );
}

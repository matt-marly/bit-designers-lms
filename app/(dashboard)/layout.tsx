import { Sidebar } from "@/components/dashboard/sidebar";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { PageTransition } from "@/components/dashboard/page-transition";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#090909]">
      <Sidebar />
      <MobileNav />

      <main className="min-h-screen pb-20 md:pl-60 md:pb-0">
        <div className="mx-auto max-w-[1200px] px-4 pt-4 pb-4 md:px-6 md:pt-6 md:pb-6">
          <PageTransition>{children}</PageTransition>
        </div>
      </main>
    </div>
  );
}

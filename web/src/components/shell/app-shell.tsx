"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";
import { OfflineBanner } from "./offline-banner";
import { MobileNav } from "./mobile-nav";
import { RouteGuard } from "@/components/security/route-guard";
import { SecurityProvider } from "@/components/security/security-provider";
import { ToastHost } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ux/confirm-dialog";
import { PageViewTracker } from "@/components/monitoring/page-view-tracker";

const CommandPalette = dynamic(
  () => import("@/components/command/command-palette").then((m) => m.CommandPalette),
  { ssr: false },
);

const QuickAddModal = dynamic(
  () => import("@/components/quick-add/quick-add-modal").then((m) => m.QuickAddModal),
  { ssr: false },
);

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isOnboarding = pathname === "/onboarding";

  if (isOnboarding) {
    return <RouteGuard>{children}</RouteGuard>;
  }

  return (
    <RouteGuard>
      <SecurityProvider>
        <div className="flex min-h-screen bg-background">
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <OfflineBanner />
            <TopBar />
            <main
              id="main-content"
              className="flex-1 px-4 py-5 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))] md:px-8 md:py-8 md:pb-8"
              tabIndex={-1}
            >
              {children}
            </main>
          </div>
          <MobileNav />
          <CommandPalette />
          <QuickAddModal />
          <ToastHost />
          <ConfirmDialog />
          <PageViewTracker />
        </div>
      </SecurityProvider>
    </RouteGuard>
  );
}

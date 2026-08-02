"use client";

import { usePathname } from "next/navigation";
import { TopBar } from "./top-bar";
import { OfflineBanner } from "./offline-banner";
import { MobileNav } from "./mobile-nav";
import { MobileMoreSheet } from "./mobile-more-sheet";
import { MobileFab } from "./mobile-fab";
import { Sidebar } from "./sidebar";
import { RouteGuard } from "@/components/security/route-guard";
import { SecurityProvider } from "@/components/security/security-provider";
import { ToastHost } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ux/confirm-dialog";
import { PageViewTracker } from "@/components/monitoring/page-view-tracker";
import { CommandPalette } from "@/components/command/command-palette";
import { QuickAddModal } from "@/components/quick-add/quick-add-modal";
import { StatementImportModal } from "@/components/import/statement-import-modal";
import { SalaryCreditModal } from "@/components/salary/salary-credit-modal";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFullBleed = pathname === "/onboarding" || pathname === "/auth";

  if (isFullBleed) {
    return <RouteGuard>{children}</RouteGuard>;
  }

  return (
    <RouteGuard>
      <SecurityProvider>
        <div className="flex h-[100dvh] h-screen overflow-hidden bg-background">
          <Sidebar />
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <OfflineBanner />
            <TopBar />
            <main
              id="main-content"
              className="scroll-premium min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 py-4 pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:px-8 lg:py-8 lg:pb-8"
              tabIndex={-1}
            >
              {children}
            </main>
          </div>
          <MobileFab />
          <MobileNav />
          <MobileMoreSheet />
          <CommandPalette />
          <QuickAddModal />
          <StatementImportModal />
          <SalaryCreditModal />
          <ToastHost />
          <ConfirmDialog />
          <PageViewTracker />
        </div>
      </SecurityProvider>
    </RouteGuard>
  );
}

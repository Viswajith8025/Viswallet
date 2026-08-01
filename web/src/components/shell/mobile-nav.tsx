"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ArrowLeftRight, PiggyBank, Plus, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/design/cn";
import { useUIStore } from "@/lib/store/ui-store";
import { isMobileMoreRoute } from "@/lib/navigation/app-nav";

const TABS = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/transactions", label: "Activity", icon: ArrowLeftRight },
  { href: "__add__", label: "Add", icon: Plus, fab: true },
  { href: "/budgets", label: "Budgets", icon: PiggyBank },
  { href: "__more__", label: "More", icon: LayoutGrid },
] as const;

export function MobileNav() {
  const pathname = usePathname();
  const setQuickAddOpen = useUIStore((s) => s.setQuickAddOpen);
  const mobileMenuOpen = useUIStore((s) => s.mobileMenuOpen);
  const setMobileMenuOpen = useUIStore((s) => s.setMobileMenuOpen);
  const moreActive = mobileMenuOpen || isMobileMoreRoute(pathname);

  return (
    <nav
      className="glass-panel fixed bottom-0 left-0 right-0 z-40 border-t border-border pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label="Main navigation"
    >
      <div className="mx-auto flex h-[4.25rem] max-w-lg items-end justify-around px-1">
        {TABS.map((tab) => {
          if ("fab" in tab && tab.fab) {
            return (
              <button
                key={tab.href}
                type="button"
                onClick={() => setQuickAddOpen(true, "expense")}
                className="flex -translate-y-3 flex-col items-center gap-1"
                aria-label="Add transaction"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-glow transition-transform active:scale-95">
                  <Plus size={24} strokeWidth={2.5} />
                </span>
              </button>
            );
          }

          if (tab.href === "__more__") {
            return (
              <button
                key={tab.href}
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className={cn(
                  "flex min-w-[3.25rem] flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-medium transition-colors",
                  moreActive ? "text-primary" : "text-muted-foreground",
                )}
                aria-label="Open menu"
                aria-expanded={mobileMenuOpen}
              >
                <tab.icon size={20} strokeWidth={moreActive ? 2.25 : 1.75} />
                {tab.label}
              </button>
            );
          }

          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex min-w-[3.25rem] flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <tab.icon size={20} strokeWidth={active ? 2.25 : 1.75} />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

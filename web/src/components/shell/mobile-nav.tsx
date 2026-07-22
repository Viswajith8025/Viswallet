"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ArrowLeftRight, BarChart3, Plus, Settings } from "lucide-react";
import { cn } from "@/lib/design/cn";
import { useUIStore } from "@/lib/store/ui-store";

const TABS = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/transactions", label: "Activity", icon: ArrowLeftRight },
  { href: "__add__", label: "Add", icon: Plus, fab: true },
  { href: "/analytics", label: "Charts", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function MobileNav() {
  const pathname = usePathname();
  const setQuickAddOpen = useUIStore((s) => s.setQuickAddOpen);

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
                aria-label="Quick add transaction"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-glow transition-transform active:scale-95">
                  <Plus size={22} strokeWidth={2.5} />
                </span>
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

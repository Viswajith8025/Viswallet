"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ArrowLeftRight, BarChart3, Ellipsis } from "lucide-react";
import { cn } from "@/lib/design/cn";
import { useUIStore } from "@/lib/store/ui-store";
import { isMobileMoreRoute } from "@/lib/navigation/app-nav";

const TABS = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/transactions", label: "List", icon: ArrowLeftRight },
  { href: "/analytics", label: "Charts", icon: BarChart3 },
  { href: "__more__", label: "More", icon: Ellipsis },
] as const;

export function MobileNav() {
  const pathname = usePathname();
  const mobileMenuOpen = useUIStore((s) => s.mobileMenuOpen);
  const setMobileMenuOpen = useUIStore((s) => s.setMobileMenuOpen);
  const moreActive = mobileMenuOpen || isMobileMoreRoute(pathname);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border-light bg-background/92 pb-[env(safe-area-inset-bottom)] shadow-[0_-1px_0_rgba(45,37,64,0.04)] backdrop-blur-xl backdrop-saturate-150 lg:hidden"
      aria-label="Main navigation"
    >
      <div className="mx-auto flex h-[3.5rem] max-w-lg items-center justify-around px-1">
        {TABS.map((tab) => {
          if (tab.href === "__more__") {
            return (
              <button
                key={tab.href}
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className={cn(
                  "flex min-w-[4rem] flex-col items-center gap-0.5 py-1 text-[11px] font-medium transition-colors duration-[var(--duration-fast)]",
                  moreActive ? "text-[var(--violet)] dark:text-[var(--cream)]" : "text-muted-foreground",
                )}
                aria-label="More pages"
                aria-expanded={mobileMenuOpen}
              >
                <tab.icon size={22} strokeWidth={moreActive ? 2 : 1.75} />
                <span>{tab.label}</span>
              </button>
            );
          }

          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex min-w-[4rem] flex-col items-center gap-0.5 py-1 text-[11px] font-medium transition-colors duration-[var(--duration-fast)]",
                active ? "text-[var(--violet)] dark:text-[var(--cream)]" : "text-muted-foreground",
              )}
            >
              <tab.icon size={22} strokeWidth={active ? 2 : 1.75} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

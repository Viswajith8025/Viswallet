"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeft } from "lucide-react";
import { cn } from "@/lib/design/cn";
import { LogoMark } from "@/components/brand/logo-mark";
import { LegalFooter } from "@/components/legal/legal-footer";
import { useUIStore } from "@/lib/store/ui-store";
import { Button } from "@/components/ui/button";
import { APP_NAV } from "@/lib/navigation/app-nav";

export function Sidebar() {
  const pathname = usePathname();
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const setCollapsed = useUIStore((s) => s.setSidebarCollapsed);

  return (
    <aside
      className={cn(
        "glass-panel hidden h-full shrink-0 flex-col border-r border-border md:flex",
        collapsed ? "w-[68px]" : "w-[248px]",
      )}
    >
      <div
        className={cn(
          "relative flex border-b border-border/60 px-3",
          collapsed ? "h-[4.25rem] flex-col items-center justify-center gap-0.5 py-2" : "h-14 items-center justify-between",
        )}
      >
        {collapsed ? (
          <Link href="/" className="transition-opacity hover:opacity-80" aria-label="Viswallet home">
            <LogoMark size={28} />
          </Link>
        ) : (
          <Link href="/" className="flex min-w-0 items-center gap-2.5 px-1 transition-opacity hover:opacity-80">
            <LogoMark size={30} />
            <p className="truncate font-display text-[15px] font-semibold tracking-[-0.035em]">
              Viswallet
            </p>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 text-muted-foreground"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <PanelLeft size={17} />
        </Button>
      </div>

      <nav className="scroll-premium flex-1 overflow-y-auto p-2">
        {APP_NAV.map((item, i) =>
          "section" in item ? (
            !collapsed && (
              <p
                key={i}
                className="px-3 pb-1 pt-4 text-[11px] font-medium text-muted-foreground/70 first:pt-2"
              >
                {item.section}
              </p>
            )
          ) : (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              title={item.label}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] transition-colors duration-150",
                pathname === item.href
                  ? "bg-foreground/[0.06] font-medium text-foreground"
                  : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground",
                collapsed && "justify-center px-0",
              )}
            >
              <item.icon
                size={17}
                strokeWidth={pathname === item.href ? 2 : 1.75}
                className="shrink-0"
              />
              {!collapsed && item.label}
            </Link>
          ),
        )}
      </nav>
      {!collapsed && (
        <div className="border-t border-border/60 p-3">
          <LegalFooter />
        </div>
      )}
    </aside>
  );
}

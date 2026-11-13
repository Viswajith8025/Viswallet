"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/design/cn";
import { CREW_TABS, MONEY_TABS, isMoneyRoute, navHrefActive } from "@/lib/navigation/app-nav";
import { NavLink } from "@/components/shell/nav-link";

export function HubTabs() {
  const pathname = usePathname();
  const tab = useSearchParams().get("tab");
  const tabs = isMoneyRoute(pathname) ? MONEY_TABS : pathname === "/crew" ? CREW_TABS : null;
  if (!tabs) return null;

  return (
    <div className="sticky top-0 z-20 -mx-4 mb-4 border-b border-hairline bg-bg/95 px-4 backdrop-blur-[12px] lg:-mx-8 lg:px-8">
      <div className="flex gap-1 overflow-x-auto" role="tablist" aria-label={isMoneyRoute(pathname) ? "Money" : "Crew"}>
        {tabs.map((item) => {
          const active = navHrefActive(item.href, pathname, tab);
          return (
            <NavLink
              key={item.href}
              href={item.href}
              motion="nav-tab"
              role="tab"
              aria-selected={active}
              className={cn(
                "shrink-0 border-b-2 px-3 py-3 font-mono text-[11px] uppercase tracking-[0.14em]",
                active ? "border-lime text-ink" : "border-transparent text-ink-2",
              )}
            >
              {item.label}
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}

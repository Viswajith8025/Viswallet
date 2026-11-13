"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { PanelLeft } from "lucide-react";
import { cn } from "@/lib/design/cn";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { LegalFooter } from "@/components/legal/legal-footer";
import { ProfileAvatar } from "@/components/profile/profile-avatar";
import { useUIStore, subscribeSidebar, readSidebarCollapsed } from "@/lib/store/ui-store";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { APP_NAV, navHrefActive } from "@/lib/navigation/app-nav";
import { BRAND_NAME } from "@/lib/brand/constants";
import { NavLink } from "@/components/shell/nav-link";
import { useAuth } from "@/components/providers/auth-provider";
import { getProfile } from "@/lib/db";

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");
  const collapsed = useSyncExternalStore(subscribeSidebar, readSidebarCollapsed, () => false);
  const setCollapsed = useUIStore((s) => s.setSidebarCollapsed);
  const { cloudDown, syncing, cloudSyncReady, configured } = useAuth();
  const [name, setName] = useState("You");

  useEffect(() => {
    getProfile()
      .then((profile) => setName(profile.displayName || "You"))
      .catch(() => setName("You"));
  }, []);

  const sync = cloudDown
    ? { dot: "bg-chili", label: "Sync error" }
    : syncing || (configured && !cloudSyncReady)
      ? { dot: "bg-marigold", label: "Sync pending" }
      : { dot: "bg-lime", label: "Synced" };

  return (
    <aside
      className={cn(
        "hidden h-full shrink-0 flex-col border-r border-hairline bg-sunken transition-[width] duration-[180ms] ease-[cubic-bezier(0.23,1,0.32,1)] lg:flex",
        collapsed ? "w-[72px]" : "w-[248px]",
      )}
      style={{ viewTransitionName: "site-sidebar" }}
      data-shell-nav
    >
      <div
        className={cn(
          "relative flex border-b border-hairline px-3",
          collapsed
            ? "h-[4.25rem] flex-col items-center justify-center gap-0.5 py-2"
            : "h-[4.5rem] items-center justify-between",
        )}
      >
        {collapsed ? (
          <NavLink href="/" motion="nav-tab" className="active:scale-[0.97]" aria-label={`${BRAND_NAME} home`}>
            <BrandLockup markSize={28} markOnly />
          </NavLink>
        ) : (
          <BrandLockup href="/" markSize={30} showTagline taglineClassName="text-[10px]" />
        )}
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 text-ink-2"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <PanelLeft size={17} />
        </Button>
      </div>

      <nav className="scroll-premium flex-1 overflow-y-auto p-2" aria-label="Sections">
        {APP_NAV.map((item) =>
          "section" in item ? (
            !collapsed && (
              <p key={item.section} className="px-3 pb-1 pt-4 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-2 first:pt-2">
                {item.section}
              </p>
            )
          ) : (
            <NavLink
              key={item.href}
              href={item.href}
              prefetch={false}
              title={item.label}
              className={cn(
                "relative flex min-h-11 items-center gap-2.5 rounded-lg px-3 text-[13px] text-ink-2 active:scale-[0.97] [@media(hover:hover)]:hover:text-ink",
                navHrefActive(item.href, pathname, tab) && "text-ink",
                collapsed && "justify-center px-0",
              )}
            >
              {navHrefActive(item.href, pathname, tab) && (
                <span className="absolute bottom-2 left-0 top-2 w-0.5 rounded-full bg-lime" aria-hidden />
              )}
              <item.icon size={17} strokeWidth={navHrefActive(item.href, pathname, tab) ? 2 : 1.75} className="shrink-0" />
              {!collapsed && item.label}
            </NavLink>
          )
        )}
      </nav>

      <div className={cn("border-t border-hairline p-3", collapsed && "px-2")}>
        <NavLink
          href="/profile"
          motion="nav-forward"
          className={cn("flex min-h-11 items-center gap-2.5 rounded-lg active:scale-[0.97]", collapsed && "justify-center")}
          title={name}
        >
          <ProfileAvatar displayName={name} size="md" />
          {!collapsed && (
            <span className="min-w-0">
              <span className="block truncate text-[13px] text-ink">{name}</span>
              <span className="flex items-center gap-1.5 font-mono text-[11px] text-ink-2">
                <span className={cn("h-1.5 w-1.5 rounded-full", sync.dot)} aria-hidden />
                {sync.label}
              </span>
            </span>
          )}
        </NavLink>
        <div id="install-button-slot" className="mt-2 empty:hidden" />
        {!collapsed && (
          <div className="mt-3">
            <LegalFooter />
          </div>
        )}
      </div>
    </aside>
  );
}

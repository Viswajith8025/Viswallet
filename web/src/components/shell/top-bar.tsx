"use client";

import { Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/shell/notification-bell";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import { useUIStore } from "@/lib/store/ui-store";
import { pageMeta } from "@/lib/navigation/app-nav";

export function TopBar({ scrolled }: { scrolled: boolean }) {
  return (
    <Suspense fallback={<TopBarFrame scrolled={scrolled} title="Home" group="Home" />}>
      <TopBarInner scrolled={scrolled} />
    </Suspense>
  );
}

function TopBarInner({ scrolled }: { scrolled: boolean }) {
  const pathname = usePathname();
  const tab = useSearchParams().get("tab");
  const meta = pageMeta(pathname, tab);
  return <TopBarFrame scrolled={scrolled} title={meta.title} group={meta.group} />;
}

function TopBarFrame({
  scrolled,
  title,
  group,
}: {
  scrolled: boolean;
  title: string;
  group: string;
}) {
  const setCommandOpen = useUIStore((s) => s.setCommandOpen);
  const setQuickAddOpen = useUIStore((s) => s.setQuickAddOpen);

  return (
    <header
      className={`z-30 shrink-0 bg-bg/95 pt-[env(safe-area-inset-top)] backdrop-blur-[12px] ${scrolled ? "border-b border-hairline" : "border-b border-transparent"}`}
      style={{ viewTransitionName: "site-header" }}
    >
      <div className="flex h-14 items-center gap-2 px-4 lg:gap-3 lg:px-6">
        <p className="min-w-0 truncate font-display text-[20px] font-semibold text-ink lg:hidden">{title}</p>

        <p className="hidden min-w-0 items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-2 lg:flex">
          <span>{group}</span>
          <span aria-hidden>/</span>
          <span className="text-ink">{title}</span>
        </p>

        <button
          type="button"
          onClick={() => setCommandOpen(true)}
          className="ml-auto hidden h-11 min-w-0 flex-1 items-center gap-2 rounded-lg border border-hairline bg-surface px-3 text-sm text-ink-2 lg:flex lg:max-w-sm"
          aria-label="Open command palette"
        >
          <Search size={15} className="shrink-0" />
          <span className="truncate">Search</span>
          <kbd className="ml-auto rounded border border-hairline px-1.5 py-0.5 font-mono text-[11px]">⌘K</kbd>
        </button>

        <div className="ml-auto flex items-center gap-1 lg:ml-0">
          <button
            type="button"
            onClick={() => setCommandOpen(true)}
            className="flex h-11 w-11 items-center justify-center text-ink-2 active:scale-[0.97] lg:hidden"
            aria-label="Search"
          >
            <Search size={20} strokeWidth={1.75} />
          </button>
          <NotificationBell />
          <div className="hidden lg:block">
            <ThemeToggle />
          </div>
          <Button onClick={() => setQuickAddOpen(true, "expense")} size="sm" className="hidden h-11 lg:inline-flex">
            <Plus size={15} />
            Add
          </Button>
        </div>
      </div>
    </header>
  );
}

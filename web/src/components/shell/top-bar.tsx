"use client";

import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/brand/logo-mark";
import { NotificationBell } from "@/components/shell/notification-bell";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import { useUIStore } from "@/lib/store/ui-store";

export function TopBar() {
  const setCommandOpen = useUIStore((s) => s.setCommandOpen);
  const setQuickAddOpen = useUIStore((s) => s.setQuickAddOpen);

  return (
    <header className="sticky top-0 z-30 flex h-12 shrink-0 items-center gap-2 border-b border-border/50 bg-background px-4 pt-[env(safe-area-inset-top)] lg:h-14 lg:gap-3 lg:border-border/60 lg:px-6">
      <Link
        href="/"
        className="flex shrink-0 items-center gap-2 lg:hidden"
        aria-label="Viswallet home"
      >
        <LogoMark size={26} />
      </Link>

      <button
        type="button"
        onClick={() => setCommandOpen(true)}
        className="hidden h-9 min-w-0 flex-1 items-center gap-2 rounded-md border border-border-light bg-surface-secondary/50 px-3 text-sm text-muted-foreground transition-colors hover:border-border hover:text-foreground lg:flex lg:max-w-sm"
        aria-label="Open command palette"
      >
        <Search size={15} className="shrink-0 opacity-60" />
        <span className="truncate">Search</span>
        <kbd className="ml-auto rounded border border-border bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
          ⌘K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-0.5 lg:gap-2">
        <button
          type="button"
          onClick={() => setCommandOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground lg:hidden"
          aria-label="Search"
        >
          <Search size={20} strokeWidth={1.75} />
        </button>
        <NotificationBell />
        <ThemeToggle />
        <Button
          onClick={() => setQuickAddOpen(true, "expense")}
          size="sm"
          className="hidden lg:inline-flex"
        >
          <Plus size={15} />
          Add
        </Button>
      </div>
    </header>
  );
}

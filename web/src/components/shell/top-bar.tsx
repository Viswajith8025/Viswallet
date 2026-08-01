"use client";

import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/brand/logo-mark";
import { NotificationBell } from "@/components/shell/notification-bell";
import { useUIStore } from "@/lib/store/ui-store";

export function TopBar() {
  const setCommandOpen = useUIStore((s) => s.setCommandOpen);
  const setQuickAddOpen = useUIStore((s) => s.setQuickAddOpen);

  return (
    <header className="glass-panel sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border/60 px-4 pt-[env(safe-area-inset-top)] md:gap-3 md:px-6">
      <Link
        href="/"
        className="flex shrink-0 items-center gap-2 md:hidden"
        aria-label="Viswallet home"
      >
        <LogoMark size={28} />
        <span className="font-display text-[15px] font-semibold tracking-tight">Viswallet</span>
      </Link>

      <button
        type="button"
        onClick={() => setCommandOpen(true)}
        className="hidden h-9 min-w-0 flex-1 items-center gap-2 rounded-md border border-border-light bg-background/80 px-3 text-sm text-muted-foreground transition-colors hover:border-border hover:text-foreground md:flex md:max-w-sm"
        aria-label="Open command palette"
      >
        <Search size={15} className="shrink-0 opacity-60" />
        <span className="truncate">Search</span>
        <kbd className="ml-auto rounded border border-border bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
          ⌘K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-1 md:gap-2">
        <button
          type="button"
          onClick={() => setCommandOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border-light text-muted-foreground transition-colors hover:border-border hover:text-foreground md:hidden"
          aria-label="Search"
        >
          <Search size={18} />
        </button>
        <NotificationBell />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setQuickAddOpen(true, "expense")}
          className="hidden h-9 w-9 sm:flex md:hidden"
          aria-label="Quick add transaction"
        >
          <Plus size={17} />
        </Button>
        <Button
          onClick={() => setQuickAddOpen(true, "expense")}
          size="sm"
          className="hidden md:inline-flex"
        >
          <Plus size={15} />
          Add
        </Button>
      </div>
    </header>
  );
}

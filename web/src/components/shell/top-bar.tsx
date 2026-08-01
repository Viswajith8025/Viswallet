"use client";

import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/shell/notification-bell";
import { useOptionalAuth } from "@/components/providers/auth-provider";
import { useUIStore } from "@/lib/store/ui-store";

export function TopBar() {
  const setCommandOpen = useUIStore((s) => s.setCommandOpen);
  const setQuickAddOpen = useUIStore((s) => s.setQuickAddOpen);
  const auth = useOptionalAuth();
  const cloudSyncing = auth?.syncing ?? false;

  return (
    <header className="glass-panel sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border/60 px-4 pt-[env(safe-area-inset-top)] md:px-6">
      <button
        type="button"
        onClick={() => setCommandOpen(true)}
        className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-md border border-border-light bg-background/80 px-3 text-sm text-muted-foreground transition-colors hover:border-border hover:text-foreground md:max-w-sm"
        aria-label="Open command palette"
      >
        <Search size={15} className="shrink-0 opacity-60" />
        <span className="truncate">Search</span>
        <kbd className="ml-auto hidden rounded border border-border bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground md:inline">
          ⌘K
        </kbd>
      </button>

      <div className="flex items-center gap-2">
        {cloudSyncing && (
          <span
            className="hidden text-xs text-muted-foreground sm:inline"
            aria-live="polite"
          >
            Syncing…
          </span>
        )}
        <NotificationBell />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setQuickAddOpen(true, "expense")}
          className="h-9 w-9 sm:hidden"
          aria-label="Quick add transaction"
        >
          <Plus size={17} />
        </Button>
        <Button onClick={() => setQuickAddOpen(true, "expense")} size="sm" className="hidden sm:inline-flex">
          <Plus size={15} />
          Add
        </Button>
      </div>
    </header>
  );
}

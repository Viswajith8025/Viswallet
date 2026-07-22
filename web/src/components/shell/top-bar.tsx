"use client";

import { useRouter } from "next/navigation";
import { Bell, Plus, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/lib/store/ui-store";
import { financeKeys } from "@/lib/queries/use-finance";
import { db } from "@/lib/db";

export function TopBar() {
  const router = useRouter();
  const setCommandOpen = useUIStore((s) => s.setCommandOpen);
  const setQuickAddOpen = useUIStore((s) => s.setQuickAddOpen);

  const { data: unread = 0 } = useQuery({
    queryKey: financeKeys.notificationsUnread,
    queryFn: async () => db.notifications.filter((n) => !n.read).count(),
  });

  return (
    <header className="glass-panel sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b border-border/60 px-3 pt-[env(safe-area-inset-top)] md:h-16 md:gap-3 md:px-6">
      <button
        type="button"
        onClick={() => setCommandOpen(true)}
        className="group flex h-10 min-w-0 flex-1 items-center gap-2 rounded-lg border border-border-light bg-elevated/80 px-3 text-sm text-muted-foreground shadow-xs transition-all duration-200 hover:border-primary/25 hover:bg-elevated md:max-w-md"
        aria-label="Open command palette"
      >
        <Search size={16} className="shrink-0 text-muted-foreground/70 transition-colors group-hover:text-primary" />
        <span className="truncate">Search or jump to...</span>
        <kbd className="ml-auto hidden items-center gap-0.5 rounded-md border border-border bg-muted/80 px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground md:inline-flex">
          <span className="text-[9px]">⌘</span>K
        </kbd>
      </button>

      <div className="flex items-center gap-1.5 sm:gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push("/notifications")}
          className="relative"
          aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ""}`}
        >
          <Bell size={17} />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground ring-2 ring-background">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setQuickAddOpen(true, "expense")}
          className="sm:hidden"
          aria-label="Quick add transaction"
        >
          <Plus size={17} />
        </Button>
        <Button onClick={() => setQuickAddOpen(true, "expense")} className="hidden sm:inline-flex">
          <Plus size={16} />
          Quick add
        </Button>
      </div>
    </header>
  );
}

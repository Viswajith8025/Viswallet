"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AppNotification } from "@/lib/db/types";
import {
  useNotificationsList,
  useUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/hooks/use-notifications";
import { syncDynamicNotifications } from "@/lib/notifications/sync";
import { cn } from "@/lib/design/cn";

const typeTone: Record<AppNotification["type"], string> = {
  info: "bg-primary/12 text-primary",
  warning: "bg-warning/12 text-warning",
  success: "bg-success/12 text-success",
  bill: "bg-destructive/12 text-destructive",
  emi: "bg-primary/12 text-primary",
  insight: "bg-muted text-foreground",
  goal: "bg-success/12 text-success",
  duplicate: "bg-warning/12 text-warning",
  subscription: "bg-primary/12 text-primary",
};

export function NotificationBell() {
  const router = useRouter();
  const unread = useUnreadNotificationCount();
  const notifications = useNotificationsList();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const items = (notifications ?? []).slice(0, 6);
  const isLoading = notifications === undefined;

  useEffect(() => {
    if (!open) return;
    void syncDynamicNotifications();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  async function openNotification(notification: AppNotification) {
    if (!notification.read && notification.id != null) {
      await markNotificationRead(notification.id);
    }
    setOpen(false);
    if (notification.href) {
      router.push(notification.href);
      return;
    }
    router.push("/notifications");
  }

  return (
    <div ref={panelRef} className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen((prev) => !prev)}
        className="relative h-9 w-9"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ""}`}
      >
        <Bell size={17} />
        {unread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-destructive-foreground ring-2 ring-background">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </Button>

      {open ? (
        <div
          role="dialog"
          aria-label="Recent notifications"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-border bg-elevated/98 shadow-lg backdrop-blur-md"
        >
          <div className="flex items-center justify-between border-b border-border-light px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-foreground">Notifications</p>
              <p className="text-xs text-muted-foreground">
                {unread > 0 ? `${unread} unread` : "You're all caught up"}
              </p>
            </div>
            {unread > 0 ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={() => void markAllNotificationsRead()}
              >
                <CheckCheck size={14} />
                Mark all
              </Button>
            ) : null}
          </div>

          <div className="scroll-premium max-h-80 overflow-y-auto">
            {isLoading ? (
              <p className="px-4 py-6 text-sm text-muted-foreground">Loading alerts…</p>
            ) : items.length === 0 ? (
              <p className="px-4 py-6 text-sm text-muted-foreground">
                Bills, subscriptions, and spending alerts will appear here.
              </p>
            ) : (
              <ul className="divide-y divide-border-light">
                {items.map((notification) => (
                  <li key={notification.id}>
                    <button
                      type="button"
                      onClick={() => void openNotification(notification)}
                      className={cn(
                        "flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-foreground/[0.03]",
                        !notification.read && "bg-foreground/[0.02]",
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold uppercase",
                          typeTone[notification.type],
                        )}
                      >
                        {notification.type.slice(0, 2)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className={cn(
                            "block truncate text-sm",
                            notification.read ? "text-muted-foreground" : "font-medium text-foreground",
                          )}
                        >
                          {notification.title}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-muted-foreground">{notification.body}</span>
                        <span className="mt-1 block text-[11px] text-muted-foreground/80">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </span>
                      </span>
                      {!notification.read ? (
                        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden />
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-t border-border-light p-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-full justify-center text-xs"
              onClick={() => {
                setOpen(false);
                router.push("/notifications");
              }}
            >
              View all notifications
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

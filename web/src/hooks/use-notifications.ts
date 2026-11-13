"use client";

import { useEffect, useState } from "react";
import { liveQuery } from "dexie";
import { db } from "@/lib/db";
import type { AppNotification } from "@/lib/db/types";
import { emitNotificationsChanged } from "@/lib/notifications/bus";
import { syncDynamicNotifications } from "@/lib/notifications/sync";

let inboxSynced = false;

export function unreadNotificationCount(items: Array<{ read?: boolean }>): number {
  return items.filter((item) => item.read !== true).length;
}

export function useUnreadNotificationCount(): number {
  const items = useNotificationsList();
  if (!items) return 0;
  return unreadNotificationCount(items);
}

export function useNotificationsList(): AppNotification[] | undefined {
  const [items, setItems] = useState<AppNotification[] | undefined>(undefined);

  useEffect(() => {
    if (!inboxSynced) {
      inboxSynced = true;
      void syncDynamicNotifications();
    }
    const sub = liveQuery(() => db.notifications.orderBy("createdAt").reverse().toArray()).subscribe({
      next: setItems,
      error: (err) => console.error("Notifications list failed:", err),
    });
    return () => sub.unsubscribe();
  }, []);

  return items;
}

export async function markNotificationRead(id: number): Promise<void> {
  await db.notifications.update(id, { read: true });
  emitNotificationsChanged();
}

export async function markAllNotificationsRead(): Promise<void> {
  const unread = await db.notifications.filter((n) => n.read !== true).toArray();
  await Promise.all(
    unread.map((n) => (n.id != null ? db.notifications.update(n.id, { read: true }) : Promise.resolve())),
  );
  emitNotificationsChanged();
}

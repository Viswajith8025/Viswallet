"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Bell, CheckCheck } from "lucide-react";
import { PageHeader, EmptyState, StatCard } from "@/components/ui/page";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDb } from "@/components/providers/db-provider";
import { db } from "@/lib/db";
import type { AppNotification } from "@/lib/db/types";

export default function NotificationsPage() {
  const { version, refresh } = useDb();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    db.notifications.orderBy("createdAt").reverse().toArray().then(setNotifications);
  }, [version]);

  const unread = notifications.filter((n) => !n.read).length;

  async function markRead(id: number) {
    await db.notifications.update(id, { read: true });
    refresh();
  }

  async function markAllRead() {
    const unreadIds = notifications.filter((n) => !n.read && n.id).map((n) => n.id!);
    await Promise.all(unreadIds.map((id) => db.notifications.update(id, { read: true })));
    refresh();
  }

  const typeColor: Record<AppNotification["type"], string> = {
    info: "bg-primary/10 text-primary",
    warning: "bg-destructive/10 text-destructive",
    success: "bg-success/10 text-success",
    bill: "bg-destructive/10 text-destructive",
    emi: "bg-primary/10 text-primary",
    insight: "bg-muted text-foreground",
    goal: "bg-success/10 text-success",
    duplicate: "bg-warning/10 text-warning",
    subscription: "bg-primary/10 text-primary",
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <PageHeader
        title="Notifications"
        description="Reminders and insights from your finances."
        actions={
          unread > 0 ? (
            <Button variant="outline" onClick={markAllRead}>
              <CheckCheck size={16} /> Mark all read
            </Button>
          ) : undefined
        }
      />

      <StatCard label="Unread" value={unread} tone={unread > 0 ? "negative" : "default"} />

      {notifications.length === 0 ? (
        <EmptyState
          title="No notifications"
          description="You'll see bill reminders and insights here."
          action={<Bell size={32} className="mx-auto text-muted-foreground" />}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {notifications.map((n) => {
                const content = (
                  <div className={`flex gap-4 px-5 py-4 ${!n.read ? "bg-primary/5" : ""}`}>
                    <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium capitalize ${typeColor[n.type]}`}>
                      {n.type.slice(0, 2)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`font-medium ${!n.read ? "" : "text-muted-foreground"}`}>{n.title}</p>
                        {!n.read && n.id && (
                          <Button size="sm" variant="ghost" onClick={(e) => { e.preventDefault(); markRead(n.id!); }}>
                            Mark read
                          </Button>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                );
                return (
                  <li key={n.id}>
                    {n.href ? <Link href={n.href}>{content}</Link> : content}
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

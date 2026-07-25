"use client";

import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { CheckCheck } from "lucide-react";
import { PageHeader, EmptyState, StatCard, PageContainer } from "@/components/ui/page";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { AppNotification } from "@/lib/db/types";
import {
  useNotificationsList,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/hooks/use-notifications";

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

export default function NotificationsPage() {
  const router = useRouter();
  const notifications = useNotificationsList();
  const isPending = notifications === undefined;
  const items = notifications ?? [];
  const unread = items.filter((n) => !n.read).length;

  async function openNotification(n: AppNotification) {
    if (!n.read && n.id != null) {
      await markNotificationRead(n.id);
    }
    if (n.href) router.push(n.href);
  }

  return (
    <PageContainer className="max-w-5xl">
      <PageHeader
        title="Notifications"
        description="Live reminders from bills, spending, and goals."
        actions={
          unread > 0 ? (
            <Button variant="outline" onClick={() => void markAllNotificationsRead()}>
              <CheckCheck size={16} /> Mark all read
            </Button>
          ) : undefined
        }
      />

      {isPending ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="space-y-8">
          <StatCard label="Unread" value={unread} tone={unread > 0 ? "negative" : "default"} />

          {items.length === 0 ? (
            <EmptyState
              title="Nothing yet"
              description="Add bills, subscriptions, or transactions — alerts will show up here automatically."
            />
          ) : (
            <Card>
              <CardContent className="p-0">
                <ul className="divide-y divide-border">
                  {items.map((n) => {
                    const row = (
                      <div className={`flex gap-4 px-5 py-4 ${!n.read ? "bg-foreground/[0.03]" : ""}`}>
                        <div
                          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium capitalize ${typeColor[n.type]}`}
                        >
                          {n.type.slice(0, 2)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`font-medium ${!n.read ? "" : "text-muted-foreground"}`}>
                              {n.title}
                            </p>
                            {!n.read && n.id != null && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  void markNotificationRead(n.id!);
                                }}
                              >
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
                        {n.href ? (
                          <button
                            type="button"
                            className="block w-full text-left transition-colors hover:bg-foreground/[0.02]"
                            onClick={() => void openNotification(n)}
                          >
                            {row}
                          </button>
                        ) : (
                          row
                        )}
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </PageContainer>
  );
}

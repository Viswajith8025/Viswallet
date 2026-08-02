"use client";

import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  CreditCard,
  Receipt,
  Repeat,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/money";
import { cn } from "@/lib/design/cn";
import { loadActionItems, type ActionItem, type ActionItemKind } from "@/lib/dashboard/load-action-items";
import { snoozeActionItem } from "@/lib/dashboard/action-snooze";
import { markBorrowedFullyPaid, markLentFullyReturned } from "@/lib/loans/record-loan-payment";
import { markBillPaid } from "@/lib/obligations/mark-bill-paid";
import { markEmiPaid } from "@/lib/obligations/mark-emi-paid";
import { markSubscriptionRenewed } from "@/lib/obligations/mark-subscription-renewed";
import { useInvalidateFinance, useDexieTable } from "@/hooks";
import { showToast } from "@/lib/store/toast-store";
import { useMemo, useState } from "react";

const KIND_META: Record<
  ActionItemKind,
  { icon: typeof Receipt; accent: string; actionLabel: string }
> = {
  borrowed: {
    icon: ArrowDownLeft,
    accent: "text-destructive bg-destructive/10",
    actionLabel: "Mark paid",
  },
  lent: {
    icon: ArrowUpRight,
    accent: "text-success bg-success/10",
    actionLabel: "Mark returned",
  },
  bill: {
    icon: Receipt,
    accent: "text-warning bg-warning/10",
    actionLabel: "Mark paid",
  },
  emi: {
    icon: CreditCard,
    accent: "text-primary bg-primary/10",
    actionLabel: "Pay EMI",
  },
  subscription: {
    icon: Repeat,
    accent: "text-primary bg-primary/10",
    actionLabel: "Mark paid",
  },
};

function ActionRow({
  item,
  busy,
  onAction,
  onPayLater,
}: {
  item: ActionItem;
  busy: boolean;
  onAction: (item: ActionItem) => void;
  onPayLater: (item: ActionItem) => void;
}) {
  const meta = KIND_META[item.kind];
  const Icon = meta.icon;

  return (
    <li
      className={cn(
        "animate-fade-in flex items-center gap-3 rounded-xl border border-border/60 bg-card/80 p-3 transition-all",
        item.urgency === "high" && "border-destructive/30 bg-destructive/[0.04]",
      )}
    >
      <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", meta.accent)}>
        <Icon size={18} strokeWidth={2} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-sm">{item.title}</p>
        <p className="text-xs text-muted-foreground">{item.subtitle}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5 sm:flex-row sm:items-center sm:gap-2">
        <span className="text-sm font-semibold tabular-nums">{formatINR(item.amountPaise)}</span>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            disabled={busy}
            onClick={() => onPayLater(item)}
            className="shrink-0 text-xs"
          >
            Pay later
          </Button>
          <Button
            size="sm"
            variant={item.urgency === "high" ? "primary" : "outline"}
            disabled={busy}
            onClick={() => onAction(item)}
            className="shrink-0 text-xs"
          >
            <Check size={14} className="mr-1" />
            {meta.actionLabel}
          </Button>
        </div>
      </div>
    </li>
  );
}

export function ActionCenter() {
  const invalidate = useInvalidateFinance();
  const { data: items = [], isPending } = useDexieTable("action-items", loadActionItems);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(() => new Set());

  const visibleItems = useMemo(
    () => items.filter((item) => !hiddenIds.has(item.id)),
    [items, hiddenIds],
  );

  function handlePayLater(item: ActionItem) {
    snoozeActionItem(item.id);
    setHiddenIds((prev) => new Set(prev).add(item.id));
    showToast("Reminder postponed until tomorrow", { tone: "info" });
  }

  async function handleAction(item: ActionItem) {
    setBusyId(item.id);
    try {
      if (item.kind === "borrowed") {
        await markBorrowedFullyPaid(item.entityId);
        showToast(`Paid ${formatINR(item.amountPaise)} — added to your expenses`, { tone: "success" });
      } else if (item.kind === "lent") {
        await markLentFullyReturned(item.entityId);
        showToast(`Received ${formatINR(item.amountPaise)} back`, { tone: "success" });
      } else if (item.kind === "bill") {
        await markBillPaid(item.entityId);
        showToast(`${item.title} marked paid — logged as expense`, { tone: "success" });
      } else if (item.kind === "emi") {
        await markEmiPaid(item.entityId);
        showToast(`${item.title} EMI paid — logged as expense`, { tone: "success" });
      } else if (item.kind === "subscription") {
        await markSubscriptionRenewed(item.entityId);
        showToast(`${item.title} renewed — logged as expense`, { tone: "success" });
      }
      await invalidate();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not complete action", { tone: "error" });
    } finally {
      setBusyId(null);
    }
  }

  if (isPending) {
    return (
      <Card>
        <CardContent className="p-5">
          <div className="skeleton h-16 rounded-xl" />
        </CardContent>
      </Card>
    );
  }

  if (visibleItems.length === 0) {
    return (
      <Card className="border-primary/20 bg-primary/[0.03]">
        <CardContent className="flex items-center gap-3 p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Check size={18} />
          </div>
          <div>
            <p className="font-medium text-sm">All clear</p>
            <p className="text-xs text-muted-foreground">
              No bills, subscriptions, borrowed money, or EMI due right now.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const highCount = visibleItems.filter((i) => i.urgency === "high").length;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <div>
          <CardTitle className="text-base">Needs attention</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            {visibleItems.length} item{visibleItems.length !== 1 ? "s" : ""}
            {highCount > 0 && ` · ${highCount} urgent`}
          </p>
        </div>
        <Link
          href="/bills"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          View all
        </Link>
      </CardHeader>
      <CardContent className="pt-0">
        <ul className="space-y-2">
          {visibleItems.slice(0, 5).map((item) => (
            <ActionRow
              key={item.id}
              item={item}
              busy={busyId === item.id}
              onAction={handleAction}
              onPayLater={handlePayLater}
            />
          ))}
        </ul>
        {visibleItems.length > 5 && (
          <p className="mt-3 text-center text-xs text-muted-foreground">
            +{visibleItems.length - 5} more in Bills, Subscriptions, Borrowed, or EMI
          </p>
        )}
      </CardContent>
    </Card>
  );
}

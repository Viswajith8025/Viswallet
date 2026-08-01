"use client";

import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, CalendarClock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatINR } from "@/lib/money";
import { cn } from "@/lib/design/cn";
import { loadLoanDueReminders, type LoanDueReminder } from "@/lib/dashboard/load-loan-due-reminders";
import { formatLoanDueLabel } from "@/lib/loans/loan-due";
import { useDexieTable } from "@/hooks";

function ReminderRow({ item }: { item: LoanDueReminder }) {
  const Icon = item.direction === "borrowed_by_me" ? ArrowDownLeft : ArrowUpRight;
  const isBorrowed = item.direction === "borrowed_by_me";
  const dueLabel = formatLoanDueLabel(
    { expectedReturnAt: item.dueAt },
    item.direction,
  );

  return (
    <li
      className={cn(
        "flex items-center gap-3 rounded-xl border border-border/60 bg-card/80 p-3",
        item.status === "overdue" && "border-destructive/30 bg-destructive/[0.04]",
        item.status === "due_today" && "border-warning/30 bg-warning/[0.04]",
      )}
    >
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
          isBorrowed ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success",
        )}
      >
        <Icon size={16} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {isBorrowed ? `Pay ${item.personName}` : `${item.personName} owes you`}
        </p>
        <p
          className={cn(
            "text-xs",
            item.status === "overdue" && "text-destructive font-medium",
            item.status === "due_today" && "text-warning font-medium",
            item.status === "due_soon" && "text-warning",
            item.status === "upcoming" && "text-muted-foreground",
            item.status === "none" && "text-muted-foreground",
          )}
        >
          {dueLabel}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm font-semibold tabular-nums">{formatINR(item.amountPaise)}</p>
        <Link
          href={item.href}
          className="text-xs text-primary hover:underline"
        >
          Open
        </Link>
      </div>
    </li>
  );
}

export function LoanDueReminders() {
  const { data: reminders = [], isPending } = useDexieTable("loan-due-reminders", loadLoanDueReminders);

  if (isPending) {
    return (
      <Card>
        <CardContent className="p-5">
          <div className="skeleton h-12 rounded-xl" />
        </CardContent>
      </Card>
    );
  }

  if (reminders.length === 0) return null;

  const overdue = reminders.filter((r) => r.status === "overdue").length;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center gap-2">
          <CalendarClock size={18} className="text-muted-foreground" />
          <div>
            <CardTitle className="text-base">Lent & borrowed</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {reminders.length} open · {overdue > 0 ? `${overdue} overdue` : "due dates"}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ul className="space-y-2">
          {reminders.map((item) => (
            <ReminderRow key={item.id} item={item} />
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

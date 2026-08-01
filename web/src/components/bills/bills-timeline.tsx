"use client";

import { format, isPast, startOfDay } from "date-fns";
import { Check, Pencil, Trash2 } from "lucide-react";
import type { Bill } from "@/lib/db/types";
import { formatINR } from "@/lib/money";
import { computeBillStatus } from "@/lib/bills/status";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/design/cn";

type BillsTimelineProps = {
  bills: Bill[];
  onMarkPaid: (id: number) => void;
  onEdit: (bill: Bill) => void;
  onDelete: (id: number) => void;
  payingId?: number | null;
};

function groupLabel(due: Date): string {
  const today = startOfDay(new Date());
  const dueDay = startOfDay(due);
  if (isPast(dueDay) && dueDay < today) return "Overdue";
  if (dueDay.getTime() === today.getTime()) return "Due today";
  const diff = Math.ceil((dueDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff <= 7) return "This week";
  if (diff <= 14) return "Next week";
  return format(due, "MMMM yyyy");
}

export function BillsTimeline({ bills, onMarkPaid, onEdit, onDelete, payingId }: BillsTimelineProps) {
  const unpaid = bills.filter((b) => computeBillStatus(b) !== "paid");
  const paid = bills.filter((b) => computeBillStatus(b) === "paid");

  const groups = new Map<string, Bill[]>();
  for (const bill of unpaid) {
    const label = groupLabel(new Date(bill.dueAt));
    const list = groups.get(label) ?? [];
    list.push(bill);
    groups.set(label, list);
  }

  if (bills.length === 0) return null;

  return (
    <div className="space-y-8">
      {Array.from(groups.entries()).map(([label, groupBills]) => (
        <section key={label} className="animate-fade-in">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-sm font-semibold">{label}</h2>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {groupBills.length}
            </span>
            {label === "Overdue" && (
              <span className="text-xs font-medium text-destructive animate-shimmer-pulse">Action needed</span>
            )}
          </div>
          <div className="relative space-y-2 pl-4">
            <div className="absolute left-1.5 top-2 bottom-2 w-px bg-border" />
            {groupBills.map((bill) => {
              const status = computeBillStatus(bill);
              return (
                <BillTimelineCard
                  key={bill.id}
                  bill={bill}
                  status={status}
                  paying={payingId === bill.id}
                  onMarkPaid={() => bill.id && onMarkPaid(bill.id)}
                  onEdit={() => onEdit(bill)}
                  onDelete={() => bill.id && onDelete(bill.id)}
                />
              );
            })}
          </div>
        </section>
      ))}

      {paid.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Paid recently</h2>
          <div className="space-y-2">
            {paid.slice(0, 5).map((bill) => (
              <div
                key={bill.id}
                className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/20 px-4 py-3 opacity-70"
              >
                <div>
                  <p className="font-medium text-sm">{bill.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Paid {bill.paidAt ? format(new Date(bill.paidAt), "dd MMM") : ""}
                  </p>
                </div>
                <span className="text-sm tabular-nums">{formatINR(bill.amountPaise)}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function BillTimelineCard({
  bill,
  status,
  paying,
  onMarkPaid,
  onEdit,
  onDelete,
}: {
  bill: Bill;
  status: string;
  paying: boolean;
  onMarkPaid: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={cn(
        "relative rounded-xl border bg-card p-4 transition-all surface-interactive",
        status === "overdue" && "border-destructive/30 bg-destructive/[0.03]",
        status === "upcoming" && "border-border/60",
      )}
    >
      <div className="absolute -left-[13px] top-5 h-2.5 w-2.5 rounded-full border-2 border-background bg-primary" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{bill.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Due {format(new Date(bill.dueAt), "EEE, dd MMM")}
            {bill.isRecurring && " · Recurring"}
          </p>
        </div>
        <p className="text-lg font-bold tabular-nums shrink-0">{formatINR(bill.amountPaise)}</p>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" disabled={paying} onClick={onMarkPaid}>
          <Check size={14} className="mr-1" />
          {paying ? "Saving…" : "Mark paid"}
        </Button>
        <Button size="icon" variant="ghost" onClick={onEdit} aria-label="Edit">
          <Pencil size={14} />
        </Button>
        <Button size="icon" variant="ghost" onClick={onDelete} aria-label="Delete">
          <Trash2 size={14} className="text-destructive" />
        </Button>
      </div>
    </div>
  );
}

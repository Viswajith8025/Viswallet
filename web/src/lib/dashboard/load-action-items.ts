import { addDays, isBefore, startOfDay } from "date-fns";
import { db } from "@/lib/db";
import { computeBillStatus } from "@/lib/bills/status";
import { formatLoanDueLabel, getLoanDueStatus } from "@/lib/loans/loan-due";
import { isActionItemSnoozed } from "@/lib/dashboard/action-snooze";

export type ActionItemKind = "borrowed" | "bill" | "emi" | "lent" | "subscription";

export type ActionItem = {
  id: string;
  kind: ActionItemKind;
  entityId: number;
  title: string;
  subtitle?: string;
  amountPaise: number;
  href: string;
  urgency: "high" | "medium" | "low";
};

export async function loadActionItems(): Promise<ActionItem[]> {
  const [loans, bills, emis, subscriptions] = await Promise.all([
    db.loans.filter((l) => !l.isDeleted && l.status !== "returned").toArray(),
    db.bills.toArray(),
    db.emis.filter((e) => e.isActive).toArray(),
    db.subscriptions.filter((s) => s.isActive && Boolean(s.nextRenewalAt)).toArray(),
  ]);

  const items: ActionItem[] = [];
  const today = startOfDay(new Date());
  const weekOut = addDays(today, 7);

  for (const loan of loans) {
    const dueStatus = getLoanDueStatus(loan);
    const dueSubtitle = formatLoanDueLabel(loan, loan.direction);
    const urgency =
      dueStatus === "overdue"
        ? "high"
        : dueStatus === "due_today" || dueStatus === "due_soon"
          ? "medium"
          : loan.direction === "borrowed_by_me" && loan.balancePaise > 50_000_00
            ? "medium"
            : "low";

    if (loan.direction === "borrowed_by_me") {
      items.push({
        id: `borrowed-${loan.id}`,
        kind: "borrowed",
        entityId: loan.id!,
        title: `Pay back ${loan.personName}`,
        subtitle: loan.reason ? `${dueSubtitle} · ${loan.reason}` : dueSubtitle,
        amountPaise: loan.balancePaise,
        href: "/borrowed",
        urgency,
      });
    } else {
      items.push({
        id: `lent-${loan.id}`,
        kind: "lent",
        entityId: loan.id!,
        title: `${loan.personName} owes you`,
        subtitle: loan.reason ? `${dueSubtitle} · ${loan.reason}` : dueSubtitle,
        amountPaise: loan.balancePaise,
        href: "/loans",
        urgency,
      });
    }
  }

  for (const bill of bills) {
    const status = computeBillStatus(bill);
    if (status === "paid") continue;
    const due = startOfDay(new Date(bill.dueAt));
    const overdue = isBefore(due, today);
    items.push({
      id: `bill-${bill.id}`,
      kind: "bill",
      entityId: bill.id!,
      title: bill.name,
      subtitle: overdue ? "Past due" : "Coming up",
      amountPaise: bill.amountPaise,
      href: "/bills",
      urgency: overdue ? "high" : isBefore(due, weekOut) ? "medium" : "low",
    });
  }

  for (const emi of emis) {
    const due = startOfDay(new Date(emi.nextDueAt));
    const overdue = isBefore(due, today);
    if (!overdue && !isBefore(due, weekOut)) continue;
    items.push({
      id: `emi-${emi.id}`,
      kind: "emi",
      entityId: emi.id!,
      title: emi.name,
      subtitle: overdue ? "Past due" : `From ${emi.lender}`,
      amountPaise: emi.emiAmountPaise,
      href: "/emi",
      urgency: overdue ? "high" : "medium",
    });
  }

  for (const sub of subscriptions) {
    if (!sub.nextRenewalAt) continue;
    const renew = startOfDay(new Date(sub.nextRenewalAt));
    const overdue = isBefore(renew, today);
    if (!overdue && !isBefore(renew, weekOut)) continue;
    items.push({
      id: `subscription-${sub.id}`,
      kind: "subscription",
      entityId: sub.id!,
      title: sub.name,
      subtitle: overdue ? "Past due" : "Renews soon",
      amountPaise: sub.amountPaise,
      href: "/subscriptions",
      urgency: overdue ? "high" : "medium",
    });
  }

  const urgencyOrder = { high: 0, medium: 1, low: 2 };
  return items
    .filter((item) => !isActionItemSnoozed(item.id))
    .sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);
}

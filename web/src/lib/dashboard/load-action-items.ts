import { addDays, isBefore, startOfDay } from "date-fns";
import { db } from "@/lib/db";
import { computeBillStatus } from "@/lib/bills/status";

export type ActionItemKind = "borrowed" | "bill" | "emi" | "lent";

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
  const [loans, bills, emis] = await Promise.all([
    db.loans.filter((l) => !l.isDeleted && l.status !== "returned").toArray(),
    db.bills.toArray(),
    db.emis.filter((e) => e.isActive).toArray(),
  ]);

  const items: ActionItem[] = [];
  const today = startOfDay(new Date());
  const weekOut = addDays(today, 7);

  for (const loan of loans) {
    if (loan.direction === "borrowed_by_me") {
      items.push({
        id: `borrowed-${loan.id}`,
        kind: "borrowed",
        entityId: loan.id!,
        title: `Pay back ${loan.personName}`,
        subtitle: loan.reason ?? "Borrowed money",
        amountPaise: loan.balancePaise,
        href: "/borrowed",
        urgency: loan.balancePaise > 50_000_00 ? "high" : "medium",
      });
    } else {
      items.push({
        id: `lent-${loan.id}`,
        kind: "lent",
        entityId: loan.id!,
        title: `${loan.personName} owes you`,
        subtitle: loan.reason ?? "Waiting for return",
        amountPaise: loan.balancePaise,
        href: "/loans",
        urgency: "low",
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
      subtitle: overdue ? "Overdue" : "Due soon",
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
      subtitle: overdue ? "EMI overdue" : `Due ${emi.lender}`,
      amountPaise: emi.emiAmountPaise,
      href: "/emi",
      urgency: overdue ? "high" : "medium",
    });
  }

  const urgencyOrder = { high: 0, medium: 1, low: 2 };
  return items.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);
}

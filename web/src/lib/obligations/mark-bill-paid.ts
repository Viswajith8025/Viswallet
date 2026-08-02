import { isPast, startOfDay } from "date-fns";
import { db, getSettings } from "@/lib/db";
import { emitDbDataChanged } from "@/lib/notifications/bus";
import { getCategoryIdBySlug } from "@/lib/obligations/category-lookup";
import { resolveTransactionTitle } from "@/lib/transactions/resolve-title";
import { getMonthKey } from "@/lib/salary-cycle";
import { setLastCategoryId, setLastPaymentMethod } from "@/lib/ux/defaults";

export type MarkBillPaidResult = {
  transactionId?: number;
  nextBillId?: number;
};

/** Mark a bill paid, log expense, and roll recurring bills forward — atomic + idempotent. */
export async function markBillPaid(billId: number): Promise<MarkBillPaidResult> {
  const bill = await db.bills.get(billId);
  if (!bill) throw new Error("Bill not found.");
  if (bill.status === "paid") {
    return { transactionId: undefined, nextBillId: undefined };
  }

  const now = new Date();
  const categoryId = await getCategoryIdBySlug("bills");
  const settings = await getSettings();
  const monthKey = getMonthKey(now, settings.salaryDay);
  const title = resolveTransactionTitle(bill.name, undefined, "expense");

  let transactionId: number | undefined;
  let nextBillId: number | undefined;

  await db.transaction("rw", [db.transactions, db.bills], async () => {
    const live = await db.bills.get(billId);
    if (!live || live.status === "paid") return;

    transactionId = (await db.transactions.add({
      kind: "expense",
      title,
      amountPaise: live.amountPaise,
      categoryId,
      paymentMethod: "Auto Debit",
      occurredAt: now,
      monthKey,
      tags: [],
      isRecurring: false,
      isDeleted: false,
      rowVersion: 1,
      createdAt: now,
      updatedAt: now,
    })) as number;

    await db.bills.update(billId, { status: "paid", paidAt: now, updatedAt: now });

    if (live.isRecurring) {
      const nextDue = new Date(live.dueAt);
      nextDue.setMonth(nextDue.getMonth() + 1);
      const status = isPast(startOfDay(nextDue)) ? "overdue" : "upcoming";
      nextBillId = (await db.bills.add({
        name: live.name,
        amountPaise: live.amountPaise,
        dueAt: nextDue,
        status,
        isRecurring: true,
        notes: live.notes,
        createdAt: now,
        updatedAt: now,
      })) as number;
    }
  });

  if (transactionId != null) {
    setLastPaymentMethod("Auto Debit");
    setLastCategoryId("expense", categoryId);
    emitDbDataChanged();
  }

  return { transactionId, nextBillId };
}

import { isPast, startOfDay } from "date-fns";
import { db } from "@/lib/db";
import { emitDbDataChanged } from "@/lib/notifications/bus";
import { getCategoryIdBySlug } from "@/lib/obligations/category-lookup";
import { saveQuickTransaction } from "@/lib/transactions/save-quick-transaction";

export type MarkBillPaidResult = {
  transactionId: number;
  nextBillId?: number;
};

/** Mark a bill paid, log expense, and roll recurring bills forward. */
export async function markBillPaid(billId: number): Promise<MarkBillPaidResult> {
  const bill = await db.bills.get(billId);
  if (!bill) throw new Error("Bill not found.");

  const now = new Date();
  const categoryId = await getCategoryIdBySlug("bills");
  const transactionId = await saveQuickTransaction(
    {
      kind: "expense",
      title: bill.name,
      amountPaise: bill.amountPaise,
      categoryId,
      paymentMethod: "Auto Debit",
      occurredAt: now,
    },
    { allowDuplicate: true },
  );

  await db.bills.update(billId, { status: "paid", paidAt: now, updatedAt: now });

  let nextBillId: number | undefined;
  if (bill.isRecurring) {
    const nextDue = new Date(bill.dueAt);
    nextDue.setMonth(nextDue.getMonth() + 1);
    const status = isPast(startOfDay(nextDue)) ? "overdue" : "upcoming";
    nextBillId = (await db.bills.add({
      name: bill.name,
      amountPaise: bill.amountPaise,
      dueAt: nextDue,
      status,
      isRecurring: true,
      notes: bill.notes,
      createdAt: now,
      updatedAt: now,
    })) as number;
  }

  emitDbDataChanged();
  return { transactionId, nextBillId };
}

import { db } from "@/lib/db";
import { emitDbDataChanged } from "@/lib/notifications/bus";
import { getCategoryIdBySlug } from "@/lib/obligations/category-lookup";
import { saveQuickTransaction } from "@/lib/transactions/save-quick-transaction";

export type MarkBillPaidResult = {
  transactionId?: number;
};

/** Mark a bill paid and log it as an expense in the transaction list. */
export async function markBillPaid(billId: number): Promise<MarkBillPaidResult> {
  const bill = await db.bills.get(billId);
  if (!bill) throw new Error("Bill not found.");

  const now = new Date();
  let transactionId: number | undefined;

  try {
    const categoryId = await getCategoryIdBySlug("bills");
    transactionId = await saveQuickTransaction(
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
  } catch {
    // Bill is still marked paid even if expense logging fails.
  }

  await db.bills.update(billId, { status: "paid", paidAt: now, updatedAt: now });
  emitDbDataChanged();

  return { transactionId };
}

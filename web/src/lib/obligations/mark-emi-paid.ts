import { db } from "@/lib/db";
import { emitDbDataChanged } from "@/lib/notifications/bus";
import { getCategoryIdBySlug } from "@/lib/obligations/category-lookup";
import { saveQuickTransaction } from "@/lib/transactions/save-quick-transaction";

export async function markEmiPaid(emiId: number): Promise<{ transactionId?: number }> {
  const emi = await db.emis.get(emiId);
  if (!emi) throw new Error("EMI not found.");

  const now = new Date();
  let transactionId: number | undefined;

  try {
    const categoryId = await getCategoryIdBySlug("emi");
    transactionId = await saveQuickTransaction(
      {
        kind: "expense",
        title: `${emi.name} EMI`,
        amountPaise: emi.emiAmountPaise,
        categoryId,
        paymentMethod: "Auto Debit",
        occurredAt: now,
      },
      { allowDuplicate: true },
    );
  } catch {
    // EMI is still recorded even if expense logging fails.
  }

  const newBalance = Math.max(0, emi.balancePaise - emi.emiAmountPaise);
  const nextMonth = new Date(emi.nextDueAt);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  await db.emis.update(emiId, {
    balancePaise: newBalance,
    paidMonths: emi.paidMonths + 1,
    nextDueAt: nextMonth,
    isActive: newBalance > 0,
    updatedAt: now,
  });

  emitDbDataChanged();
  return { transactionId };
}

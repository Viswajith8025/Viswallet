import { db, getSettings } from "@/lib/db";
import { emitDbDataChanged } from "@/lib/notifications/bus";
import { getCategoryIdBySlug } from "@/lib/obligations/category-lookup";
import { resolveTransactionTitle } from "@/lib/transactions/resolve-title";
import { getMonthKey } from "@/lib/salary-cycle";
import { setLastCategoryId, setLastPaymentMethod } from "@/lib/ux/defaults";

export async function markEmiPaid(emiId: number): Promise<{ transactionId: number }> {
  const emi = await db.emis.get(emiId);
  if (!emi || !emi.isActive) throw new Error("EMI not found.");

  const now = new Date();
  const categoryId = await getCategoryIdBySlug("emi");
  const settings = await getSettings();
  const monthKey = getMonthKey(now, settings.salaryDay);
  const title = resolveTransactionTitle(`${emi.name} EMI`, undefined, "expense");

  let transactionId!: number;

  await db.transaction("rw", [db.transactions, db.emis], async () => {
    const live = await db.emis.get(emiId);
    if (!live || !live.isActive) throw new Error("EMI not found.");

    transactionId = (await db.transactions.add({
      kind: "expense",
      title,
      amountPaise: live.emiAmountPaise,
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

    const newBalance = Math.max(0, live.balancePaise - live.emiAmountPaise);
    const nextMonth = new Date(live.nextDueAt);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    await db.emis.update(emiId, {
      balancePaise: newBalance,
      paidMonths: live.paidMonths + 1,
      nextDueAt: nextMonth,
      isActive: newBalance > 0,
      updatedAt: now,
    });
  });

  setLastPaymentMethod("Auto Debit");
  setLastCategoryId("expense", categoryId);
  emitDbDataChanged();
  return { transactionId };
}

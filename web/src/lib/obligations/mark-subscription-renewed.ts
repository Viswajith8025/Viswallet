import { addMonths, addWeeks, addYears } from "date-fns";
import { db, getSettings } from "@/lib/db";
import { emitDbDataChanged } from "@/lib/notifications/bus";
import { getCategoryIdBySlug } from "@/lib/obligations/category-lookup";
import { resolveTransactionTitle } from "@/lib/transactions/resolve-title";
import { getMonthKey } from "@/lib/salary-cycle";
import { setLastCategoryId, setLastPaymentMethod } from "@/lib/ux/defaults";
import type { Subscription } from "@/lib/db/types";

function advanceRenewalDate(sub: Subscription, from: Date): Date {
  const base = sub.nextRenewalAt ? new Date(sub.nextRenewalAt) : from;
  if (sub.billingCycle === "weekly") return addWeeks(base, 1);
  if (sub.billingCycle === "yearly") return addYears(base, 1);
  return addMonths(base, 1);
}

/** Log subscription charge as expense and roll renewal date forward. */
export async function markSubscriptionRenewed(subscriptionId: number): Promise<number | undefined> {
  const sub = await db.subscriptions.get(subscriptionId);
  if (!sub || !sub.isActive) throw new Error("Subscription not found.");

  const now = new Date();
  const categoryId = sub.categoryId ?? (await getCategoryIdBySlug("subscriptions"));
  const settings = await getSettings();
  const monthKey = getMonthKey(now, settings.salaryDay);
  const title = resolveTransactionTitle(sub.name, undefined, "expense");
  const paymentMethod = sub.paymentMethod || "Auto Debit";

  let transactionId: number | undefined;

  await db.transaction("rw", [db.transactions, db.subscriptions], async () => {
    transactionId = (await db.transactions.add({
      kind: "expense",
      title,
      amountPaise: sub.amountPaise,
      categoryId,
      paymentMethod,
      occurredAt: now,
      monthKey,
      tags: [],
      isRecurring: true,
      isDeleted: false,
      rowVersion: 1,
      createdAt: now,
      updatedAt: now,
    })) as number;

    await db.subscriptions.update(subscriptionId, {
      nextRenewalAt: advanceRenewalDate(sub, now),
      updatedAt: now,
    });
  });

  setLastPaymentMethod(paymentMethod);
  setLastCategoryId("expense", categoryId);
  emitDbDataChanged();

  return transactionId;
}

import { loadFinanceSnapshot } from "@/lib/engines/finance-snapshot";
import { db } from "@/lib/db/client";

export async function recordMonthlySnapshot(): Promise<void> {
  const data = await loadFinanceSnapshot();
  const savingsRate =
    data.incomePaise > 0
      ? Math.round(((data.incomePaise - data.expensePaise) / data.incomePaise) * 100)
      : 0;

  const existing = await db.monthlySnapshots.where("monthKey").equals(data.monthKey).first();
  const payload = {
    monthKey: data.monthKey,
    incomePaise: data.incomePaise,
    expensePaise: data.expensePaise,
    netWorthPaise: data.netWorthPaise,
    savingsRate,
    recordedAt: new Date(),
  };

  if (existing?.id) {
    await db.monthlySnapshots.update(existing.id, payload);
  } else {
    try {
      await db.monthlySnapshots.add(payload);
    } catch {
      const retry = await db.monthlySnapshots.where("monthKey").equals(data.monthKey).first();
      if (retry?.id) await db.monthlySnapshots.update(retry.id, payload);
    }
  }
}

export async function getNetWorthTrend(months = 12) {
  const snapshots = await db.monthlySnapshots.orderBy("monthKey").reverse().limit(months).toArray();
  return snapshots.reverse();
}

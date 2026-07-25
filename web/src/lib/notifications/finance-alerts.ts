import { formatINR } from "@/lib/money";
import { loadFinanceSnapshot } from "@/lib/engines/finance-snapshot";
import { findDuplicateTransactions } from "@/lib/engines/premium/duplicate-detector";
import { db, pushNotification } from "@/lib/db/client";

async function hasRecentNotification(title: string, hours = 24): Promise<boolean> {
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
  const existing = await db.notifications
    .filter((n) => n.title === title && new Date(n.createdAt) > cutoff)
    .first();
  return Boolean(existing);
}

/** Alerts derived from live finance data (spend pace, runway, duplicates). */
export async function runFinanceNotifications(): Promise<void> {
  const settings = await db.settings.get(1);
  if (!settings?.onboardingComplete) return;

  const data = await loadFinanceSnapshot();

  if (data.incomePaise > 0 && data.expensePaise > data.incomePaise * 0.85) {
    const title = "Spending is high this cycle";
    if (!(await hasRecentNotification(title, 48))) {
      await pushNotification({
        type: "warning",
        title,
        body: `You've used ${Math.round((data.expensePaise / data.incomePaise) * 100)}% of income. ${formatINR(data.remainingPaise)} left.`,
        href: "/insights",
      });
    }
  }

  if (data.incomePaise > 0 && data.remainingPaise < 0) {
    const title = "Over budget this cycle";
    if (!(await hasRecentNotification(title, 48))) {
      await pushNotification({
        type: "warning",
        title,
        body: `Spending exceeds income by ${formatINR(Math.abs(data.remainingPaise))}.`,
        href: "/budgets",
      });
    }
  }

  if (data.daysLeft > 0 && data.daysLeft <= 3 && data.incomePaise > 0) {
    const title = "Salary cycle ending soon";
    if (!(await hasRecentNotification(title, 72))) {
      await pushNotification({
        type: "info",
        title,
        body: `${data.daysLeft} day${data.daysLeft === 1 ? "" : "s"} left — ${formatINR(data.remainingPaise)} still available.`,
        href: "/",
      });
    }
  }

  if (
    data.incomePaise > 0 &&
    data.daysLeft > 2 &&
    data.remainingPaise > 0 &&
    data.remainingPaise < data.incomePaise * 0.15
  ) {
    const title = "Running low this cycle";
    if (!(await hasRecentNotification(title, 48))) {
      await pushNotification({
        type: "insight",
        title,
        body: `${formatINR(data.remainingPaise)} left with ${data.daysLeft} days to go (~${formatINR(data.safeSpendDaily)}/day).`,
        href: "/",
      });
    }
  }

  const dupes = findDuplicateTransactions(data.transactions);
  const high = dupes.find((g) => g.confidence === "high");
  if (high) {
    const title = "Possible duplicate expense";
    if (!(await hasRecentNotification(title, 168))) {
      await pushNotification({
        type: "duplicate",
        title,
        body: `${high.transactions.length} similar transactions: "${high.transactions[0]?.title ?? "Unknown"}".`,
        href: "/transactions",
      });
    }
  }
}

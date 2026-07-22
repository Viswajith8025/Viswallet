import { addDays, differenceInDays, isBefore, startOfDay } from "date-fns";
import { db, pushNotification } from "@/lib/db/client";

async function hasRecentNotification(title: string, hours = 24): Promise<boolean> {
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
  const existing = await db.notifications
    .filter((n) => n.title === title && new Date(n.createdAt) > cutoff)
    .first();
  return Boolean(existing);
}

export async function runNotificationScheduler(): Promise<void> {
  const now = startOfDay(new Date());
  const settings = await db.settings.get(1);

  const bills = await db.bills.filter((b) => b.status !== "paid").toArray();
  for (const bill of bills) {
    const due = startOfDay(new Date(bill.dueAt));
    const days = differenceInDays(due, now);
    if (days < 0 && bill.status !== "overdue") {
      await db.bills.update(bill.id!, { status: "overdue", updatedAt: new Date() });
    }
    if (days >= 0 && days <= 3) {
      const title = `Bill due: ${bill.name}`;
      if (!(await hasRecentNotification(title))) {
        await pushNotification({
          type: "bill",
          title,
          body: `Due in ${days === 0 ? "today" : `${days} day(s)`}`,
          href: "/bills",
        });
      }
    }
  }

  const emis = await db.emis.filter((e) => e.isActive).toArray();
  for (const emi of emis) {
    const due = startOfDay(new Date(emi.nextDueAt));
    const days = differenceInDays(due, now);
    if (days >= 0 && days <= 5) {
      const title = `EMI due: ${emi.name}`;
      if (!(await hasRecentNotification(title))) {
        await pushNotification({
          type: "emi",
          title,
          body: `Payment due ${days === 0 ? "today" : `in ${days} day(s)`}`,
          href: "/emi",
        });
      }
    }
  }

  const subs = await db.subscriptions.filter((s) => s.isActive && Boolean(s.nextRenewalAt)).toArray();
  for (const sub of subs) {
    if (!sub.nextRenewalAt) continue;
    const renew = startOfDay(new Date(sub.nextRenewalAt));
    const days = differenceInDays(renew, now);
    if (days >= 0 && days <= 3) {
      const title = `Subscription renews: ${sub.name}`;
      if (!(await hasRecentNotification(title))) {
        await pushNotification({
          type: "subscription",
          title,
          body: `Renews ${days === 0 ? "today" : `in ${days} day(s)`}`,
          href: "/subscriptions",
        });
      }
    }
  }

  if (settings?.lastBackupAt) {
    const daysSinceBackup = differenceInDays(now, startOfDay(new Date(settings.lastBackupAt)));
    if (daysSinceBackup >= 30) {
      const title = "Backup reminder";
      if (!(await hasRecentNotification(title, 168))) {
        await pushNotification({
          type: "warning",
          title,
          body: "It's been over 30 days since your last backup. Export your data in Settings.",
          href: "/settings",
        });
      }
    }
  } else {
    const title = "Create your first backup";
    if (!(await hasRecentNotification(title, 168))) {
      await pushNotification({
        type: "info",
        title,
        body: "Protect your financial data with an encrypted backup.",
        href: "/settings",
      });
    }
  }

  const recurring = await db.transactions
    .filter((t) => !t.isDeleted && t.isRecurring)
    .toArray();
  for (const t of recurring) {
    const occurred = startOfDay(new Date(t.occurredAt));
    const next = addDays(occurred, 30);
    const days = differenceInDays(next, now);
    if (days >= 0 && days <= 2 && isBefore(now, next)) {
      const title = `Recurring reminder: ${t.title}`;
      if (!(await hasRecentNotification(title))) {
        await pushNotification({
          type: "info",
          title,
          body: "This recurring transaction may be due soon.",
          href: "/transactions",
        });
      }
    }
  }
}

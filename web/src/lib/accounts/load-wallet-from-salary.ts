import { db, getSettings } from "@/lib/db";
import { loadFinanceSnapshot } from "@/lib/engines/finance-snapshot";
import { getCategoryIdBySlug } from "@/lib/obligations/category-lookup";
import { emitDbDataChanged } from "@/lib/notifications/bus";
import { getCurrentCycleKey } from "@/lib/salary-cycle";
import { resolveTransactionTitle } from "@/lib/transactions/resolve-title";
import { sanitizeNotes } from "@/lib/security";

export type LoadWalletFromSalaryResult = {
  transactionId: number;
  newWalletBalance: number;
};

/** Load a wallet/pot from salary cycle — expense reduces available, wallet balance goes up. */
export async function loadWalletFromSalary(
  walletAccountId: number,
  amountPaise: number,
  note?: string,
): Promise<LoadWalletFromSalaryResult> {
  if (amountPaise <= 0) {
    throw new Error("Amount must be greater than zero.");
  }

  const wallet = await db.accounts.get(walletAccountId);
  if (!wallet?.isActive) throw new Error("Wallet not found.");
  if (wallet.role === "primary") {
    throw new Error("Pick a backup wallet or savings pot.");
  }

  const settings = await getSettings();
  const monthKey = getCurrentCycleKey(settings.salaryDay);
  const snapshot = await loadFinanceSnapshot(monthKey);

  if (amountPaise > snapshot.remainingPaise) {
    throw new Error(
      `Only ₹${(snapshot.remainingPaise / 100).toFixed(0)} left this salary cycle.`,
    );
  }

  const categoryId = await getCategoryIdBySlug("misc");
  const now = new Date();
  const rawTitle = note?.trim()
    ? `Loaded ${wallet.name} — ${sanitizeNotes(note)}`
    : `Loaded ${wallet.name}`;
  const title = resolveTransactionTitle(rawTitle, undefined, "expense");

  let transactionId!: number;
  let newWalletBalance = 0;

  await db.transaction("rw", [db.accounts, db.transactions], async () => {
    const live = await db.accounts.get(walletAccountId);
    if (!live?.isActive) throw new Error("Wallet not found.");

    transactionId = (await db.transactions.add({
      kind: "expense",
      title,
      amountPaise,
      categoryId,
      accountId: walletAccountId,
      paymentMethod: "Transfer",
      occurredAt: now,
      monthKey,
      tags: ["wallet-load"],
      isRecurring: false,
      isDeleted: false,
      rowVersion: 1,
      createdAt: now,
      updatedAt: now,
    })) as number;

    newWalletBalance = live.balancePaise + amountPaise;
    await db.accounts.update(walletAccountId, {
      balancePaise: newWalletBalance,
      updatedAt: now,
    });
  });

  emitDbDataChanged();
  return { transactionId, newWalletBalance };
}

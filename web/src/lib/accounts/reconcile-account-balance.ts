import { db } from "@/lib/db";
import { emitDbDataChanged } from "@/lib/notifications/bus";

export async function reconcileAccountBalance(
  accountId: number,
  balancePaise: number,
): Promise<void> {
  const account = await db.accounts.get(accountId);
  if (!account?.isActive) throw new Error("Account not found.");
  if (balancePaise < 0) throw new Error("Balance cannot be negative.");

  await db.accounts.update(accountId, {
    balancePaise,
    updatedAt: new Date(),
  });
  emitDbDataChanged();
}

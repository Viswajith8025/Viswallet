import { db } from "@/lib/db";
import { emitDbDataChanged } from "@/lib/notifications/bus";

/** Apply a balance change (negative for expenses, positive for income). */
export async function adjustAccountBalance(accountId: number, deltaPaise: number): Promise<void> {
  const account = await db.accounts.get(accountId);
  if (!account?.isActive) return;

  const balancePaise = Math.max(0, account.balancePaise + deltaPaise);
  await db.accounts.update(accountId, {
    balancePaise,
    updatedAt: new Date(),
  });
  emitDbDataChanged();
}

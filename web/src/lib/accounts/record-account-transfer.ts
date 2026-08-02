import { db } from "@/lib/db";
import { emitDbDataChanged } from "@/lib/notifications/bus";
import { sanitizeNotes } from "@/lib/security";

export type RecordAccountTransferResult = {
  transferId: number;
  fromBalance: number;
  toBalance: number;
};

export async function recordAccountTransfer(
  fromAccountId: number,
  toAccountId: number,
  amountPaise: number,
  note?: string,
): Promise<RecordAccountTransferResult> {
  if (fromAccountId === toAccountId) {
    throw new Error("Choose two different accounts.");
  }
  if (amountPaise <= 0) {
    throw new Error("Amount must be greater than zero.");
  }

  const now = new Date();
  let transferId!: number;
  let fromBalance = 0;
  let toBalance = 0;

  await db.transaction("rw", [db.accounts, db.accountTransfers], async () => {
    const from = await db.accounts.get(fromAccountId);
    const to = await db.accounts.get(toAccountId);
    if (!from?.isActive || !to?.isActive) throw new Error("Account not found.");
    if (from.balancePaise < amountPaise) {
      throw new Error(`Not enough in ${from.name}. Balance is ₹${(from.balancePaise / 100).toFixed(0)}.`);
    }

    fromBalance = from.balancePaise - amountPaise;
    toBalance = to.balancePaise + amountPaise;

    await db.accounts.update(fromAccountId, { balancePaise: fromBalance, updatedAt: now });
    await db.accounts.update(toAccountId, { balancePaise: toBalance, updatedAt: now });

    transferId = (await db.accountTransfers.add({
      fromAccountId,
      toAccountId,
      amountPaise,
      note: note ? sanitizeNotes(note) : undefined,
      transferredAt: now,
      createdAt: now,
    })) as number;
  });

  emitDbDataChanged();
  return { transferId, fromBalance, toBalance };
}

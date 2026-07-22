import type { IndexableType } from "dexie";
import { db } from "../client";
import type { Transaction, TransactionKind } from "../types";
import { assertCategoryExists, assertAccountExists, transactionFingerprint } from "../integrity";
import { DuplicateTransactionError, OptimisticLockError } from "../errors";
import { sanitizeTitle } from "@/lib/security";

/** Uses monthKey index + isDeleted filter (indexed via isDeleted on v5 schema). */
export async function getCycleTransactions(monthKey: string): Promise<Transaction[]> {
  const rows = await db.transactions
    .where("monthKey")
    .equals(monthKey)
    .and((t) => !t.isDeleted)
    .sortBy("occurredAt");
  return rows.reverse();
}

/** Uses isDeleted index — for search / export. */
export async function getActiveTransactions(limit?: number): Promise<Transaction[]> {
  const notDeleted = false as unknown as IndexableType;
  const rows = await db.transactions.where("isDeleted").equals(notDeleted).sortBy("occurredAt");
  const sorted = rows.reverse();
  return limit ? sorted.slice(0, limit) : sorted;
}

export async function countActiveTransactions(): Promise<number> {
  const notDeleted = false as unknown as IndexableType;
  return db.transactions.where("isDeleted").equals(notDeleted).count();
}

export async function getActiveTransactionsByKind(kind: TransactionKind, monthKey?: string): Promise<Transaction[]> {
  if (monthKey) {
    const rows = await db.transactions
      .where("monthKey")
      .equals(monthKey)
      .and((t) => !t.isDeleted && t.kind === kind)
      .toArray();
    return rows.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
  }
  const rows = await db.transactions
    .where("kind")
    .equals(kind)
    .and((t) => !t.isDeleted)
    .sortBy("occurredAt");
  return rows.reverse();
}

export async function findDuplicateCandidate(
  txn: Pick<Transaction, "title" | "amountPaise" | "categoryId" | "occurredAt" | "monthKey">,
  excludeId?: number,
): Promise<Transaction | undefined> {
  const fp = transactionFingerprint(txn);
  const sameCycle = await db.transactions
    .where("monthKey")
    .equals(txn.monthKey)
    .and((t) => !t.isDeleted)
    .toArray();

  return sameCycle.find((t) => {
    if (excludeId && t.id === excludeId) return false;
    return transactionFingerprint(t) === fp;
  });
}

export type AddTransactionInput = Omit<
  Transaction,
  "id" | "isDeleted" | "deletedAt" | "createdAt" | "updatedAt" | "rowVersion"
>;

export async function addTransaction(
  input: AddTransactionInput,
  options: { allowDuplicate?: boolean } = {},
): Promise<number> {
  await assertCategoryExists(input.categoryId);
  if (input.accountId) await assertAccountExists(input.accountId);

  if (!options.allowDuplicate) {
    const dup = await findDuplicateCandidate(input);
    if (dup) throw new DuplicateTransactionError(dup.id);
  }

  const now = new Date();
  return db.transaction("rw", db.transactions, async () => {
    return (await db.transactions.add({
      ...input,
      title: sanitizeTitle(input.title),
      isDeleted: false,
      rowVersion: 1,
      createdAt: now,
      updatedAt: now,
    })) as number;
  });
}

export async function updateTransactionWithLock(
  id: number,
  patch: Partial<Transaction>,
  expectedVersion: number,
): Promise<void> {
  await db.transaction("rw", db.transactions, async () => {
    const current = await db.transactions.get(id);
    if (!current || current.isDeleted) throw new OptimisticLockError();
    if ((current.rowVersion ?? 1) !== expectedVersion) throw new OptimisticLockError();

    if (patch.categoryId) await assertCategoryExists(patch.categoryId);
    if (patch.accountId) await assertAccountExists(patch.accountId);

    await db.transactions.update(id, {
      ...patch,
      ...(patch.title ? { title: sanitizeTitle(patch.title) } : {}),
      rowVersion: expectedVersion + 1,
      updatedAt: new Date(),
    });
  });
}

export async function pruneDeletedTransactions(olderThanDays = 365): Promise<number> {
  const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
  const keys = await db.transactions
    .where("isDeleted")
    .equals(true as unknown as IndexableType)
    .filter((t) => Boolean(t.deletedAt && t.deletedAt < cutoff))
    .primaryKeys();
  await db.transaction("rw", [db.transactions, db.transactionAttachments], async () => {
    for (const id of keys) {
      await db.transactionAttachments.where("transactionId").equals(id as number).delete();
    }
    await db.transactions.bulkDelete(keys);
  });
  return keys.length;
}

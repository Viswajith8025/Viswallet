import { format } from "date-fns";
import { db } from "./client";
import type { Transaction, TransactionKind } from "./types";
import { ReferentialIntegrityError } from "./errors";
import { emitDbDataChanged } from "@/lib/notifications/bus";

function balanceDeltaForTransaction(
  kind: TransactionKind,
  amountPaise: number,
  reverse = false,
): number {
  const sign = kind === "income" ? 1 : -1;
  return reverse ? -sign * amountPaise : sign * amountPaise;
}

export async function applyTransactionAccountDelta(
  accountId: number,
  kind: TransactionKind,
  amountPaise: number,
  reverse = false,
): Promise<void> {
  const account = await db.accounts.get(accountId);
  if (!account?.isActive) return;
  const delta = balanceDeltaForTransaction(kind, amountPaise, reverse);
  await db.accounts.update(accountId, {
    balancePaise: Math.max(0, account.balancePaise + delta),
    updatedAt: new Date(),
  });
}

/** Cascade: soft-delete transaction + remove attachments. */
export async function softDeleteTransaction(id: number): Promise<void> {
  await db.transaction("rw", [db.transactions, db.transactionAttachments, db.accounts], async () => {
    const txn = await db.transactions.get(id);
    if (!txn || txn.isDeleted) return;
    if (txn.accountId) {
      await applyTransactionAccountDelta(txn.accountId, txn.kind, txn.amountPaise, true);
    }
    await db.transactionAttachments.where("transactionId").equals(id).delete();
    await db.transactions.update(id, {
      isDeleted: true,
      deletedAt: new Date(),
      updatedAt: new Date(),
      rowVersion: (txn.rowVersion ?? 1) + 1,
    });
  });
  emitDbDataChanged();
}

/** Cascade: delete loan payments when loan is hard-deleted. */
export async function cascadeDeleteLoan(loanId: number): Promise<void> {
  await db.transaction("rw", [db.loans, db.loanPayments], async () => {
    await db.loanPayments.where("loanId").equals(loanId).delete();
    await db.loans.delete(loanId);
  });
}

/** Cascade: delete budget buckets when plan is removed. */
export async function cascadeDeleteBudgetPlan(planId: number): Promise<void> {
  await db.transaction("rw", [db.budgetPlans, db.budgetBuckets], async () => {
    await db.budgetBuckets.where("planId").equals(planId).delete();
    await db.budgetPlans.delete(planId);
  });
}

export async function assertCategoryExists(categoryId: number): Promise<void> {
  const cat = await db.categories.get(categoryId);
  if (!cat || cat.isDeleted) {
    throw new ReferentialIntegrityError(`Category ${categoryId} does not exist.`);
  }
}

export async function assertAccountExists(accountId: number): Promise<void> {
  const account = await db.accounts.get(accountId);
  if (!account || !account.isActive) {
    throw new ReferentialIntegrityError(`Account ${accountId} does not exist.`);
  }
}

/** Restore a soft-deleted transaction (undo delete). */
export async function restoreTransaction(id: number): Promise<void> {
  await db.transaction("rw", [db.transactions, db.accounts], async () => {
    const txn = await db.transactions.get(id);
    if (!txn || !txn.isDeleted) return;
    if (txn.accountId) {
      await applyTransactionAccountDelta(txn.accountId, txn.kind, txn.amountPaise);
    }
    await db.transactions.update(id, {
      isDeleted: false,
      deletedAt: undefined,
      updatedAt: new Date(),
      rowVersion: (txn.rowVersion ?? 1) + 1,
    });
  });
  emitDbDataChanged();
}

export function transactionFingerprint(t: Pick<Transaction, "title" | "amountPaise" | "categoryId" | "occurredAt">): string {
  const day = format(new Date(t.occurredAt), "yyyy-MM-dd");
  return `${day}|${t.categoryId}|${t.amountPaise}|${t.title.toLowerCase().trim()}`;
}

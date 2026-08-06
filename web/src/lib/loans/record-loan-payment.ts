import { db, getSettings } from "@/lib/db";
import type { Loan } from "@/lib/db/types";
import { emitDbDataChanged } from "@/lib/notifications/bus";
import { applyTransactionAccountDelta, softDeleteTransaction } from "@/lib/db/integrity";
import { getPrimaryAccount } from "@/lib/accounts/resolve-primary-account";
import { getCategoryIdBySlug } from "@/lib/obligations/category-lookup";
import { resolveTransactionTitle } from "@/lib/transactions/resolve-title";
import { getMonthKey } from "@/lib/salary-cycle";
import { setLastCategoryId, setLastPaymentMethod } from "@/lib/ux/defaults";

export type RecordLoanPaymentResult = {
  paymentId: number;
  transactionId?: number;
  newBalance: number;
  fullyPaid: boolean;
};

async function createLentDisbursementExpense(
  personName: string,
  amountPaise: number,
  occurredAt: Date,
  monthKey: string,
  accountId?: number,
): Promise<number> {
  const categoryId = await getCategoryIdBySlug("misc");
  const title = resolveTransactionTitle(`Lent to ${personName}`, undefined, "expense");
  const transactionId = (await db.transactions.add({
    kind: "expense",
    title,
    amountPaise,
    categoryId,
    accountId,
    paymentMethod: "UPI",
    occurredAt,
    monthKey,
    tags: ["lent"],
    isRecurring: false,
    isDeleted: false,
    rowVersion: 1,
    createdAt: occurredAt,
    updatedAt: occurredAt,
  })) as number;
  if (accountId) {
    await applyTransactionAccountDelta(accountId, "expense", amountPaise);
  }
  setLastPaymentMethod("UPI");
  setLastCategoryId("expense", categoryId);
  return transactionId;
}

/** Record a new loan you gave someone — logs an expense so dashboard spending updates. */
export async function createLentLoan(input: {
  personName: string;
  amountPaise: number;
  reason?: string;
  expectedReturnAt?: Date;
}): Promise<number> {
  const now = new Date();
  const settings = await getSettings();
  const monthKey = getMonthKey(now, settings.salaryDay);

  let loanId = 0;
  const primary = await getPrimaryAccount();
  await db.transaction("rw", [db.loans, db.transactions, db.accounts], async () => {
    const disbursementTransactionId = await createLentDisbursementExpense(
      input.personName.trim(),
      input.amountPaise,
      now,
      monthKey,
      primary?.id,
    );
    loanId = (await db.loans.add({
      personName: input.personName.trim(),
      direction: "lent_by_me",
      principalPaise: input.amountPaise,
      balancePaise: input.amountPaise,
      reason: input.reason?.trim() || undefined,
      borrowedAt: now,
      expectedReturnAt: input.expectedReturnAt,
      status: "pending",
      disbursementTransactionId,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    })) as number;
  });

  emitDbDataChanged();
  return loanId;
}

/** Update an existing lent loan; adjusts the linked expense when the principal changes. */
export async function updateLentLoan(
  loanId: number,
  patch: {
    personName: string;
    principalPaise: number;
    balancePaise: number;
    reason?: string;
    expectedReturnAt?: Date;
  },
): Promise<void> {
  const existing = await db.loans.get(loanId);
  if (!existing || existing.isDeleted || existing.direction !== "lent_by_me") {
    throw new Error("Loan not found.");
  }

  const now = new Date();
  const diff = patch.principalPaise - existing.principalPaise;

  await db.transaction("rw", [db.loans, db.transactions, db.accounts], async () => {
    if (diff !== 0 && existing.disbursementTransactionId) {
      const txn = await db.transactions.get(existing.disbursementTransactionId);
      if (txn && !txn.isDeleted) {
        const nextAmount = txn.amountPaise + diff;
        if (nextAmount <= 0) {
          await softDeleteTransaction(existing.disbursementTransactionId);
        } else {
          await db.transactions.update(existing.disbursementTransactionId, {
            amountPaise: nextAmount,
            title: resolveTransactionTitle(`Lent to ${patch.personName.trim()}`, undefined, "expense"),
            updatedAt: now,
          });
          if (txn.accountId && diff !== 0) {
            await applyTransactionAccountDelta(txn.accountId, "expense", diff);
          }
        }
      }
    } else if (diff > 0 && !existing.disbursementTransactionId) {
      const settings = await getSettings();
      const monthKey = getMonthKey(now, settings.salaryDay);
      const primary = await getPrimaryAccount();
      const disbursementTransactionId = await createLentDisbursementExpense(
        patch.personName.trim(),
        patch.principalPaise,
        now,
        monthKey,
        primary?.id,
      );
      await db.loans.update(loanId, { disbursementTransactionId });
    }

    await db.loans.update(loanId, {
      personName: patch.personName.trim(),
      principalPaise: patch.principalPaise,
      balancePaise: patch.balancePaise,
      reason: patch.reason?.trim() || undefined,
      expectedReturnAt: patch.expectedReturnAt,
      updatedAt: now,
    });
  });

  emitDbDataChanged();
}

/** Soft-delete a lent loan and its disbursement expense when still outstanding. */
export async function archiveLentLoan(loanId: number): Promise<void> {
  const loan = await db.loans.get(loanId);
  if (!loan || loan.isDeleted) return;

  await db.transaction("rw", [db.loans, db.transactions], async () => {
    if (loan.disbursementTransactionId) {
      const txn = await db.transactions.get(loan.disbursementTransactionId);
      if (txn && !txn.isDeleted) {
        await softDeleteTransaction(loan.disbursementTransactionId);
      }
    }
    await db.loans.update(loanId, { isDeleted: true, updatedAt: new Date() });
  });

  emitDbDataChanged();
}

/**
 * Record a loan repayment. For borrowed money, also logs an expense.
 * For lent money, optionally logs income when money is returned.
 */
export async function recordLoanPayment(
  loanId: number,
  amountPaise: number,
  options: {
    linkTransaction?: boolean;
    allowDuplicate?: boolean;
  } = {},
): Promise<RecordLoanPaymentResult> {
  const loan = await db.loans.get(loanId);
  if (!loan || loan.isDeleted) throw new Error("Loan not found.");

  const payPaise = Math.min(Math.max(0, amountPaise), loan.balancePaise);
  if (payPaise <= 0) throw new Error("Payment amount must be greater than zero.");

  const now = new Date();
  const settings = await getSettings();
  const monthKey = getMonthKey(now, settings.salaryDay);

  let paymentId!: number;
  let transactionId: number | undefined;
  let newBalance = 0;
  let fullyPaid = false;

  await db.transaction("rw", [db.loans, db.loanPayments, db.transactions, db.accounts], async () => {
    const live = await db.loans.get(loanId);
    if (!live || live.isDeleted) throw new Error("Loan not found.");

    const pay = Math.min(Math.max(0, amountPaise), live.balancePaise);
    if (pay <= 0) throw new Error("Payment amount must be greater than zero.");

    newBalance = Math.max(0, live.balancePaise - pay);
    fullyPaid = newBalance === 0;

    const primary = await getPrimaryAccount();

    if (options.linkTransaction) {
      if (live.direction === "borrowed_by_me") {
        const categoryId = await getCategoryIdBySlug("misc");
        const title = resolveTransactionTitle(`Paid back ${live.personName}`, undefined, "expense");
        transactionId = (await db.transactions.add({
          kind: "expense",
          title,
          amountPaise: pay,
          categoryId,
          accountId: primary?.id,
          paymentMethod: "UPI",
          occurredAt: now,
          monthKey,
          tags: [],
          isRecurring: false,
          isDeleted: false,
          rowVersion: 1,
          createdAt: now,
          updatedAt: now,
        })) as number;
        if (primary?.id) {
          await applyTransactionAccountDelta(primary.id, "expense", pay);
        }
        setLastPaymentMethod("UPI");
        setLastCategoryId("expense", categoryId);
      } else if (live.direction === "lent_by_me") {
        const categoryId = await getCategoryIdBySlug("savings");
        const title = resolveTransactionTitle(`Returned by ${live.personName}`, undefined, "income");
        transactionId = (await db.transactions.add({
          kind: "income",
          title,
          amountPaise: pay,
          categoryId,
          accountId: primary?.id,
          paymentMethod: "UPI",
          occurredAt: now,
          monthKey,
          tags: ["lent-return"],
          isRecurring: false,
          isDeleted: false,
          rowVersion: 1,
          createdAt: now,
          updatedAt: now,
        })) as number;
        if (primary?.id) {
          await applyTransactionAccountDelta(primary.id, "income", pay);
        }
        setLastPaymentMethod("UPI");
        setLastCategoryId("income", categoryId);
      }
    }

    paymentId = (await db.loanPayments.add({
      loanId,
      amountPaise: pay,
      paidAt: now,
      transactionId,
      createdAt: now,
    })) as number;

    await db.loans.update(loanId, {
      balancePaise: newBalance,
      status: fullyPaid ? "returned" : "partial",
      updatedAt: now,
    });
  });

  emitDbDataChanged();
  return { paymentId, transactionId, newBalance, fullyPaid };
}

export async function markBorrowedFullyPaid(loanId: number): Promise<RecordLoanPaymentResult> {
  const loan = await db.loans.get(loanId);
  if (!loan) throw new Error("Loan not found.");
  return recordLoanPayment(loanId, loan.balancePaise, { linkTransaction: true });
}

export async function markLentFullyReturned(loanId: number): Promise<RecordLoanPaymentResult> {
  const loan = await db.loans.get(loanId);
  if (!loan) throw new Error("Loan not found.");
  return recordLoanPayment(loanId, loan.balancePaise, { linkTransaction: true });
}

export function loanProgress(loan: Loan): number {
  if (loan.principalPaise <= 0) return 0;
  const paid = loan.principalPaise - loan.balancePaise;
  return Math.min(100, Math.round((paid / loan.principalPaise) * 100));
}

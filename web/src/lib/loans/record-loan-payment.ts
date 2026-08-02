import { db, getSettings } from "@/lib/db";
import type { Loan } from "@/lib/db/types";
import { emitDbDataChanged } from "@/lib/notifications/bus";
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

  await db.transaction("rw", [db.loans, db.loanPayments, db.transactions], async () => {
    const live = await db.loans.get(loanId);
    if (!live || live.isDeleted) throw new Error("Loan not found.");

    const pay = Math.min(Math.max(0, amountPaise), live.balancePaise);
    if (pay <= 0) throw new Error("Payment amount must be greater than zero.");

    newBalance = Math.max(0, live.balancePaise - pay);
    fullyPaid = newBalance === 0;

    if (options.linkTransaction) {
      if (live.direction === "borrowed_by_me") {
        const categoryId = await getCategoryIdBySlug("misc");
        const title = resolveTransactionTitle(`Paid back ${live.personName}`, undefined, "expense");
        transactionId = (await db.transactions.add({
          kind: "expense",
          title,
          amountPaise: pay,
          categoryId,
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

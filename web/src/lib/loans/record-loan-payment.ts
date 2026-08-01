import { db } from "@/lib/db";
import type { Loan } from "@/lib/db/types";
import { emitDbDataChanged } from "@/lib/notifications/bus";
import { getCategoryIdBySlug } from "@/lib/obligations/category-lookup";
import { saveQuickTransaction } from "@/lib/transactions/save-quick-transaction";

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
  const newBalance = Math.max(0, loan.balancePaise - payPaise);
  const fullyPaid = newBalance === 0;

  let transactionId: number | undefined;

  if (options.linkTransaction) {
    if (loan.direction === "borrowed_by_me") {
      const categoryId = await getCategoryIdBySlug("misc");
      transactionId = await saveQuickTransaction(
        {
          kind: "expense",
          title: `Paid back ${loan.personName}`,
          amountPaise: payPaise,
          categoryId,
          paymentMethod: "UPI",
          occurredAt: now,
        },
        { allowDuplicate: options.allowDuplicate ?? true },
      );
    } else if (loan.direction === "lent_by_me") {
      const categoryId = await getCategoryIdBySlug("savings");
      transactionId = await saveQuickTransaction(
        {
          kind: "income",
          title: `Returned by ${loan.personName}`,
          amountPaise: payPaise,
          categoryId,
          paymentMethod: "UPI",
          occurredAt: now,
        },
        { allowDuplicate: options.allowDuplicate ?? true },
      );
    }
  }

  const paymentId = (await db.loanPayments.add({
    loanId,
    amountPaise: payPaise,
    paidAt: now,
    transactionId,
    createdAt: now,
  })) as number;

  await db.loans.update(loanId, {
    balancePaise: newBalance,
    status: fullyPaid ? "returned" : "partial",
    updatedAt: now,
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

import { db } from "@/lib/db";
import type { LoanDirection } from "@/lib/db/types";
import { getLoanDueStatus } from "@/lib/loans/loan-due";

export type LoanDueReminder = {
  id: string;
  loanId: number;
  direction: LoanDirection;
  personName: string;
  amountPaise: number;
  dueAt?: Date;
  status: ReturnType<typeof getLoanDueStatus>;
  href: string;
};

export async function loadLoanDueReminders(): Promise<LoanDueReminder[]> {
  const loans = await db.loans
    .filter((l) => !l.isDeleted && l.status !== "returned")
    .toArray();

  const reminders: LoanDueReminder[] = loans
    .filter((loan) => loan.expectedReturnAt)
    .map((loan) => ({
      id: `${loan.direction}-${loan.id}`,
      loanId: loan.id!,
      direction: loan.direction,
      personName: loan.personName,
      amountPaise: loan.balancePaise,
      dueAt: loan.expectedReturnAt ? new Date(loan.expectedReturnAt) : undefined,
      status: getLoanDueStatus(loan),
      href: loan.direction === "borrowed_by_me" ? "/borrowed" : "/loans",
    }));

  const statusOrder = { overdue: 0, due_today: 1, due_soon: 2, upcoming: 3, none: 4 };

  return reminders.sort((a, b) => {
    const sa = statusOrder[a.status];
    const sb = statusOrder[b.status];
    if (sa !== sb) return sa - sb;
    if (a.dueAt && b.dueAt) return a.dueAt.getTime() - b.dueAt.getTime();
    if (a.dueAt) return -1;
    if (b.dueAt) return 1;
    return a.personName.localeCompare(b.personName);
  });
}

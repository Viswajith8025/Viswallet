import { addDays, format, isBefore, startOfDay } from "date-fns";
import type { Loan } from "@/lib/db/types";

export type LoanDueStatus = "overdue" | "due_today" | "due_soon" | "upcoming" | "none";

export function getLoanDueStatus(loan: Pick<Loan, "expectedReturnAt">): LoanDueStatus {
  if (!loan.expectedReturnAt) return "none";
  const today = startOfDay(new Date());
  const due = startOfDay(new Date(loan.expectedReturnAt));
  if (isBefore(due, today)) return "overdue";
  if (due.getTime() === today.getTime()) return "due_today";
  const weekOut = addDays(today, 7);
  if (isBefore(due, weekOut)) return "due_soon";
  return "upcoming";
}

export function formatLoanDueLabel(
  loan: Pick<Loan, "expectedReturnAt">,
  direction: Loan["direction"],
): string {
  if (!loan.expectedReturnAt) {
    return direction === "borrowed_by_me" ? "No pay-by date" : "No return date";
  }
  const due = new Date(loan.expectedReturnAt);
  const status = getLoanDueStatus(loan);
  const dateStr = format(due, "dd MMM yyyy");
  if (status === "overdue") {
    return direction === "borrowed_by_me" ? `Overdue · was ${dateStr}` : `Overdue · expected ${dateStr}`;
  }
  if (status === "due_today") return "Due today";
  if (status === "due_soon") return `Due ${format(due, "EEE, dd MMM")}`;
  return direction === "borrowed_by_me" ? `Pay by ${dateStr}` : `Return by ${dateStr}`;
}

export function defaultLoanDueDate(): string {
  return format(addDays(new Date(), 30), "yyyy-MM-dd");
}

export function parseLoanDueInput(value: string): Date | undefined {
  if (!value.trim()) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

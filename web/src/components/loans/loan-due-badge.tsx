import { cn } from "@/lib/design/cn";
import { formatLoanDueLabel, getLoanDueStatus, type LoanDueStatus } from "@/lib/loans/loan-due";
import type { Loan } from "@/lib/db/types";

const STATUS_STYLES: Record<LoanDueStatus, string> = {
  overdue: "text-destructive font-medium",
  due_today: "text-warning font-medium",
  due_soon: "text-warning",
  upcoming: "text-muted-foreground",
  none: "text-muted-foreground/80",
};

export function LoanDueBadge({
  loan,
  direction,
  className,
}: {
  loan: Pick<Loan, "expectedReturnAt">;
  direction: Loan["direction"];
  className?: string;
}) {
  const status = getLoanDueStatus(loan);
  return (
    <p className={cn("text-xs", STATUS_STYLES[status], className)}>
      {formatLoanDueLabel(loan, direction)}
    </p>
  );
}

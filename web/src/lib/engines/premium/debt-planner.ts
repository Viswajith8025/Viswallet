import type { Emi, Loan } from "@/lib/db/types";

export type DebtItem = {
  id: string;
  name: string;
  balancePaise: number;
  monthlyPaymentPaise: number;
  interestRate: number;
  type: "emi" | "loan";
};

export type PayoffPlan = {
  strategy: "snowball" | "avalanche";
  months: number;
  totalInterestPaise: number;
  totalPaidPaise: number;
  schedule: { month: number; paymentPaise: number; remainingPaise: number }[];
};

export function collectDebts(emis: Emi[], loans: Loan[]): DebtItem[] {
  const items: DebtItem[] = [];
  for (const e of emis.filter((x) => x.isActive && x.balancePaise > 0)) {
    items.push({
      id: `emi-${e.id}`,
      name: e.name,
      balancePaise: e.balancePaise,
      monthlyPaymentPaise: e.emiAmountPaise,
      interestRate: e.interestRate,
      type: "emi",
    });
  }
  for (const l of loans.filter((x) => !x.isDeleted && x.direction === "borrowed_by_me" && x.balancePaise > 0)) {
    items.push({
      id: `loan-${l.id}`,
      name: l.personName,
      balancePaise: l.balancePaise,
      monthlyPaymentPaise: Math.max(Math.round(l.balancePaise / 12), 1),
      interestRate: 0,
      type: "loan",
    });
  }
  return items;
}

export function simulatePayoff(
  debts: DebtItem[],
  extraMonthlyPaise: number,
  strategy: "snowball" | "avalanche",
): PayoffPlan {
  const sorted = [...debts].sort((a, b) =>
    strategy === "snowball"
      ? a.balancePaise - b.balancePaise
      : b.interestRate - a.interestRate || b.balancePaise - a.balancePaise,
  );

  const balances = sorted.map((d) => ({ ...d }));
  const schedule: PayoffPlan["schedule"] = [];
  let month = 0;
  let totalInterest = 0;
  let totalPaid = 0;
  const maxMonths = 600;

  while (balances.some((b) => b.balancePaise > 0) && month < maxMonths) {
    month++;
    let extra = extraMonthlyPaise;
    let remaining = balances.reduce((s, b) => s + b.balancePaise, 0);

    for (const debt of balances) {
      if (debt.balancePaise <= 0) continue;
      const monthlyInterest = Math.round((debt.balancePaise * debt.interestRate) / 100 / 12);
      totalInterest += monthlyInterest;
      debt.balancePaise += monthlyInterest;
      const payment = Math.min(debt.balancePaise, debt.monthlyPaymentPaise + (extra > 0 ? extra : 0));
      if (extra > 0) extra = 0;
      debt.balancePaise -= payment;
      totalPaid += payment;
    }

    remaining = balances.reduce((s, b) => s + b.balancePaise, 0);
    schedule.push({ month, paymentPaise: totalPaid, remainingPaise: remaining });
    if (remaining <= 0) break;
  }

  return {
    strategy,
    months: month,
    totalInterestPaise: totalInterest,
    totalPaidPaise: totalPaid,
    schedule: schedule.slice(0, 24),
  };
}

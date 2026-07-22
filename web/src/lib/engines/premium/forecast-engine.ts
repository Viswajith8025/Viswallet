import { addMonths, differenceInDays, format } from "date-fns";
import type { Transaction } from "@/lib/db/types";
import { getCycleRange } from "@/lib/salary-cycle";

export type ForecastPoint = {
  date: string;
  label: string;
  projectedBalancePaise: number;
  projectedExpensePaise: number;
  projectedIncomePaise: number;
};

export type CashFlowForecast = {
  points: ForecastPoint[];
  avgDailySpendPaise: number;
  projectedEndBalancePaise: number;
  runwayDays: number;
  monthlyBurnPaise: number;
};

export function buildCashFlowForecast(
  transactions: Transaction[],
  monthKey: string,
  salaryDay: number,
  currentBalancePaise: number,
  fixedMonthlyOutflowPaise: number,
  monthsAhead = 3,
): CashFlowForecast {
  const { start, end } = getCycleRange(monthKey, salaryDay);
  const cycleDays = Math.max(1, differenceInDays(end, start) + 1);
  const expenses = transactions.filter((t) => t.kind === "expense");
  const income = transactions.filter((t) => t.kind === "income");
  const totalExpense = expenses.reduce((s, t) => s + t.amountPaise, 0);
  const totalIncome = income.reduce((s, t) => s + t.amountPaise, 0);
  const avgDailySpendPaise = Math.round(totalExpense / cycleDays);
  const monthlyBurnPaise = avgDailySpendPaise * 30 + fixedMonthlyOutflowPaise;

  const points: ForecastPoint[] = [];
  let balance = currentBalancePaise;
  const now = new Date();

  for (let m = 0; m <= monthsAhead; m++) {
    const d = addMonths(now, m);
    const projectedIncome = m === 0 ? totalIncome : Math.round(totalIncome * 0.95);
    const projectedExpense = m === 0 ? totalExpense : monthlyBurnPaise;
    balance += projectedIncome - projectedExpense;
    points.push({
      date: format(d, "yyyy-MM-dd"),
      label: format(d, "MMM yyyy"),
      projectedBalancePaise: balance,
      projectedExpensePaise: projectedExpense,
      projectedIncomePaise: projectedIncome,
    });
  }

  const runwayDays =
    avgDailySpendPaise > 0 ? Math.floor(currentBalancePaise / avgDailySpendPaise) : 999;

  return {
    points,
    avgDailySpendPaise,
    projectedEndBalancePaise: points[points.length - 1]?.projectedBalancePaise ?? currentBalancePaise,
    runwayDays,
    monthlyBurnPaise,
  };
}

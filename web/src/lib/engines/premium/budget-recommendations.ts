import type { FinanceSnapshot } from "@/lib/engines/finance-snapshot";
import { sumByCategory } from "@/lib/engines/finance-snapshot";
import { formatINR } from "@/lib/money";

export type BudgetRecommendation = {
  category: string;
  currentPaise: number;
  recommendedPaise: number;
  changePaise: number;
  reason: string;
};

export function generateBudgetRecommendations(data: FinanceSnapshot): BudgetRecommendation[] {
  const breakdown = sumByCategory(data.transactions, data.categories, "expense");
  const total = data.expensePaise || 1;
  const targetSavings = Math.round(data.salaryPaise * 0.2);
  const availableForSpending = Math.max(0, data.salaryPaise - targetSavings - data.emiMonthlyPaise - data.subscriptionMonthlyPaise);

  return breakdown.slice(0, 6).map((item) => {
    const share = item.amount / total;
    const idealShare = share > 0.25 ? 0.2 : share < 0.05 ? 0.08 : share;
    const recommendedPaise = Math.round(availableForSpending * idealShare);
    const changePaise = recommendedPaise - item.amount;
    let reason = "Aligned with healthy allocation";
    if (changePaise < -item.amount * 0.15) {
      reason = `Over-indexed at ${Math.round(share * 100)}% of spend — trim to free ${formatINR(Math.abs(changePaise))}`;
    } else if (changePaise > item.amount * 0.2) {
      reason = "Room to increase without hurting savings target";
    }
    return {
      category: item.name,
      currentPaise: item.amount,
      recommendedPaise,
      changePaise,
      reason,
    };
  });
}

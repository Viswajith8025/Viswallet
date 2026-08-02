import type { FinanceSnapshot } from "@/lib/engines/finance-snapshot";
import { sumByCategory } from "@/lib/engines/finance-snapshot";
import { formatINR } from "@/lib/money";

export type InsightCard = {
  id: string;
  category: "spending" | "savings" | "debt" | "subscriptions" | "forecast" | "budget";
  severity: "info" | "success" | "warning" | "critical";
  title: string;
  body: string;
  action?: { label: string; href: string };
  score?: number;
};

export function generatePremiumInsights(data: FinanceSnapshot): InsightCard[] {
  const cards: InsightCard[] = [];
  const breakdown = sumByCategory(data.transactions, data.categories, "expense");
  const topCategory = breakdown[0];
  const budgetPct = data.salaryPaise > 0 ? (data.expensePaise / data.salaryPaise) * 100 : 0;

  cards.push({
    id: "health",
    category: "savings",
    severity: data.healthScore >= 70 ? "success" : data.healthScore >= 40 ? "warning" : "critical",
    title: `Financial health · ${data.healthScore}/100`,
    body:
      data.healthScore >= 70
        ? "You're in a strong position this cycle. Consider nudging a bit more toward goals or investments."
        : data.healthScore >= 40
          ? "Room to improve. A quick look at discretionary spending could free up breathing room."
          : "This cycle is tight. Prioritize due bills and pause non-essential spending for now.",
    score: data.healthScore,
    action: { label: "See cash flow", href: "/forecast" },
  });

  if (topCategory && data.expensePaise > 0) {
    const pct = Math.round((topCategory.amount / data.expensePaise) * 100);
    cards.push({
      id: "top-category",
      category: "spending",
      severity: pct > 40 ? "warning" : "info",
      title: `${topCategory.name} leads this cycle`,
      body: `${pct}% of spending (${formatINR(topCategory.amount)}) went to ${topCategory.name}. ${
        pct > 35
          ? "A tighter budget bucket here could help balance the month."
          : "Your spending spread looks fairly balanced."
      }`,
      action: { label: "View categories", href: "/analytics" },
    });
  }

  const subPct = data.salaryPaise > 0 ? (data.subscriptionMonthlyPaise / data.salaryPaise) * 100 : 0;
  if (data.subscriptionMonthlyPaise > 0) {
    cards.push({
      id: "subscriptions",
      category: "subscriptions",
      severity: subPct > 12 ? "warning" : "info",
      title: "Subscription footprint",
      body: `Recurring services total ${formatINR(data.subscriptionMonthlyPaise)} a month (${Math.round(subPct)}% of salary). Worth a quick audit for anything unused.`,
      action: { label: "Review subscriptions", href: "/subscriptions" },
    });
  }

  if (budgetPct > 85) {
    cards.push({
      id: "budget-burn",
      category: "budget",
      severity: "critical",
      title: "Budget running low",
      body: `${Math.round(budgetPct)}% of salary spent with ${data.daysLeft} days left. Aim for about ${formatINR(data.safeSpendDaily)} per day.`,
      action: { label: "Adjust budgets", href: "/budgets" },
    });
  } else if (data.remainingPaise > 0 && data.daysLeft > 0) {
    cards.push({
      id: "safe-spend",
      category: "forecast",
      severity: "success",
      title: "Pace looks healthy",
      body: `You can spend about ${formatINR(data.safeSpendDaily)} per day for the next ${data.daysLeft} days.`,
      action: { label: "See forecast", href: "/forecast" },
    });
  }

  if (data.borrowedBalance > 0) {
    cards.push({
      id: "debt",
      category: "debt",
      severity: "warning",
      title: "Borrowed balance",
      body: `You owe ${formatINR(data.borrowedBalance)}. A clear payoff plan can reduce interest and stress.`,
      action: { label: "Plan repayments", href: "/debt-planner" },
    });
  }

  if (data.emiMonthlyPaise > 0) {
    const emiPct = data.salaryPaise > 0 ? (data.emiMonthlyPaise / data.salaryPaise) * 100 : 0;
    cards.push({
      id: "emi-ratio",
      category: "debt",
      severity: emiPct > 40 ? "critical" : emiPct > 25 ? "warning" : "info",
      title: "EMI load",
      body: `EMIs total ${formatINR(data.emiMonthlyPaise)} a month (${Math.round(emiPct)}% of salary). ${
        emiPct > 40 ? "Above the usual 40% comfort zone." : "Within a manageable range."
      }`,
      action: { label: "View EMIs", href: "/emi" },
    });
  }

  const savingsRate =
    data.incomePaise > 0 ? ((data.incomePaise - data.expensePaise) / data.incomePaise) * 100 : 0;
  cards.push({
    id: "savings-rate",
    category: "savings",
    severity: savingsRate >= 20 ? "success" : savingsRate >= 10 ? "info" : "warning",
    title: `Unspent · ${Math.round(savingsRate)}%`,
    body:
      savingsRate >= 20
        ? "Strong savings discipline this cycle — well done."
        : savingsRate >= 10
          ? "You're saving some of each cycle. Moving toward 20% builds long-term stability."
          : "Most of this cycle's income went out. Review your top categories for easy adjustments.",
    action: { label: "Savings goals", href: "/goals" },
  });

  return cards;
}

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
    title: `Financial health: ${data.healthScore}/100`,
    body:
      data.healthScore >= 70
        ? "Strong position. Consider increasing investments or goal contributions."
        : data.healthScore >= 40
          ? "Moderate health. Review discretionary categories for quick wins."
          : "Critical zone. Pause non-essential spending and tackle due bills first.",
    score: data.healthScore,
    action: { label: "View forecast", href: "/forecast" },
  });

  if (topCategory && data.expensePaise > 0) {
    const pct = Math.round((topCategory.amount / data.expensePaise) * 100);
    cards.push({
      id: "top-category",
      category: "spending",
      severity: pct > 40 ? "warning" : "info",
      title: `${topCategory.name} leads spending`,
      body: `${pct}% of expenses (${formatINR(topCategory.amount)}) went to ${topCategory.name}. ${pct > 35 ? "Consider setting a tighter bucket." : "Distribution looks balanced."}`,
      action: { label: "Category analytics", href: "/analytics" },
    });
  }

  const subPct = data.salaryPaise > 0 ? (data.subscriptionMonthlyPaise / data.salaryPaise) * 100 : 0;
  if (data.subscriptionMonthlyPaise > 0) {
    cards.push({
      id: "subscriptions",
      category: "subscriptions",
      severity: subPct > 12 ? "warning" : "info",
      title: "Subscription load",
      body: `Recurring services cost ${formatINR(data.subscriptionMonthlyPaise)}/mo (${Math.round(subPct)}% of salary). Audit unused subscriptions.`,
      action: { label: "Review subscriptions", href: "/subscriptions" },
    });
  }

  if (budgetPct > 85) {
    cards.push({
      id: "budget-burn",
      category: "budget",
      severity: "critical",
      title: "Budget nearly exhausted",
      body: `${Math.round(budgetPct)}% of salary spent with ${data.daysLeft} days left. Daily cap: ${formatINR(data.safeSpendDaily)}.`,
      action: { label: "Adjust budgets", href: "/budgets" },
    });
  } else if (data.remainingPaise > 0 && data.daysLeft > 0) {
    cards.push({
      id: "safe-spend",
      category: "forecast",
      severity: "success",
      title: "On-track spending pace",
      body: `Safe daily spend: ${formatINR(data.safeSpendDaily)} for ${data.daysLeft} more days.`,
      action: { label: "Cash flow forecast", href: "/forecast" },
    });
  }

  if (data.borrowedBalance > 0) {
    cards.push({
      id: "debt",
      category: "debt",
      severity: "warning",
      title: "Outstanding borrowings",
      body: `You owe ${formatINR(data.borrowedBalance)}. A structured payoff plan can save interest and stress.`,
      action: { label: "Debt planner", href: "/debt-planner" },
    });
  }

  if (data.emiMonthlyPaise > 0) {
    const emiPct = data.salaryPaise > 0 ? (data.emiMonthlyPaise / data.salaryPaise) * 100 : 0;
    cards.push({
      id: "emi-ratio",
      category: "debt",
      severity: emiPct > 40 ? "critical" : emiPct > 25 ? "warning" : "info",
      title: "EMI burden",
      body: `EMIs total ${formatINR(data.emiMonthlyPaise)}/mo (${Math.round(emiPct)}% of salary). ${emiPct > 40 ? "Above recommended 40% threshold." : "Within manageable range."}`,
      action: { label: "EMI tracker", href: "/emi" },
    });
  }

  const savingsRate =
    data.incomePaise > 0 ? ((data.incomePaise - data.expensePaise) / data.incomePaise) * 100 : 0;
  cards.push({
    id: "savings-rate",
    category: "savings",
    severity: savingsRate >= 20 ? "success" : savingsRate >= 10 ? "info" : "warning",
    title: `Savings rate: ${Math.round(savingsRate)}%`,
    body:
      savingsRate >= 20
        ? "Excellent savings discipline this cycle."
        : savingsRate >= 10
          ? "Decent savings. Push toward 20% for long-term wealth."
          : "Low savings rate. Review top 3 expense categories.",
    action: { label: "Savings goals", href: "/goals" },
  });

  return cards;
}

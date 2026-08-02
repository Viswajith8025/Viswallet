import type { Category, Transaction, Account } from "@/lib/db/types";
import { getCurrentCycleKey, getDaysLeftInCycle } from "@/lib/salary-cycle";
import {
  getActiveCategories,
  getCycleSalary,
  getCycleTransactions,
  getSettings,
} from "@/lib/db";
import {
  getActiveSubscriptions,
  getUnpaidBills,
  getActiveEmis,
  getOpenLoans,
  getActiveSavingsGoals,
  getAllInvestments,
} from "@/lib/db/repositories/finance-meta";
import { getActiveAccounts } from "@/lib/db/repositories/accounts";
import { subscriptionMonthlyPaise as toMonthlySubscriptionPaise } from "@/lib/money/subscription";

export type FinanceSnapshot = {
  monthKey: string;
  salaryDay: number;
  salaryPaise: number;
  incomePaise: number;
  expensePaise: number;
  remainingPaise: number;
  safeSpendDaily: number;
  daysLeft: number;
  transactions: Transaction[];
  categories: Category[];
  subscriptionMonthlyPaise: number;
  billsDuePaise: number;
  emiMonthlyPaise: number;
  lentBalance: number;
  borrowedBalance: number;
  goalsSaved: number;
  investmentValue: number;
  backupWalletsPaise: number;
  savingsPotsPaise: number;
  parkedWalletsPaise: number;
  netWorthPaise: number;
  healthScore: number;
  accounts: Account[];
  selectedAccountId: number | null;
  selectedAccount: Account | null;
};

export async function loadFinanceSnapshot(
  monthKeyOverride?: string,
  accountId?: number | null,
): Promise<FinanceSnapshot> {
  const settings = await getSettings();
  const monthKey = monthKeyOverride ?? getCurrentCycleKey(settings.salaryDay);
  const [transactions, salary, categories, subs, bills, emis, loans, goals, investments, accounts] =
    await Promise.all([
      getCycleTransactions(monthKey),
      getCycleSalary(monthKey),
      getActiveCategories(),
      getActiveSubscriptions(),
      getUnpaidBills(),
      getActiveEmis(),
      getOpenLoans(),
      getActiveSavingsGoals(),
      getAllInvestments(),
      getActiveAccounts(),
    ]);

  const spendingCats = new Set(
    categories.filter((c) => c.countsTowardSpending).map((c) => c.id),
  );

  const fullExpensePaise = transactions
    .filter((t) => t.kind === "expense" && spendingCats.has(t.categoryId))
    .reduce((s, t) => s + t.amountPaise, 0);

  const salaryBase = salary?.amountPaise ?? 0;
  const carryOverPaise = salary?.carryOverPaise ?? 0;
  const salaryPaise = salaryBase;

  const fullTransactionIncomePaise = transactions
    .filter((t) => t.kind === "income")
    .reduce((s, t) => s + t.amountPaise, 0);

  const fullIncomePaise = fullTransactionIncomePaise + salaryBase + carryOverPaise;
  const cycleRemainingPaise = fullIncomePaise - fullExpensePaise;

  const selectedAccount =
    accountId != null ? accounts.find((a) => a.id === accountId) ?? null : null;
  const scopedTransactions =
    selectedAccount != null
      ? transactions.filter((t) => t.accountId === accountId)
      : transactions;

  const expensePaise =
    selectedAccount != null
      ? scopedTransactions
          .filter((t) => t.kind === "expense" && spendingCats.has(t.categoryId))
          .reduce((s, t) => s + t.amountPaise, 0)
      : fullExpensePaise;

  const incomePaise =
    selectedAccount != null
      ? scopedTransactions.filter((t) => t.kind === "income").reduce((s, t) => s + t.amountPaise, 0)
      : fullIncomePaise;

  const remainingPaise =
    selectedAccount != null ? selectedAccount.balancePaise : cycleRemainingPaise;
  const daysLeft = getDaysLeftInCycle(settings.salaryDay);
  const safeSpendDaily =
    selectedAccount != null
      ? 0
      : daysLeft > 0
        ? Math.max(0, Math.floor(cycleRemainingPaise / daysLeft))
        : 0;

  const subscriptionMonthlyPaise = subs.reduce((s, sub) => s + toMonthlySubscriptionPaise(sub), 0);

  const billsDuePaise = bills.reduce((s, b) => s + b.amountPaise, 0);
  const emiMonthlyPaise = emis.reduce((s, e) => s + e.emiAmountPaise, 0);
  const lentBalance = loans
    .filter((l) => l.direction === "lent_by_me")
    .reduce((s, l) => s + l.balancePaise, 0);
  const borrowedBalance = loans
    .filter((l) => l.direction === "borrowed_by_me")
    .reduce((s, l) => s + l.balancePaise, 0);
  const goalsSaved = goals.reduce((s, g) => s + g.savedPaise, 0);
  const investmentValue = investments.reduce((s, i) => s + i.currentValuePaise, 0);
  const backupWalletsPaise = accounts
    .filter((a) => a.role === "backup_wallet")
    .reduce((s, a) => s + a.balancePaise, 0);
  const savingsPotsPaise = accounts
    .filter((a) => a.role === "pot")
    .reduce((s, a) => s + a.balancePaise, 0);
  const parkedWalletsPaise = backupWalletsPaise + savingsPotsPaise;
  const netWorthPaise =
    cycleRemainingPaise +
    parkedWalletsPaise +
    goalsSaved +
    investmentValue +
    lentBalance -
    borrowedBalance;

  const budgetUsed = salaryPaise > 0 ? fullExpensePaise / salaryPaise : 0;
  const healthBaseRemaining = cycleRemainingPaise;
  const healthScore = Math.round(
    Math.max(
      0,
      Math.min(
        100,
        100 -
          budgetUsed * 50 -
          (subscriptionMonthlyPaise / Math.max(salaryPaise, 1)) * 20 -
          (borrowedBalance / Math.max(salaryPaise, 1)) * 15 +
          (healthBaseRemaining > 0 ? 10 : 0),
      ),
    ),
  );

  return {
    monthKey,
    salaryDay: settings.salaryDay,
    salaryPaise,
    incomePaise,
    expensePaise,
    remainingPaise,
    safeSpendDaily,
    daysLeft,
    transactions: scopedTransactions.sort(
      (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
    ),
    categories,
    subscriptionMonthlyPaise,
    billsDuePaise,
    emiMonthlyPaise,
    lentBalance,
    borrowedBalance,
    goalsSaved,
    investmentValue,
    backupWalletsPaise,
    savingsPotsPaise,
    parkedWalletsPaise,
    netWorthPaise,
    healthScore,
    accounts,
    selectedAccountId: selectedAccount?.id ?? null,
    selectedAccount,
  };
}

export function categoryMap(categories: Category[]): Map<number, Category> {
  return new Map(categories.map((c) => [c.id!, c]));
}

export function sumByCategory(
  transactions: Transaction[],
  categories: Category[],
  kind: "expense" | "income" = "expense",
) {
  const map = categoryMap(categories);
  const totals = new Map<number, number>();
  for (const t of transactions.filter((x) => x.kind === kind)) {
    totals.set(t.categoryId, (totals.get(t.categoryId) ?? 0) + t.amountPaise);
  }
  return Array.from(totals.entries())
    .map(([id, amount]) => {
      const cat = map.get(id);
      return { name: cat?.name ?? "Unknown", color: cat?.color ?? "#5f4a8b", amount };
    })
    .sort((a, b) => b.amount - a.amount);
}

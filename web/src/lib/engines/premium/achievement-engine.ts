import { format, subDays } from "date-fns";
import { db, pushNotification, countActiveTransactions } from "@/lib/db/client";
import { getActiveSavingsGoals } from "@/lib/db/repositories/finance-meta";
import { getActiveTransactions } from "@/lib/db/repositories/transactions";

async function unlock(key: string, progress: number): Promise<boolean> {
  const achievement = await db.achievements.where("achievementKey").equals(key).first();
  if (!achievement?.id || achievement.unlockedAt) return false;
  const done = progress >= achievement.target;
  await db.achievements.update(achievement.id, {
    progress: Math.min(progress, achievement.target),
    ...(done ? { unlockedAt: new Date() } : {}),
  });
  if (done) {
    await pushNotification({
      type: "success",
      title: `Achievement unlocked: ${achievement.title}`,
      body: achievement.description,
      href: "/achievements",
    });
  }
  return done;
}

export async function evaluateAchievements(): Promise<void> {
  const [txnCount, goals, investments, settings] = await Promise.all([
    countActiveTransactions(),
    getActiveSavingsGoals(),
    db.investments.count(),
    db.settings.get(1),
  ]);

  await unlock("first_transaction", txnCount);
  await unlock("ten_transactions", txnCount);
  await unlock("first_goal", goals.length);
  await unlock("investment_starter", investments);

  const goalsSaved = goals.reduce((s, g) => s + g.savedPaise, 0);
  await unlock("saved_10k", goalsSaved);
  await unlock("saved_1lakh", goalsSaved);

  if (settings?.lastBackupAt) {
    await unlock("backup_created", 1);
  }

  const salaryPaise = settings?.expectedSalaryPaise ?? 0;
  if (salaryPaise > 0) {
    const spent = await db.transactions
      .filter((row) => !row.isDeleted && row.kind === "expense")
      .toArray();
    const expensePaise = spent.reduce((sum, row) => sum + row.amountPaise, 0);
    if (expensePaise <= salaryPaise) await unlock("budget_master", 1);
  }
  const openBorrowed = await db.loans
    .filter((loan) => !loan.isDeleted && loan.direction === "borrowed_by_me" && loan.balancePaise > 0)
    .count();
  if (openBorrowed === 0) await unlock("debt_free", 1);

  const dates = new Set<string>();
  const recent = await getActiveTransactions(60);
  for (const t of recent) {
    dates.add(format(new Date(t.occurredAt), "yyyy-MM-dd"));
  }
  let streak = 0;
  for (let i = 0; i < 30; i++) {
    const d = format(subDays(new Date(), i), "yyyy-MM-dd");
    if (dates.has(d)) streak++;
    else break;
  }
  await unlock("streak_7", streak);
}

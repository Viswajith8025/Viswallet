import { format, startOfDay } from "date-fns";
import { db, createBudgetPlanForCycle, getSettings, updateSettings } from "@/lib/db";
import { loadFinanceSnapshot } from "@/lib/engines/finance-snapshot";
import {
  getCurrentCycleKey,
  getCycleRange,
  getPreviousCycleKeys,
} from "@/lib/salary-cycle";

export type SalaryCreditPreview = {
  monthKey: string;
  previousMonthKey: string;
  baseSalaryPaise: number;
  carryOverPaise: number;
  totalAvailablePaise: number;
};

function todayKey(): string {
  return format(new Date(), "yyyy-MM-dd");
}

function getPreviousCycleKey(monthKey: string): string {
  const keys = getPreviousCycleKeys(monthKey, 2);
  return keys[0];
}

export async function getLastKnownSalaryPaise(): Promise<number> {
  const rows = await db.monthlySalaries.orderBy("monthKey").reverse().toArray();
  const latest = rows.find((r) => r.amountPaise > 0);
  return latest?.amountPaise ?? 0;
}

export async function getPreviousCycleRemainingPaise(monthKey: string): Promise<number> {
  const prevKey = getPreviousCycleKey(monthKey);
  if (prevKey === monthKey) return 0;
  const snapshot = await loadFinanceSnapshot(prevKey);
  return Math.max(0, snapshot.remainingPaise);
}

export async function buildSalaryCreditPreview(): Promise<SalaryCreditPreview | null> {
  const settings = await getSettings();
  const monthKey = getCurrentCycleKey(settings.salaryDay);
  const baseSalaryPaise = await getLastKnownSalaryPaise();
  const carryOverPaise = await getPreviousCycleRemainingPaise(monthKey);

  return {
    monthKey,
    previousMonthKey: getPreviousCycleKey(monthKey),
    baseSalaryPaise,
    carryOverPaise,
    totalAvailablePaise: baseSalaryPaise + carryOverPaise,
  };
}

/** True when we should show the daily salary-credited prompt. */
export async function shouldPromptSalaryCredit(): Promise<boolean> {
  const settings = await getSettings();
  if (!settings.onboardingComplete) return false;

  const salaryDay = settings.salaryDay;
  const monthKey = getCurrentCycleKey(salaryDay);
  const { start } = getCycleRange(monthKey, salaryDay);
  const now = startOfDay(new Date());

  // Ask from the 1st of each calendar month, or from salary cycle start if later in the month.
  const calendarMonthStart = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
  const promptFrom = start > calendarMonthStart ? start : calendarMonthStart;
  if (now < promptFrom) return false;

  const existing = await db.monthlySalaries.where("monthKey").equals(monthKey).first();
  if (existing?.receivedAt) return false;

  if (settings.lastSalaryPromptDate === todayKey()) return false;

  return true;
}

export async function dismissSalaryCreditPromptForToday(): Promise<void> {
  await updateSettings({ lastSalaryPromptDate: todayKey() });
}

export async function creditSalaryForCurrentCycle(baseSalaryPaise: number): Promise<SalaryCreditPreview> {
  const settings = await getSettings();
  const monthKey = getCurrentCycleKey(settings.salaryDay);
  const carryOverPaise = await getPreviousCycleRemainingPaise(monthKey);
  const now = new Date();
  const totalPaise = baseSalaryPaise + carryOverPaise;

  const existing = await db.monthlySalaries.where("monthKey").equals(monthKey).first();
  const payload = {
    monthKey,
    amountPaise: baseSalaryPaise,
    carryOverPaise,
    receivedAt: now,
    updatedAt: now,
  };

  if (existing?.id) {
    await db.monthlySalaries.update(existing.id, payload);
  } else {
    try {
      await db.monthlySalaries.add({ ...payload, createdAt: now });
    } catch {
      const retry = await db.monthlySalaries.where("monthKey").equals(monthKey).first();
      if (retry?.id) await db.monthlySalaries.update(retry.id, payload);
      else throw new Error("Failed to record salary for this cycle.");
    }
  }

  await createBudgetPlanForCycle(monthKey, totalPaise);

  return {
    monthKey,
    previousMonthKey: getPreviousCycleKey(monthKey),
    baseSalaryPaise,
    carryOverPaise,
    totalAvailablePaise: totalPaise,
  };
}

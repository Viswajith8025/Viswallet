import { format, subMonths, addMonths, setDate, startOfDay, isBefore, isAfter } from "date-fns";

/** Salary-cycle month key, e.g. "2026-03" for cycle starting March salary day */
export function getMonthKey(date: Date, salaryDay: number): string {
  const d = startOfDay(date);
  let cycleStart = setDate(d, Math.min(salaryDay, 28));
  if (isBefore(d, cycleStart)) {
    cycleStart = setDate(subMonths(d, 1), Math.min(salaryDay, 28));
  }
  return format(cycleStart, "yyyy-MM");
}

export function getCycleRange(monthKey: string, salaryDay: number): { start: Date; end: Date } {
  const [year, month] = monthKey.split("-").map(Number);
  const start = setDate(new Date(year, month - 1, 1), Math.min(salaryDay, 28));
  const end = setDate(addMonths(start, 1), Math.min(salaryDay, 28));
  end.setMilliseconds(end.getMilliseconds() - 1);
  return { start, end };
}

export function getCurrentCycleKey(salaryDay: number): string {
  return getMonthKey(new Date(), salaryDay);
}

export function getDaysLeftInCycle(salaryDay: number): number {
  const key = getCurrentCycleKey(salaryDay);
  const { end } = getCycleRange(key, salaryDay);
  const now = new Date();
  if (isAfter(now, end)) return 0;
  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function getPreviousCycleKeys(monthKey: string, count: number): string[] {
  const [year, month] = monthKey.split("-").map(Number);
  const keys: string[] = [];
  let d = new Date(year, month - 1, 1);
  for (let i = 0; i < count; i++) {
    keys.unshift(format(d, "yyyy-MM"));
    d = subMonths(d, 1);
  }
  return keys;
}

export function formatCycleLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  const d = new Date(year, month - 1, 1);
  return format(d, "MMM yyyy");
}

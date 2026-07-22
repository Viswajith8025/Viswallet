import { eachDayOfInterval, format, getDay, startOfMonth, endOfMonth } from "date-fns";
import type { Transaction } from "@/lib/db/types";

export type HeatmapCell = {
  date: string;
  day: number;
  weekday: number;
  amountPaise: number;
  intensity: number;
};

export type SpendingHeatmap = {
  cells: HeatmapCell[];
  maxAmountPaise: number;
  monthLabel: string;
};

export function buildSpendingHeatmap(
  transactions: Transaction[],
  referenceDate = new Date(),
): SpendingHeatmap {
  const start = startOfMonth(referenceDate);
  const end = endOfMonth(referenceDate);
  const days = eachDayOfInterval({ start, end });
  const byDay = new Map<string, number>();

  for (const t of transactions.filter((x) => !x.isDeleted && x.kind === "expense")) {
    const key = format(new Date(t.occurredAt), "yyyy-MM-dd");
    byDay.set(key, (byDay.get(key) ?? 0) + t.amountPaise);
  }

  const amounts = days.map((d) => byDay.get(format(d, "yyyy-MM-dd")) ?? 0);
  const maxAmountPaise = Math.max(...amounts, 1);

  const cells: HeatmapCell[] = days.map((d) => {
    const amountPaise = byDay.get(format(d, "yyyy-MM-dd")) ?? 0;
    return {
      date: format(d, "yyyy-MM-dd"),
      day: d.getDate(),
      weekday: getDay(d),
      amountPaise,
      intensity: amountPaise / maxAmountPaise,
    };
  });

  return {
    cells,
    maxAmountPaise,
    monthLabel: format(referenceDate, "MMMM yyyy"),
  };
}

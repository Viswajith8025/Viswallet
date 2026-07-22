import type { Transaction } from "@/lib/db/types";
import { differenceInDays, format } from "date-fns";

export type DetectedSubscription = {
  name: string;
  amountPaise: number;
  occurrences: number;
  avgIntervalDays: number;
  billingCycle: "weekly" | "monthly" | "yearly";
  lastOccurredAt: Date;
  confidence: number;
  transactionIds: number[];
};

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/\d{4,}/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .slice(0, 40);
}

export function detectSubscriptionsFromTransactions(
  transactions: Transaction[],
): DetectedSubscription[] {
  const expenses = transactions.filter((t) => !t.isDeleted && t.kind === "expense");
  const byKey = new Map<string, Transaction[]>();

  for (const t of expenses) {
    const key = `${normalizeTitle(t.title)}|${t.amountPaise}`;
    const list = byKey.get(key) ?? [];
    list.push(t);
    byKey.set(key, list);
  }

  const detected: DetectedSubscription[] = [];

  for (const [, group] of byKey) {
    if (group.length < 2) continue;
    const sorted = [...group].sort(
      (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime(),
    );
    const intervals: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      intervals.push(
        Math.abs(differenceInDays(new Date(sorted[i].occurredAt), new Date(sorted[i - 1].occurredAt))),
      );
    }
    const avgInterval = intervals.reduce((s, d) => s + d, 0) / intervals.length;
    let billingCycle: DetectedSubscription["billingCycle"] = "monthly";
    if (avgInterval <= 10) billingCycle = "weekly";
    else if (avgInterval >= 300) billingCycle = "yearly";

    const amountVariance = new Set(group.map((g) => g.amountPaise)).size;
    if (amountVariance > 1) continue;

    const confidence = Math.min(95, 40 + group.length * 15 + (avgInterval > 20 && avgInterval < 35 ? 20 : 0));

    detected.push({
      name: sorted[sorted.length - 1].title,
      amountPaise: sorted[0].amountPaise,
      occurrences: group.length,
      avgIntervalDays: Math.round(avgInterval),
      billingCycle,
      lastOccurredAt: new Date(sorted[sorted.length - 1].occurredAt),
      confidence,
      transactionIds: group.map((g) => g.id!).filter(Boolean),
    });
  }

  return detected.sort((a, b) => b.confidence - a.confidence);
}

export function formatDetectionSummary(d: DetectedSubscription): string {
  return `${d.occurrences} charges · ~${d.avgIntervalDays}d apart · last ${format(d.lastOccurredAt, "MMM d")}`;
}

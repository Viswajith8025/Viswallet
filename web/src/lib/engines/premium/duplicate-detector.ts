import type { Transaction } from "@/lib/db/types";
import { differenceInDays } from "date-fns";

export type DuplicateGroup = {
  transactions: Transaction[];
  reason: string;
  confidence: "high" | "medium";
};

export function findDuplicateTransactions(
  transactions: Transaction[],
  windowDays = 3,
): DuplicateGroup[] {
  const active = transactions.filter((t) => !t.isDeleted);
  const groups: DuplicateGroup[] = [];
  const seen = new Set<number>();

  for (let i = 0; i < active.length; i++) {
    const a = active[i];
    if (!a.id || seen.has(a.id)) continue;
    const matches: Transaction[] = [a];

    for (let j = i + 1; j < active.length; j++) {
      const b = active[j];
      if (!b.id || seen.has(b.id)) continue;
      if (a.kind !== b.kind) continue;
      if (a.amountPaise !== b.amountPaise) continue;
      if (a.categoryId !== b.categoryId) continue;
      const days = Math.abs(differenceInDays(new Date(a.occurredAt), new Date(b.occurredAt)));
      if (days > windowDays) continue;

      const titleA = a.title.toLowerCase().trim();
      const titleB = b.title.toLowerCase().trim();
      const sameTitle = titleA === titleB;
      const similarTitle = titleA.includes(titleB) || titleB.includes(titleA);
      if (!sameTitle && !similarTitle) continue;

      matches.push(b);
      seen.add(b.id);
    }

    if (matches.length > 1 && a.id) {
      seen.add(a.id);
      const sameTitle = matches.every(
        (t) => t.title.toLowerCase().trim() === matches[0].title.toLowerCase().trim(),
      );
      groups.push({
        transactions: matches,
        reason: sameTitle
          ? `Same amount, category, and title within ${windowDays} days`
          : `Same amount and category within ${windowDays} days`,
        confidence: sameTitle ? "high" : "medium",
      });
    }
  }

  return groups;
}

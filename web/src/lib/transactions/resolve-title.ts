import { sanitizeTitle } from "@/lib/security";
import type { TransactionKind } from "@/lib/db/types";

/** True when title and category label are the same (case-insensitive). */
export function titlesEquivalent(title: string, categoryName?: string): boolean {
  if (!categoryName?.trim()) return false;
  return title.trim().toLowerCase() === categoryName.trim().toLowerCase();
}

/** Blank title → category name; otherwise sanitized user title. */
export function resolveTransactionTitle(
  rawTitle: string,
  categoryName?: string,
  kind: TransactionKind = "expense",
): string {
  const trimmed = rawTitle.trim();
  if (trimmed) return sanitizeTitle(trimmed);
  if (categoryName?.trim()) return sanitizeTitle(categoryName.trim());
  return sanitizeTitle(kind === "income" ? "Income" : "Expense");
}

import { addTransaction, findDuplicateCandidate } from "@/lib/db/repositories/transactions";
import type { Category } from "@/lib/db/types";
import { getMonthKey } from "@/lib/salary-cycle";
import { sanitizeTitle } from "@/lib/security";
import { resolveCategoryId } from "./categorize";
import type { ParsedStatementRow } from "./types";

export type BulkImportResult = {
  imported: number;
  skipped: number;
  duplicates: number;
};

export async function bulkImportStatementRows(
  rows: ParsedStatementRow[],
  options: {
    categories: Category[];
    salaryDay: number;
    accountId?: number;
    skipDuplicates?: boolean;
  },
): Promise<BulkImportResult> {
  const selected = rows.filter((row) => row.selected);
  let imported = 0;
  let skipped = 0;
  let duplicates = 0;

  for (const row of selected) {
    const categoryId = resolveCategoryId(options.categories, row.categorySlug);
    if (!categoryId) {
      skipped += 1;
      continue;
    }

    const occurredAt = row.occurredAt;
    const monthKey = getMonthKey(occurredAt, options.salaryDay);
    const input = {
      kind: row.kind,
      title: sanitizeTitle(row.title),
      amountPaise: row.amountPaise,
      categoryId,
      accountId: options.accountId,
      occurredAt,
      monthKey,
      paymentMethod: row.paymentMethod,
      tags: ["imported", "statement"],
      notes: row.notes ?? row.rawLine,
      isRecurring: false,
    };

    if (options.skipDuplicates !== false) {
      const duplicate = await findDuplicateCandidate(input);
      if (duplicate) {
        duplicates += 1;
        continue;
      }
    }

    await addTransaction(input, { allowDuplicate: true });
    imported += 1;
  }

  return { imported, skipped, duplicates };
}

export async function markDuplicateRows(
  rows: ParsedStatementRow[],
  options: { categories: Category[]; salaryDay: number },
): Promise<ParsedStatementRow[]> {
  const next: ParsedStatementRow[] = [];

  for (const row of rows) {
    const categoryId = resolveCategoryId(options.categories, row.categorySlug);
    if (!categoryId) {
      next.push(row);
      continue;
    }

    const monthKey = getMonthKey(row.occurredAt, options.salaryDay);
    const duplicate = await findDuplicateCandidate({
      title: sanitizeTitle(row.title),
      amountPaise: row.amountPaise,
      categoryId,
      occurredAt: row.occurredAt,
      monthKey,
    });

    next.push({ ...row, isDuplicate: Boolean(duplicate) });
  }

  return next;
}

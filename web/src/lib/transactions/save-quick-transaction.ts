import { getSettings } from "@/lib/db";
import { addTransaction } from "@/lib/db/repositories/transactions";
import type { TransactionKind } from "@/lib/db/types";
import { getMonthKey } from "@/lib/salary-cycle";
import { setLastCategoryId, setLastPaymentMethod } from "@/lib/ux/defaults";

export type QuickTransactionInput = {
  kind: TransactionKind;
  title: string;
  amountPaise: number;
  categoryId: number;
  paymentMethod: string;
  isRecurring?: boolean;
  occurredAt?: Date;
};

/** Create a transaction with salary-cycle monthKey and remembered defaults. */
export async function saveQuickTransaction(
  input: QuickTransactionInput,
  options: { allowDuplicate?: boolean } = {},
): Promise<number> {
  const settings = await getSettings();
  const occurredAt = input.occurredAt ?? new Date();
  const monthKey = getMonthKey(occurredAt, settings.salaryDay);

  const id = await addTransaction(
    {
      kind: input.kind,
      title: input.title,
      amountPaise: input.amountPaise,
      categoryId: input.categoryId,
      paymentMethod: input.paymentMethod,
      occurredAt,
      monthKey,
      tags: [],
      isRecurring: input.isRecurring ?? false,
    },
    options,
  );

  setLastPaymentMethod(input.paymentMethod);
  setLastCategoryId(input.kind, input.categoryId);
  return id;
}

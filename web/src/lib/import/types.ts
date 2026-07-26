import type { TransactionKind } from "@/lib/db/types";

export type ParsedStatementRow = {
  id: string;
  kind: TransactionKind;
  title: string;
  amountPaise: number;
  occurredAt: Date;
  paymentMethod: string;
  categorySlug: string;
  notes?: string;
  rawLine?: string;
  selected: boolean;
  isDuplicate?: boolean;
};

export const STATEMENT_MAX_BYTES = 10 * 1024 * 1024;

export const STATEMENT_ACCEPT =
  ".pdf,.csv,.txt,application/pdf,text/csv,text/plain";

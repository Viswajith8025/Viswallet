import { parseRupeeInput } from "@/lib/money";
import { parseCsvTransactions } from "@/lib/export/csv";
import { inferCategorySlug, inferPaymentMethod } from "./categorize";
import type { ParsedStatementRow } from "./types";

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }

  cells.push(current.trim());
  return cells;
}

function normalizeHeader(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function findColumn(headers: string[], candidates: string[]): number {
  const normalized = headers.map(normalizeHeader);
  for (const candidate of candidates) {
    const index = normalized.findIndex((header) => header === candidate || header.startsWith(`${candidate} `));
    if (index >= 0) return index;
  }
  return -1;
}

function parseDateValue(raw: string): Date | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const slash = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (slash) {
    const year = slash[3].length === 2 ? 2000 + Number(slash[3]) : Number(slash[3]);
    const date = new Date(
      year,
      Number(slash[2]) - 1,
      Number(slash[1]),
      Number(slash[4] ?? 0),
      Number(slash[5] ?? 0),
      Number(slash[6] ?? 0),
    );
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function parseBankCsv(text: string): ParsedStatementRow[] {
  const viswalletRows = parseCsvTransactions(text);
  if (viswalletRows.length > 0) {
    return viswalletRows.map((row, index) => ({
      id: `csv-vis-${index}`,
      kind: row.kind,
      title: row.title,
      amountPaise: row.amountPaise,
      occurredAt: row.occurredAt,
      paymentMethod: row.paymentMethod,
      categorySlug: inferCategorySlug(row.title),
      notes: row.notes,
      selected: true,
    }));
  }

  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];

  const headers = splitCsvLine(lines[0]);
  const dateIdx = findColumn(headers, ["date", "value date", "transaction date", "txn date", "posting date"]);
  const descIdx = findColumn(headers, ["narration", "description", "particulars", "remarks", "details", "title"]);
  const withdrawIdx = findColumn(headers, ["withdrawal", "debit", "dr amount", "debit amount"]);
  const depositIdx = findColumn(headers, ["deposit", "credit", "cr amount", "credit amount"]);
  const amountIdx = findColumn(headers, ["transaction amount", "amount"]);
  const timeIdx = findColumn(headers, ["time", "txn time"]);

  if (dateIdx < 0 || descIdx < 0) return [];

  const rows: ParsedStatementRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]);
    if (cols.length < 2) continue;

    const title = cols[descIdx]?.trim();
    if (!title) continue;

    let occurredAt = parseDateValue(cols[dateIdx] ?? "");
    if (!occurredAt) continue;

    if (timeIdx >= 0 && cols[timeIdx]) {
      const timeMatch = cols[timeIdx].match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
      if (timeMatch) {
        occurredAt = new Date(
          occurredAt.getFullYear(),
          occurredAt.getMonth(),
          occurredAt.getDate(),
          Number(timeMatch[1]),
          Number(timeMatch[2]),
          Number(timeMatch[3] ?? 0),
        );
      }
    }

    let kind: "expense" | "income" = "expense";
    let amountPaise = 0;

    const withdrawal = withdrawIdx >= 0 ? parseRupeeInput(cols[withdrawIdx] ?? "") : 0;
    const deposit = depositIdx >= 0 ? parseRupeeInput(cols[depositIdx] ?? "") : 0;

    if (withdrawal > 0) {
      amountPaise = withdrawal;
      kind = "expense";
    } else if (deposit > 0) {
      amountPaise = deposit;
      kind = "income";
    } else if (amountIdx >= 0) {
      amountPaise = parseRupeeInput(cols[amountIdx] ?? "");
      if (amountPaise <= 0) continue;
      const side = (cols[amountIdx + 1] ?? cols[headers.length - 1] ?? "").toLowerCase();
      kind = side.includes("cr") || side.includes("credit") ? "income" : "expense";
    } else {
      continue;
    }

    rows.push({
      id: `csv-bank-${i}`,
      kind,
      title,
      amountPaise,
      occurredAt,
      paymentMethod: inferPaymentMethod(title),
      categorySlug: inferCategorySlug(title),
      selected: true,
      rawLine: lines[i],
    });
  }

  return rows;
}

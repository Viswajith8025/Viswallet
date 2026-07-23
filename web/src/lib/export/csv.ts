import { format } from "date-fns";
import type { Category, Transaction } from "@/lib/db/types";
import { parseRupeeInput } from "@/lib/money";
import { escapeCsvFormula } from "@/lib/security";

function escapeCsv(value: string | number): string {
  const s = escapeCsvFormula(String(value));
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function transactionsToCsv(
  transactions: Transaction[],
  categories: Map<number, Category>,
): string {
  const header = [
    "Date",
    "Type",
    "Title",
    "Category",
    "Amount (INR)",
    "Payment Method",
    "Tags",
    "Notes",
    "Recurring",
  ].join(",");

  const rows = transactions
    .filter((t) => !t.isDeleted)
    .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
    .map((t) => {
      const cat = categories.get(t.categoryId)?.name ?? "Unknown";
      const amount = (t.amountPaise / 100).toFixed(2);
      return [
        format(new Date(t.occurredAt), "yyyy-MM-dd"),
        t.kind,
        escapeCsv(t.title),
        escapeCsv(cat),
        amount,
        escapeCsv(t.paymentMethod),
        escapeCsv(t.tags.join("; ")),
        escapeCsv(t.notes ?? ""),
        t.isRecurring ? "yes" : "no",
      ].join(",");
    });

  return "\uFEFF" + [header, ...rows].join("\n");
}

export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadExcel(filename: string, content: string): void {
  const blob = new Blob([content], {
    type: "application/vnd.ms-excel;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".xls") ? filename : `${filename}.xls`;
  a.click();
  URL.revokeObjectURL(url);
}

export type CsvImportRow = {
  kind: "expense" | "income";
  title: string;
  amountPaise: number;
  categoryName: string;
  occurredAt: Date;
  paymentMethod: string;
  notes?: string;
};

export function parseCsvTransactions(csv: string): CsvImportRow[] {
  const lines = csv.replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];

  const rows: CsvImportRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].match(/("([^"]|"")*"|[^,]+)/g)?.map((c) =>
      c.replace(/^"|"$/g, "").replace(/""/g, '"'),
    );
    if (!cols || cols.length < 5) continue;
    const amount = parseRupeeInput(cols[4]);
    if (amount <= 0) continue;
    rows.push({
      occurredAt: new Date(cols[0]),
      kind: cols[1] === "income" ? "income" : "expense",
      title: cols[2] || "Imported",
      categoryName: cols[3] || "Miscellaneous",
      amountPaise: amount,
      paymentMethod: cols[5] || "UPI",
      notes: cols[7] || undefined,
    });
  }
  return rows;
}

import { parseRupeeInput } from "@/lib/money";
import { inferCategorySlug, inferPaymentMethod } from "./categorize";
import type { ParsedStatementRow } from "./types";

const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

const SKIP_LINE =
  /opening balance|closing balance|statement period|account number|customer id|page \d|total debits|total credits|brought forward|carried forward/i;

const AMOUNT_TAIL =
  /([\d,]+\.\d{2}|\d+\.\d{2})\s*(Dr|Cr|DR|CR|Debit|Credit)?\s*$/;

function parseFlexibleDate(raw: string): Date | null {
  const trimmed = raw.trim();
  const slash = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (slash) {
    const year = slash[3].length === 2 ? 2000 + Number(slash[3]) : Number(slash[3]);
    const date = new Date(year, Number(slash[2]) - 1, Number(slash[1]), Number(slash[4] ?? 0), Number(slash[5] ?? 0), Number(slash[6] ?? 0));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const named = trimmed.match(/^(\d{1,2})[\s\-]([A-Za-z]{3})[\s\-](\d{2,4})(?:\s+(\d{1,2}):(\d{2}))?$/);
  if (named) {
    const month = MONTHS[named[2].toLowerCase()];
    if (month == null) return null;
    const year = named[3].length === 2 ? 2000 + Number(named[3]) : Number(named[3]);
    const date = new Date(year, month, Number(named[1]), Number(named[4] ?? 0), Number(named[5] ?? 0));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const iso = new Date(trimmed);
  return Number.isNaN(iso.getTime()) ? null : iso;
}

function parseLine(line: string, index: number): ParsedStatementRow | null {
  const cleaned = line.replace(/\s+/g, " ").trim();
  if (!cleaned || cleaned.length < 8 || SKIP_LINE.test(cleaned)) return null;

  const amountMatch = cleaned.match(AMOUNT_TAIL);
  if (!amountMatch) return null;

  const amountPaise = parseRupeeInput(amountMatch[1]);
  if (amountPaise <= 0) return null;

  const beforeAmount = cleaned.slice(0, amountMatch.index).trim();
  const dateMatch = beforeAmount.match(/^(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?|\d{1,2}[\s\-][A-Za-z]{3}[\s\-]\d{2,4}(?:\s+\d{1,2}:\d{2})?)/);
  if (!dateMatch) return null;

  const occurredAt = parseFlexibleDate(dateMatch[0]);
  if (!occurredAt) return null;

  let remainder = beforeAmount.slice(dateMatch[0].length).trim();
  const timeOnly = remainder.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s+/);
  if (timeOnly) {
    occurredAt.setHours(Number(timeOnly[1]), Number(timeOnly[2]), Number(timeOnly[3] ?? 0), 0);
    remainder = remainder.slice(timeOnly[0].length).trim();
  }

  const title = remainder.replace(/\s+/g, " ");
  if (!title || title.length < 2) return null;

  const side = (amountMatch[2] ?? "").toLowerCase();
  const kind = side.startsWith("cr") || /credit|deposit|salary|refund/i.test(title) ? "income" : "expense";

  return {
    id: `pdf-${index}-${occurredAt.getTime()}`,
    kind,
    title,
    amountPaise,
    occurredAt,
    paymentMethod: inferPaymentMethod(title),
    categorySlug: inferCategorySlug(title),
    rawLine: cleaned,
    selected: true,
  };
}

export function parsePdfText(text: string): ParsedStatementRow[] {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const rows: ParsedStatementRow[] = [];

  for (let i = 0; i < lines.length; i++) {
    const row = parseLine(lines[i], i);
    if (row) rows.push(row);
  }

  return rows;
}

export async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

  const buffer = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buffer }).promise;
  const chunks: string[] = [];

  for (let page = 1; page <= doc.numPages; page++) {
    const pageData = await doc.getPage(page);
    const content = await pageData.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    chunks.push(pageText);
  }

  return chunks.join("\n");
}

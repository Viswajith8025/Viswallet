import { parseBankCsv } from "./parse-bank-csv";
import { extractPdfText, parsePdfText } from "./parse-pdf";
import type { ParsedStatementRow } from "./types";
import { STATEMENT_MAX_BYTES } from "./types";

export function validateStatementFile(file: File): void {
  if (file.size === 0) throw new Error("The file is empty.");
  if (file.size > STATEMENT_MAX_BYTES) throw new Error("File is too large. Maximum size is 10 MB.");

  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  const allowed =
    name.endsWith(".pdf") ||
    name.endsWith(".csv") ||
    name.endsWith(".txt") ||
    type.includes("pdf") ||
    type.includes("csv") ||
    type.includes("text");

  if (!allowed) throw new Error("Unsupported file type. Upload a PDF, CSV, or TXT bank statement.");
}

export async function parseStatementFile(file: File): Promise<ParsedStatementRow[]> {
  validateStatementFile(file);

  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf") || file.type.includes("pdf")) {
    const text = await extractPdfText(file);
    const rows = parsePdfText(text);
    if (rows.length === 0) {
      throw new Error("Could not read transactions from this PDF. Try exporting CSV from your bank app.");
    }
    return rows;
  }

  const text = await file.text();
  const csvRows = parseBankCsv(text);
  if (csvRows.length > 0) return csvRows;

  const pdfLikeRows = parsePdfText(text);
  if (pdfLikeRows.length > 0) return pdfLikeRows;

  throw new Error("No transactions found. Use a bank CSV export or a text-based statement PDF.");
}

import { describe, expect, it } from "vitest";
import { inferCategorySlug, inferPaymentMethod } from "@/lib/import/categorize";
import { parseBankCsv } from "@/lib/import/parse-bank-csv";
import { parsePdfText } from "@/lib/import/parse-pdf";

describe("statement import", () => {
  it("infers categories from merchant keywords", () => {
    expect(inferCategorySlug("UPI-SWIGGY BANGALORE")).toBe("food");
    expect(inferCategorySlug("UBER TRIP")).toBe("transport");
    expect(inferCategorySlug("AMAZON PAY")).toBe("shopping");
  });

  it("infers payment methods from narration", () => {
    expect(inferPaymentMethod("UPI/123456/swiggy")).toBe("UPI");
    expect(inferPaymentMethod("NEFT CREDIT SALARY")).toBe("Net Banking");
    expect(inferPaymentMethod("POS DEBIT CARD")).toBe("Card");
  });

  it("parses bank csv with debit and credit columns", () => {
    const csv = [
      "Date,Narration,Withdrawal Amt.,Deposit Amt.",
      "01/04/2024,UPI-SWIGGY,250.00,",
      "02/04/2024,SALARY CREDIT,,50000.00",
    ].join("\n");

    const rows = parseBankCsv(csv);
    expect(rows).toHaveLength(2);
    expect(rows[0].kind).toBe("expense");
    expect(rows[0].amountPaise).toBe(25000);
    expect(rows[1].kind).toBe("income");
    expect(rows[1].amountPaise).toBe(5000000);
  });

  it("parses pdf-like text lines with date and amount", () => {
    const text = [
      "01/04/2024 UPI-ZOMATO 420.00 Dr",
      "02/04/2024 14:30 NEFT SALARY 75000.00 Cr",
    ].join("\n");

    const rows = parsePdfText(text);
    expect(rows).toHaveLength(2);
    expect(rows[0].title).toContain("ZOMATO");
    expect(rows[0].occurredAt.getHours()).toBe(0);
    expect(rows[1].kind).toBe("income");
    expect(rows[1].occurredAt.getHours()).toBe(14);
  });
});

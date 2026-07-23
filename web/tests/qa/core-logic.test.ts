import { describe, it, expect } from "vitest";
import { formatINR, parseRupeeInput, parseInterestRate, rupeeToPaise } from "@/lib/money";
import { subscriptionMonthlyPaise } from "@/lib/money/subscription";
import { getMonthKey, formatCycleLabel } from "@/lib/salary-cycle";
import { transactionFingerprint } from "@/lib/db/integrity";
import { findDuplicateTransactions } from "@/lib/engines/premium/duplicate-detector";
import type { Transaction } from "@/lib/db/types";

describe("parseRupeeInput", () => {
  it("parses valid amounts", () => {
    expect(parseRupeeInput("100")).toBe(10000);
    expect(parseRupeeInput("99.50")).toBe(9950);
    expect(parseRupeeInput("₹1,234.56")).toBe(123456);
  });

  it("returns 0 for invalid input", () => {
    expect(parseRupeeInput("")).toBe(0);
    expect(parseRupeeInput("abc")).toBe(0);
    expect(parseRupeeInput("-50")).toBe(0);
  });

  it("rejects multiple decimal points", () => {
    expect(parseRupeeInput("1.2.3")).toBe(0);
  });
});

describe("formatINR", () => {
  it("formats Indian locale", () => {
    expect(formatINR(100000)).toContain("1,000");
    expect(formatINR(0)).toMatch(/₹|INR/);
  });

  it("compact notation for large values", () => {
    const compact = formatINR(10_000_000_00, true);
    expect(compact.length).toBeLessThan(formatINR(10_000_000_00).length);
  });
});

describe("subscriptionMonthlyPaise", () => {
  it("normalizes billing cycles", () => {
    expect(subscriptionMonthlyPaise({ amountPaise: 120000, billingCycle: "yearly" })).toBe(10000);
    expect(subscriptionMonthlyPaise({ amountPaise: 10000, billingCycle: "weekly" })).toBe(40000);
    expect(subscriptionMonthlyPaise({ amountPaise: 50000, billingCycle: "monthly" })).toBe(50000);
  });
});

describe("getMonthKey salary cycle", () => {
  it("assigns pre-salary-day dates to previous cycle", () => {
    // Salary on 25th: March 20 belongs to February cycle (2026-02)
    const key = getMonthKey(new Date(2026, 2, 20), 25);
    expect(key).toBe("2026-02");
  });

  it("assigns post-salary-day dates to current cycle", () => {
    const key = getMonthKey(new Date(2026, 2, 26), 25);
    expect(key).toBe("2026-03");
  });

  it("clamps salary day to 28", () => {
    const key = getMonthKey(new Date(2026, 0, 31), 31);
    expect(key).toMatch(/^\d{4}-\d{2}$/);
  });
});

describe("transactionFingerprint timezone", () => {
  it("uses local calendar day for duplicate detection", () => {
    const localLate = new Date(2026, 0, 15, 23, 30, 0);
    const fp = transactionFingerprint({
      title: "Test",
      amountPaise: 10000,
      categoryId: 1,
      occurredAt: localLate,
    });
    const localDay = `${localLate.getFullYear()}-${String(localLate.getMonth() + 1).padStart(2, "0")}-${String(localLate.getDate()).padStart(2, "0")}`;
    expect(fp.startsWith(localDay)).toBe(true);
  });
});

describe("findDuplicateTransactions", () => {
  const base: Omit<Transaction, "id"> = {
    kind: "expense",
    title: "Coffee",
    amountPaise: 50000,
    categoryId: 1,
    paymentMethod: "UPI",
    monthKey: "2026-03",
    tags: [],
    isRecurring: false,
    isDeleted: false,
    occurredAt: new Date(2026, 2, 10),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it("groups same-day duplicates", () => {
    const txns: Transaction[] = [
      { ...base, id: 1 },
      { ...base, id: 2, title: "coffee" },
    ];
    const groups = findDuplicateTransactions(txns);
    expect(groups.length).toBe(1);
    expect(groups[0].transactions.length).toBe(2);
  });

  it("ignores different amounts", () => {
    const txns: Transaction[] = [
      { ...base, id: 1 },
      { ...base, id: 2, amountPaise: 60000 },
    ];
    expect(findDuplicateTransactions(txns).length).toBe(0);
  });
});

describe("rupeeToPaise edge cases", () => {
  it("rejects non-finite values", () => {
    expect(rupeeToPaise(NaN)).toBe(0);
    expect(rupeeToPaise(Infinity)).toBe(0);
    expect(rupeeToPaise(-1)).toBe(0);
  });
});

describe("parseInterestRate", () => {
  it("clamps to 0–100", () => {
    expect(parseInterestRate("8.5")).toBe(8.5);
    expect(parseInterestRate("150")).toBe(100);
    expect(parseInterestRate("1.2.3")).toBe(0);
  });
});

describe("formatCycleLabel", () => {
  it("formats month keys", () => {
    expect(formatCycleLabel("2026-03")).toBe("Mar 2026");
  });
});

describe("security sanitization", () => {
  it("escapes HTML for print/export", async () => {
    const { escapeHtml } = await import("@/lib/security");
    expect(escapeHtml('<script>alert("x")</script>')).toBe(
      "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;",
    );
  });

  it("prefixes spreadsheet formula injection in CSV", async () => {
    const { escapeCsvFormula } = await import("@/lib/security");
    expect(escapeCsvFormula("=1+1")).toBe("'=1+1");
    expect(escapeCsvFormula("normal")).toBe("normal");
  });

  it("strips PIN material from settings backups", async () => {
    const { stripSensitiveSettings } = await import("@/lib/security");
    const result = stripSensitiveSettings([
      {
        id: "default",
        pinHash: "hash",
        pinSalt: "salt",
        failedPinAttempts: 3,
        pinLockedUntil: "2026-01-01",
        theme: "system",
      },
    ]);
    expect(result[0]).not.toHaveProperty("pinHash");
    expect(result[0]).not.toHaveProperty("pinSalt");
    expect(result[0]).toHaveProperty("theme", "system");
  });
});

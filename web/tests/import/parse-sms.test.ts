import { describe, expect, it } from "vitest";
import { parseSms } from "@/lib/import/parse-sms";

describe("parseSms", () => {
  it("reads a debit SMS", () => {
    const parsed = parseSms("Your a/c is debited by Rs.450.00 on 12 Nov to SWIGGY via UPI");
    expect(parsed).toEqual({ amountPaise: 45000, merchant: "SWIGGY", kind: "expense" });
  });

  it("reads a credit SMS", () => {
    const parsed = parseSms("INR 25,000.00 credited to your account from EMPLOYER");
    expect(parsed?.kind).toBe("income");
    expect(parsed?.amountPaise).toBe(2_500_000);
  });

  it("ignores ordinary text", () => {
    expect(parseSms("see you at 7")).toBeNull();
  });
});

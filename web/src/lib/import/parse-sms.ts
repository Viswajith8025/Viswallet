export type ParsedSms = {
  amountPaise: number;
  merchant: string;
  kind: "expense" | "income";
};

const AMOUNT = /(?:rs\.?|inr|₹)\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)/i;
const DEBIT = /\b(debited|spent|paid|sent|purchase|withdrawn)\b/i;
const CREDIT = /\b(credited|received|refund)\b/i;
const MERCHANT = /\b(?:to|at|towards|for)\s+([A-Za-z][A-Za-z0-9&.'-]{1,40})/;

/** Local bank/UPI SMS parse. Nothing leaves the device. */
export function parseSms(text: string): ParsedSms | null {
  const raw = text.replace(/\s+/g, " ").trim();
  if (raw.length < 8) return null;
  const amountMatch = raw.match(AMOUNT);
  if (!amountMatch?.[1]) return null;
  const rupees = Number(amountMatch[1].replace(/,/g, ""));
  if (!Number.isFinite(rupees) || rupees <= 0) return null;
  const kind: ParsedSms["kind"] = CREDIT.test(raw) && !DEBIT.test(raw) ? "income" : "expense";
  if (!DEBIT.test(raw) && !CREDIT.test(raw) && !/upi|bank|a\/c|acct/i.test(raw)) return null;
  const merchant = raw.match(MERCHANT)?.[1]?.replace(/[.\s]+$/, "").trim() || "Payment";
  return { amountPaise: Math.round(rupees * 100), merchant, kind };
}

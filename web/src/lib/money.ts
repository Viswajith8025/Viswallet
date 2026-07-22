import { clampPaise } from "@/lib/security/sanitize";
import { MAX_AMOUNT_PAISE } from "@/lib/security/constants";

export function paiseToRupee(paise: number): number {
  return paise / 100;
}

export function rupeeToPaise(rupees: number): number {
  if (!Number.isFinite(rupees) || rupees < 0) return 0;
  return clampPaise(Math.round(rupees * 100));
}

export function formatINR(paise: number, compact = false): string {
  const rupees = paiseToRupee(paise);
  if (compact && Math.abs(rupees) >= 100000) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(rupees);
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(rupees);
}

export function parseRupeeInput(value: string): number {
  const num = parseDecimalInput(value);
  if (num === null) return 0;
  const paise = Math.round(num * 100);
  return Math.min(paise, MAX_AMOUNT_PAISE);
}

/** Parse annual interest rate (0–100%). */
export function parseInterestRate(value: string): number {
  const num = parseDecimalInput(value);
  if (num === null) return 0;
  return Math.min(num, 100);
}

function parseDecimalInput(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed || trimmed.startsWith("-")) return null;
  const cleaned = trimmed.replace(/[^\d.]/g, "");
  if (!cleaned || cleaned === ".") return null;
  if (cleaned.split(".").length > 2) return null;
  const num = parseFloat(cleaned);
  if (!Number.isFinite(num) || num < 0) return null;
  return num;
}

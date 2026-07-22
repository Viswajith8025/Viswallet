import type { Subscription } from "@/lib/db/types";

/** Normalize subscription amount to a monthly equivalent in paise. */
export function subscriptionMonthlyPaise(
  sub: Pick<Subscription, "amountPaise" | "billingCycle">,
): number {
  if (sub.billingCycle === "yearly") return Math.round(sub.amountPaise / 12);
  if (sub.billingCycle === "weekly") return sub.amountPaise * 4;
  return sub.amountPaise;
}

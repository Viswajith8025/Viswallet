const KEY_PAYMENT = "vw_last_payment";
const KEY_CATEGORY_EXPENSE = "vw_last_cat_expense";
const KEY_CATEGORY_INCOME = "vw_last_cat_income";

export function getLastPaymentMethod(): string {
  if (typeof window === "undefined") return "UPI";
  return localStorage.getItem(KEY_PAYMENT) ?? "UPI";
}

export function setLastPaymentMethod(method: string): void {
  localStorage.setItem(KEY_PAYMENT, method);
}

export function getLastCategoryId(kind: "expense" | "income"): number | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(kind === "income" ? KEY_CATEGORY_INCOME : KEY_CATEGORY_EXPENSE);
  return raw ? Number(raw) : null;
}

export function setLastCategoryId(kind: "expense" | "income", id: number): void {
  localStorage.setItem(kind === "income" ? KEY_CATEGORY_INCOME : KEY_CATEGORY_EXPENSE, String(id));
}

export function pickDefaultCategoryId(
  kind: "expense" | "income",
  categories: { id?: number; countsTowardSpending: boolean; slug: string }[],
): number | undefined {
  const remembered = getLastCategoryId(kind);
  if (remembered && categories.some((c) => c.id === remembered)) return remembered;
  if (kind === "income") {
    const savings = categories.find((c) => c.slug === "savings");
    if (savings?.id) return savings.id;
  }
  return categories.find((c) => c.countsTowardSpending)?.id ?? categories[0]?.id;
}

export const SALARY_PRESETS = [
  { label: "₹25k", value: 25000 },
  { label: "₹50k", value: 50000 },
  { label: "₹75k", value: 75000 },
  { label: "₹1L", value: 100000 },
  { label: "₹1.5L", value: 150000 },
] as const;

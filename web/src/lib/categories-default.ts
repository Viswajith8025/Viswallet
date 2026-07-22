export interface CategorySeed {
  name: string;
  slug: string;
  iconName: string;
  color: string;
  countsTowardSpending: boolean;
  sortOrder: number;
}

export const DEFAULT_CATEGORIES: CategorySeed[] = [
  { name: "Food & Dining", slug: "food", iconName: "utensils", color: "#F97316", countsTowardSpending: true, sortOrder: 1 },
  { name: "Transport", slug: "transport", iconName: "car", color: "#3B82F6", countsTowardSpending: true, sortOrder: 2 },
  { name: "Shopping", slug: "shopping", iconName: "shopping-bag", color: "#EC4899", countsTowardSpending: true, sortOrder: 3 },
  { name: "Bills & Utilities", slug: "bills", iconName: "receipt", color: "#8B5CF6", countsTowardSpending: true, sortOrder: 4 },
  { name: "Subscriptions", slug: "subscriptions", iconName: "repeat", color: "#6366F1", countsTowardSpending: true, sortOrder: 5 },
  { name: "Entertainment", slug: "entertainment", iconName: "film", color: "#14B8A6", countsTowardSpending: true, sortOrder: 6 },
  { name: "Health", slug: "health", iconName: "heart-pulse", color: "#EF4444", countsTowardSpending: true, sortOrder: 7 },
  { name: "Education", slug: "education", iconName: "graduation-cap", color: "#0EA5E9", countsTowardSpending: true, sortOrder: 8 },
  { name: "Rent", slug: "rent", iconName: "home", color: "#78716C", countsTowardSpending: true, sortOrder: 9 },
  { name: "Recharge", slug: "recharge", iconName: "smartphone", color: "#22C55E", countsTowardSpending: true, sortOrder: 10 },
  { name: "Travel", slug: "travel", iconName: "plane", color: "#06B6D4", countsTowardSpending: true, sortOrder: 11 },
  { name: "Gifts", slug: "gifts", iconName: "gift", color: "#F43F5E", countsTowardSpending: true, sortOrder: 12 },
  { name: "Personal Care", slug: "personal-care", iconName: "sparkles", color: "#A855F7", countsTowardSpending: true, sortOrder: 13 },
  { name: "Investment", slug: "investment", iconName: "trending-up", color: "#10B981", countsTowardSpending: false, sortOrder: 14 },
  { name: "Savings", slug: "savings", iconName: "piggy-bank", color: "#059669", countsTowardSpending: false, sortOrder: 15 },
  { name: "Miscellaneous", slug: "misc", iconName: "circle-dot", color: "#64748B", countsTowardSpending: true, sortOrder: 16 },
];

export const PAYMENT_METHODS = ["UPI", "Cash", "Card", "Net Banking", "Auto Debit", "Other"] as const;

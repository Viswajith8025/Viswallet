export interface CategorySeed {

  name: string;

  slug: string;

  iconName: string;

  color: string;

  countsTowardSpending: boolean;

  sortOrder: number;

}



/** Curated violet-scale palette — distinguishable yet on-brand */

export const CATEGORY_COLOR_PALETTE = [

  "#5f4a8b",

  "#7560a0",

  "#8b78b4",

  "#6b5a96",

  "#4f3d77",

  "#a191c4",

  "#3d7a62",

  "#8b5a6b",

  "#5a5570",

  "#9a7b2e",

  "#7a6b9e",

  "#b7aad4",

  "#3d3058",

  "#4a8f75",

  "#cdc3e4",

  "#6b6080",

] as const;



export const DEFAULT_CATEGORY_COLOR = CATEGORY_COLOR_PALETTE[0];



export const DEFAULT_CATEGORIES: CategorySeed[] = [

  { name: "Food & Dining", slug: "food", iconName: "utensils", color: CATEGORY_COLOR_PALETTE[0], countsTowardSpending: true, sortOrder: 1 },

  { name: "Transport", slug: "transport", iconName: "car", color: CATEGORY_COLOR_PALETTE[1], countsTowardSpending: true, sortOrder: 2 },

  { name: "Shopping", slug: "shopping", iconName: "shopping-bag", color: CATEGORY_COLOR_PALETTE[2], countsTowardSpending: true, sortOrder: 3 },

  { name: "Bills & Utilities", slug: "bills", iconName: "receipt", color: CATEGORY_COLOR_PALETTE[3], countsTowardSpending: true, sortOrder: 4 },

  { name: "Subscriptions", slug: "subscriptions", iconName: "repeat", color: CATEGORY_COLOR_PALETTE[4], countsTowardSpending: true, sortOrder: 5 },

  { name: "Entertainment", slug: "entertainment", iconName: "film", color: CATEGORY_COLOR_PALETTE[5], countsTowardSpending: true, sortOrder: 6 },

  { name: "Health", slug: "health", iconName: "heart-pulse", color: CATEGORY_COLOR_PALETTE[6], countsTowardSpending: true, sortOrder: 7 },

  { name: "Education", slug: "education", iconName: "graduation-cap", color: CATEGORY_COLOR_PALETTE[7], countsTowardSpending: true, sortOrder: 8 },

  { name: "Rent", slug: "rent", iconName: "home", color: CATEGORY_COLOR_PALETTE[8], countsTowardSpending: true, sortOrder: 9 },

  { name: "Recharge", slug: "recharge", iconName: "smartphone", color: CATEGORY_COLOR_PALETTE[9], countsTowardSpending: true, sortOrder: 10 },

  { name: "Travel", slug: "travel", iconName: "plane", color: CATEGORY_COLOR_PALETTE[10], countsTowardSpending: true, sortOrder: 11 },

  { name: "Gifts", slug: "gifts", iconName: "gift", color: CATEGORY_COLOR_PALETTE[11], countsTowardSpending: true, sortOrder: 12 },

  { name: "Personal Care", slug: "personal-care", iconName: "sparkles", color: CATEGORY_COLOR_PALETTE[12], countsTowardSpending: true, sortOrder: 13 },

  { name: "Investment", slug: "investment", iconName: "trending-up", color: CATEGORY_COLOR_PALETTE[13], countsTowardSpending: false, sortOrder: 14 },

  { name: "Savings", slug: "savings", iconName: "piggy-bank", color: CATEGORY_COLOR_PALETTE[14], countsTowardSpending: false, sortOrder: 15 },

  { name: "Miscellaneous", slug: "misc", iconName: "circle-dot", color: CATEGORY_COLOR_PALETTE[15], countsTowardSpending: true, sortOrder: 16 },

];



export const PAYMENT_METHODS = ["UPI", "Cash", "Card", "Net Banking", "Auto Debit", "Other"] as const;


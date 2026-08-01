export interface CategorySeed {
  name: string;
  slug: string;
  iconName: string;
  color: string;
  countsTowardSpending: boolean;
  sortOrder: number;
}

/** Curated palette — distinguishable yet on-brand */
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
  "#c45c8a",
  "#e07a5f",
  "#2a9d8f",
  "#457b9d",
  "#6d597a",
  "#b5838d",
  "#e5989b",
  "#ffb703",
  "#8ecae6",
  "#219ebc",
  "#023047",
  "#588157",
  "#a3b18a",
  "#dad7cd",
  "#bc6c25",
  "#dda15e",
  "#606c38",
  "#283618",
  "#7f5539",
  "#9c6644",
  "#5c4d7d",
  "#9d8189",
] as const;

export const DEFAULT_CATEGORY_COLOR = CATEGORY_COLOR_PALETTE[0];

function colorAt(index: number): string {
  return CATEGORY_COLOR_PALETTE[index % CATEGORY_COLOR_PALETTE.length];
}

export const DEFAULT_CATEGORIES: CategorySeed[] = [
  { name: "Food & Dining", slug: "food", iconName: "utensils", color: colorAt(0), countsTowardSpending: true, sortOrder: 1 },
  { name: "Groceries", slug: "groceries", iconName: "shopping-cart", color: colorAt(1), countsTowardSpending: true, sortOrder: 2 },
  { name: "Coffee & Snacks", slug: "coffee", iconName: "coffee", color: colorAt(2), countsTowardSpending: true, sortOrder: 3 },
  { name: "Transport", slug: "transport", iconName: "car", color: colorAt(3), countsTowardSpending: true, sortOrder: 4 },
  { name: "Fuel & Petrol", slug: "fuel", iconName: "fuel", color: colorAt(4), countsTowardSpending: true, sortOrder: 5 },
  { name: "Shopping", slug: "shopping", iconName: "shopping-bag", color: colorAt(5), countsTowardSpending: true, sortOrder: 6 },
  { name: "Rent", slug: "rent", iconName: "home", color: colorAt(6), countsTowardSpending: true, sortOrder: 7 },
  { name: "Electricity", slug: "electricity", iconName: "zap", color: colorAt(7), countsTowardSpending: true, sortOrder: 8 },
  { name: "Water", slug: "water", iconName: "droplets", color: colorAt(8), countsTowardSpending: true, sortOrder: 9 },
  { name: "Gas (Utility)", slug: "gas-utility", iconName: "flame", color: colorAt(9), countsTowardSpending: true, sortOrder: 10 },
  { name: "Internet & WiFi", slug: "internet", iconName: "wifi", color: colorAt(10), countsTowardSpending: true, sortOrder: 11 },
  { name: "Mobile Recharge", slug: "recharge", iconName: "smartphone", color: colorAt(11), countsTowardSpending: true, sortOrder: 12 },
  { name: "Bills & Utilities", slug: "bills", iconName: "receipt", color: colorAt(12), countsTowardSpending: true, sortOrder: 13 },
  { name: "Spotify", slug: "spotify", iconName: "music-2", color: colorAt(13), countsTowardSpending: true, sortOrder: 14 },
  { name: "YouTube", slug: "youtube", iconName: "play-circle", color: colorAt(14), countsTowardSpending: true, sortOrder: 15 },
  { name: "Netflix", slug: "netflix", iconName: "clapperboard", color: colorAt(15), countsTowardSpending: true, sortOrder: 16 },
  { name: "Amazon Prime", slug: "amazon-prime", iconName: "package", color: colorAt(16), countsTowardSpending: true, sortOrder: 17 },
  { name: "Subscriptions", slug: "subscriptions", iconName: "repeat", color: colorAt(17), countsTowardSpending: true, sortOrder: 18 },
  { name: "Entertainment", slug: "entertainment", iconName: "film", color: colorAt(18), countsTowardSpending: true, sortOrder: 19 },
  { name: "Gaming", slug: "gaming", iconName: "gamepad-2", color: colorAt(19), countsTowardSpending: true, sortOrder: 20 },
  { name: "Health & Medical", slug: "health", iconName: "heart-pulse", color: colorAt(20), countsTowardSpending: true, sortOrder: 21 },
  { name: "Gym & Fitness", slug: "gym", iconName: "dumbbell", color: colorAt(21), countsTowardSpending: true, sortOrder: 22 },
  { name: "Education", slug: "education", iconName: "graduation-cap", color: colorAt(22), countsTowardSpending: true, sortOrder: 23 },
  { name: "Travel", slug: "travel", iconName: "plane", color: colorAt(23), countsTowardSpending: true, sortOrder: 24 },
  { name: "Hotels", slug: "hotels", iconName: "bed-double", color: colorAt(24), countsTowardSpending: true, sortOrder: 25 },
  { name: "Gifts", slug: "gifts", iconName: "gift", color: colorAt(25), countsTowardSpending: true, sortOrder: 26 },
  { name: "Personal Care", slug: "personal-care", iconName: "sparkles", color: colorAt(26), countsTowardSpending: true, sortOrder: 27 },
  { name: "Insurance", slug: "insurance", iconName: "shield", color: colorAt(27), countsTowardSpending: true, sortOrder: 28 },
  { name: "EMI & Credit", slug: "emi", iconName: "credit-card", color: colorAt(28), countsTowardSpending: true, sortOrder: 29 },
  { name: "Charity", slug: "charity", iconName: "heart-handshake", color: colorAt(29), countsTowardSpending: true, sortOrder: 30 },
  { name: "Pets", slug: "pets", iconName: "paw-print", color: colorAt(30), countsTowardSpending: true, sortOrder: 31 },
  { name: "Kids & Family", slug: "family", iconName: "baby", color: colorAt(31), countsTowardSpending: true, sortOrder: 32 },
  { name: "Office & Work", slug: "work", iconName: "briefcase", color: colorAt(32), countsTowardSpending: true, sortOrder: 33 },
  { name: "Taxes", slug: "taxes", iconName: "landmark", color: colorAt(33), countsTowardSpending: true, sortOrder: 34 },
  { name: "Investment", slug: "investment", iconName: "trending-up", color: colorAt(34), countsTowardSpending: false, sortOrder: 35 },
  { name: "Salary", slug: "salary", iconName: "banknote", color: colorAt(35), countsTowardSpending: false, sortOrder: 36 },
  { name: "Savings & Refunds", slug: "savings", iconName: "piggy-bank", color: colorAt(36), countsTowardSpending: false, sortOrder: 37 },
  { name: "Miscellaneous", slug: "misc", iconName: "circle-dot", color: colorAt(37), countsTowardSpending: true, sortOrder: 38 },
];

export const PAYMENT_METHODS = ["UPI", "Cash", "Card", "Net Banking", "Auto Debit", "Other"] as const;

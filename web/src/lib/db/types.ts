export type ThemeMode = "system" | "light" | "dark";
export type AccentColor = "ocean" | "emerald" | "violet" | "rose" | "amber" | "slate";
export type TransactionKind = "expense" | "income";
export type LoanDirection = "lent_by_me" | "borrowed_by_me";
export type LoanStatus = "pending" | "partial" | "returned";
export type BillingCycle = "weekly" | "monthly" | "yearly";
export type BillStatus = "upcoming" | "paid" | "overdue";
export type NotificationType = "info" | "warning" | "success" | "bill" | "emi" | "insight" | "goal" | "duplicate" | "subscription";
export type AccountType = "cash" | "bank" | "wallet" | "credit" | "investment" | "other";
export type DashboardWidgetId =
  | "hero"
  | "stats"
  | "insights"
  | "recent"
  | "obligations"
  | "forecast"
  | "net-worth"
  | "achievements"
  | "heatmap";

export const DASHBOARD_WIDGET_LABELS: Record<DashboardWidgetId, string> = {
  hero: "Hero balance card",
  stats: "Summary stats",
  insights: "Smart insights",
  recent: "Recent activity",
  obligations: "Needs your attention",
  forecast: "Forecast preview",
  "net-worth": "Net worth snapshot",
  achievements: "Achievements progress",
  heatmap: "Spending heatmap",
};

export interface Profile {
  id: 1;
  displayName: string;
  email?: string;
  avatarUrl?: string;
  currencyCode: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AppSettings {
  id: 1;
  themeMode: ThemeMode;
  accentColor: AccentColor;
  salaryDay: number;
  majorExpenseThresholdPaise: number;
  onboardingComplete: boolean;
  compactMode: boolean;
  appLockEnabled: boolean;
  biometricEnabled: boolean;
  pinHash?: string;
  pinSalt?: string;
  failedPinAttempts: number;
  pinLockedUntil?: Date;
  autoLockMinutes: number;
  dashboardWidgets: DashboardWidgetId[];
  lastBackupAt?: Date;
  lastSalaryPromptDate?: string;
  aiFeaturesEnabled?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Account {
  id?: number;
  name: string;
  type: AccountType;
  institution?: string;
  balancePaise: number;
  color: string;
  iconName: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MonthlySnapshot {
  id?: number;
  monthKey: string;
  incomePaise: number;
  expensePaise: number;
  netWorthPaise: number;
  savingsRate: number;
  recordedAt: Date;
}

export interface SecureNote {
  id?: number;
  title: string;
  body: string;
  tags: string[];
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransactionAttachment {
  id?: number;
  transactionId: number;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  data: Blob;
  createdAt: Date;
}

export interface Achievement {
  id?: number;
  achievementKey: string;
  title: string;
  description: string;
  iconName: string;
  unlockedAt?: Date;
  progress: number;
  target: number;
}

export interface Category {
  id?: number;
  name: string;
  slug: string;
  iconName: string;
  color: string;
  isSystem: boolean;
  countsTowardSpending: boolean;
  sortOrder: number;
  isDeleted: boolean;
  rowVersion?: number;
}

export interface Transaction {
  id?: number;
  kind: TransactionKind;
  amountPaise: number;
  categoryId: number;
  accountId?: number;
  title: string;
  description?: string;
  occurredAt: Date;
  monthKey: string;
  paymentMethod: string;
  tags: string[];
  notes?: string;
  isRecurring: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
  rowVersion?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MonthlySalary {
  id?: number;
  monthKey: string;
  amountPaise: number;
  carryOverPaise?: number;
  receivedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BudgetPlan {
  id?: number;
  monthKey: string;
  salaryPaise: number;
  allocationMode: "percentage" | "manual";
  rolloverEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BudgetBucket {
  id?: number;
  planId: number;
  bucketKey: string;
  displayName: string;
  categoryId?: number;
  bucketType: "spending" | "reserve" | "investment";
  allocatedPaise: number;
  allocatedPercent?: number;
  rolloverPaise: number;
  sortOrder: number;
}

export interface Loan {
  id?: number;
  personName: string;
  direction: LoanDirection;
  principalPaise: number;
  balancePaise: number;
  reason?: string;
  borrowedAt: Date;
  expectedReturnAt?: Date;
  status: LoanStatus;
  notes?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoanPayment {
  id?: number;
  loanId: number;
  amountPaise: number;
  paidAt: Date;
  notes?: string;
  transactionId?: number;
  createdAt: Date;
}

export interface Subscription {
  id?: number;
  name: string;
  amountPaise: number;
  categoryId?: number;
  billingCycle: BillingCycle;
  nextRenewalAt?: Date;
  paymentMethod: string;
  isActive: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Bill {
  id?: number;
  name: string;
  amountPaise: number;
  categoryId?: number;
  dueAt: Date;
  status: BillStatus;
  isRecurring: boolean;
  paidAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Emi {
  id?: number;
  name: string;
  lender: string;
  principalPaise: number;
  emiAmountPaise: number;
  balancePaise: number;
  interestRate: number;
  tenureMonths: number;
  paidMonths: number;
  nextDueAt: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SavingsGoal {
  id?: number;
  name: string;
  targetPaise: number;
  savedPaise: number;
  monthlyContributionPaise: number;
  targetDate?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WishlistItem {
  id?: number;
  name: string;
  targetPaise: number;
  savedPaise: number;
  priority: "low" | "medium" | "high";
  url?: string;
  notes?: string;
  isPurchased: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Investment {
  id?: number;
  name: string;
  type: "mutual_fund" | "stock" | "fd" | "gold" | "crypto" | "other";
  investedPaise: number;
  currentValuePaise: number;
  platform?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AppNotification {
  id?: number;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  href?: string;
  createdAt: Date;
}

export interface AuditLog {
  id?: number;
  action: string;
  entityType?: string;
  entityId?: number;
  detail?: string;
  success: boolean;
  createdAt: Date;
}

export const DEFAULT_DASHBOARD_WIDGETS: DashboardWidgetId[] = [
  "hero",
  "stats",
  "insights",
  "recent",
  "obligations",
];

export const ACCENT_PALETTES: Record<AccentColor, { primary: string; ring: string }> = {
  ocean: { primary: "#5f4a8b", ring: "#7560a0" },
  violet: { primary: "#5f4a8b", ring: "#7560a0" },
  emerald: { primary: "#3d7a62", ring: "#4a8f75" },
  rose: { primary: "#8b5a6b", ring: "#a06b7d" },
  amber: { primary: "#9a7b2e", ring: "#b8943a" },
  slate: { primary: "#5a5570", ring: "#6b6580" },
};

export const ACHIEVEMENT_DEFINITIONS = [
  { key: "first_transaction", title: "First Step", description: "Record your first transaction", iconName: "Receipt", target: 1 },
  { key: "ten_transactions", title: "Getting Started", description: "Log 10 transactions", iconName: "List", target: 10 },
  { key: "first_goal", title: "Dream Builder", description: "Create a savings goal", iconName: "Target", target: 1 },
  { key: "saved_10k", title: "Saver", description: "Save ₹10,000 toward goals", iconName: "PiggyBank", target: 10_000_00 },
  { key: "saved_1lakh", title: "Wealth Builder", description: "Save ₹1,00,000 toward goals", iconName: "TrendingUp", target: 100_000_00 },
  { key: "budget_master", title: "Budget Master", description: "Finish a cycle under budget", iconName: "Award", target: 1 },
  { key: "debt_free", title: "Debt Free", description: "Clear all borrowed balances", iconName: "Shield", target: 1 },
  { key: "investment_starter", title: "Investor", description: "Add your first investment", iconName: "LineChart", target: 1 },
  { key: "backup_created", title: "Vault Keeper", description: "Create a data backup", iconName: "HardDrive", target: 1 },
  { key: "streak_7", title: "Consistent", description: "Log transactions 7 days in a row", iconName: "Flame", target: 7 },
] as const;

export const DEFAULT_BUDGET_BUCKETS = [
  { bucketKey: "savings", displayName: "Savings", percent: 20, bucketType: "reserve" as const },
  { bucketKey: "food", displayName: "Food", percent: 15, bucketType: "spending" as const },
  { bucketKey: "transport", displayName: "Transport", percent: 10, bucketType: "spending" as const },
  { bucketKey: "subscriptions", displayName: "Subscriptions", percent: 5, bucketType: "spending" as const },
  { bucketKey: "entertainment", displayName: "Entertainment", percent: 10, bucketType: "spending" as const },
  { bucketKey: "shopping", displayName: "Shopping", percent: 15, bucketType: "spending" as const },
  { bucketKey: "emergency", displayName: "Emergency Fund", percent: 10, bucketType: "reserve" as const },
  { bucketKey: "investments", displayName: "Investments", percent: 10, bucketType: "investment" as const },
  { bucketKey: "misc", displayName: "Miscellaneous", percent: 5, bucketType: "spending" as const },
];

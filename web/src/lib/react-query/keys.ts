/** Central React Query key factories — keeps invalidation predictable. */
export const queryKeys = {
  settings: ["settings"] as const,
  categories: ["categories"] as const,
  categoriesVersioned: (version: number) => ["categories", version] as const,
  dexie: (key: string, version: number) => ["dexie", key, version] as const,
  accounts: ["accounts"] as const,
  accountsActive: ["accounts", "active"] as const,
  accountTransfers: ["account-transfers"] as const,
  budgetBuckets: (monthKey: string, salaryPaise: number) =>
    ["budget-buckets", monthKey, salaryPaise] as const,
  netWorthTrend: ["net-worth-trend"] as const,
  debtPlanner: ["debt-planner"] as const,
  secureNotes: ["secure-notes"] as const,
  achievements: ["achievements"] as const,
};

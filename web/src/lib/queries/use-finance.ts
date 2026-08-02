"use client";

import { useQuery } from "@tanstack/react-query";
import { loadFinanceSnapshot } from "@/lib/engines/finance-snapshot";
import { selectCycleKey, useFilterStore } from "@/lib/store/filter-store";
import { getSettings } from "@/lib/db";
import { getCurrentCycleKey } from "@/lib/salary-cycle";

export const financeKeys = {
  all: ["finance"] as const,
  snapshot: (monthKey?: string) => ["finance", "snapshot", monthKey ?? "current"] as const,
  notifications: ["notifications"] as const,
  notificationsUnread: ["notifications", "unread"] as const,
};

export function useFinanceSnapshot() {
  const cycleKey = useFilterStore(selectCycleKey);

  return useQuery({
    queryKey: financeKeys.snapshot(cycleKey ?? undefined),
    queryFn: async () => {
      const settings = await getSettings();
      const key = cycleKey ?? getCurrentCycleKey(settings.salaryDay);
      return loadFinanceSnapshot(key);
    },
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    placeholderData: (previousData) => previousData,
  });
}

export { useCategories } from "@/hooks/use-categories";

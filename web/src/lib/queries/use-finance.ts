"use client";

import { useQuery } from "@tanstack/react-query";
import { loadFinanceSnapshot } from "@/lib/engines/finance-snapshot";
import { useFilterStore } from "@/lib/store/filter-store";
import { getSettings } from "@/lib/db";
import { getCurrentCycleKey } from "@/lib/salary-cycle";

export const financeKeys = {
  all: ["finance"] as const,
  snapshot: (monthKey?: string) => ["finance", "snapshot", monthKey ?? "current"] as const,
  notifications: ["notifications"] as const,
  notificationsUnread: ["notifications", "unread"] as const,
};

export function useFinanceSnapshot() {
  const cycleKey = useFilterStore((s) => s.cycleKey);

  return useQuery({
    queryKey: financeKeys.snapshot(cycleKey ?? undefined),
    queryFn: async () => {
      const settings = await getSettings();
      const key = cycleKey ?? getCurrentCycleKey(settings.salaryDay);
      return loadFinanceSnapshot(key);
    },
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}
export function useCategories() {
  const { data } = useFinanceSnapshot();
  return data?.categories ?? [];
}

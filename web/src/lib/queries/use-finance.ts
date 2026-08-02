"use client";

import { useQuery } from "@tanstack/react-query";
import { loadFinanceSnapshot } from "@/lib/engines/finance-snapshot";
import { useFilterStore } from "@/lib/store/filter-store";
import { getSettings } from "@/lib/db";
import { getCurrentCycleKey } from "@/lib/salary-cycle";

export const financeKeys = {
  all: ["finance"] as const,
  snapshot: (monthKey?: string, accountId?: number | null) =>
    ["finance", "snapshot", monthKey ?? "current", accountId ?? "all"] as const,
  notifications: ["notifications"] as const,
  notificationsUnread: ["notifications", "unread"] as const,
};

export function useFinanceSnapshot() {
  const cycleKey = useFilterStore((s) => s.cycleKey);
  const accountId = useFilterStore((s) => s.accountId);

  return useQuery({
    queryKey: financeKeys.snapshot(cycleKey ?? undefined, accountId),
    queryFn: async () => {
      const settings = await getSettings();
      const key = cycleKey ?? getCurrentCycleKey(settings.salaryDay);
      return loadFinanceSnapshot(key, accountId);
    },
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    placeholderData: (previousData) => previousData,
  });
}
export function useCategories() {
  const { data } = useFinanceSnapshot();
  return data?.categories ?? [];
}

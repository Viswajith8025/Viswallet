"use client";

import { useQuery } from "@tanstack/react-query";
import { getActiveCategories } from "@/lib/db";
import { useDb } from "@/components/providers/db-provider";

/** Live category list — keyed to Dexie version so new categories appear immediately. */
export function useCategoriesQuery() {
  const { version } = useDb();

  return useQuery({
    queryKey: ["categories", version],
    queryFn: getActiveCategories,
    staleTime: 5_000,
  });
}

export function useCategories() {
  const { data = [] } = useCategoriesQuery();
  return data;
}

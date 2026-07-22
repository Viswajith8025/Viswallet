"use client";

import { useQuery } from "@tanstack/react-query";
import { useDb } from "@/components/providers/db-provider";

type DexieFetcher<T> = () => Promise<T[]>;

/**
 * React Query wrapper for Dexie table reads.
 * Replaces useEffect + useState patterns across CRUD pages.
 */
export function useDexieTable<T>(key: string, fetcher: DexieFetcher<T>) {
  const { version } = useDb();

  return useQuery({
    queryKey: ["dexie", key, version],
    queryFn: fetcher,
    staleTime: 30_000,
  });
}

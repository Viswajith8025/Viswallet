"use client";

import { useDb } from "@/components/providers/db-provider";

/** Invalidate finance snapshot + Dexie table caches after a mutation. */
export function useInvalidateFinance() {
  return useDb().refresh;
}

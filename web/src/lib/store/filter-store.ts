import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TransactionKind } from "@/lib/db/types";

export type GlobalFilters = {
  cycleKey: string | null;
  kind: TransactionKind | "all";
  categoryId: number | null;
  minAmountPaise: number | null;
  maxAmountPaise: number | null;
  searchQuery: string;
};

type FilterStore = GlobalFilters & {
  setCycleKey: (key: string | null) => void;
  setKind: (kind: TransactionKind | "all") => void;
  setCategoryId: (id: number | null) => void;
  setAmountRange: (min: number | null, max: number | null) => void;
  setSearchQuery: (q: string) => void;
  reset: () => void;
};

const defaults: GlobalFilters = {
  cycleKey: null,
  kind: "all",
  categoryId: null,
  minAmountPaise: null,
  maxAmountPaise: null,
  searchQuery: "",
};

export const useFilterStore = create<FilterStore>()(
  persist(
    (set) => ({
      ...defaults,
      setCycleKey: (cycleKey) => set({ cycleKey }),
      setKind: (kind) => set({ kind }),
      setCategoryId: (categoryId) => set({ categoryId }),
      setAmountRange: (minAmountPaise, maxAmountPaise) => set({ minAmountPaise, maxAmountPaise }),
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      reset: () => set(defaults),
    }),
    {
      name: "vw-filters",
      version: 2,
      migrate: (persisted) => {
        const p = persisted as Partial<GlobalFilters & { accountId?: number | null }>;
        return {
          ...defaults,
          cycleKey: p.cycleKey ?? null,
          kind: p.kind ?? "all",
          categoryId: p.categoryId ?? null,
          minAmountPaise: p.minAmountPaise ?? null,
          maxAmountPaise: p.maxAmountPaise ?? null,
          searchQuery: p.searchQuery ?? "",
        };
      },
    },
  ),
);

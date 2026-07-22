import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TransactionKind } from "@/lib/db/types";

export type GlobalFilters = {
  cycleKey: string | null;
  accountId: number | null;
  kind: TransactionKind | "all";
  categoryId: number | null;
  minAmountPaise: number | null;
  maxAmountPaise: number | null;
  searchQuery: string;
};

type FilterStore = GlobalFilters & {
  setCycleKey: (key: string | null) => void;
  setAccountId: (id: number | null) => void;
  setKind: (kind: TransactionKind | "all") => void;
  setCategoryId: (id: number | null) => void;
  setAmountRange: (min: number | null, max: number | null) => void;
  setSearchQuery: (q: string) => void;
  reset: () => void;
};

const defaults: GlobalFilters = {
  cycleKey: null,
  accountId: null,
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
      setAccountId: (accountId) => set({ accountId }),
      setKind: (kind) => set({ kind }),
      setCategoryId: (categoryId) => set({ categoryId }),
      setAmountRange: (minAmountPaise, maxAmountPaise) => set({ minAmountPaise, maxAmountPaise }),
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      reset: () => set(defaults),
    }),
    { name: "vw-filters" },
  ),
);

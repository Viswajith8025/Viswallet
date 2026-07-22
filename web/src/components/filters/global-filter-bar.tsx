"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSettings, getActiveCategories } from "@/lib/db";
import { getCurrentCycleKey, getPreviousCycleKeys, formatCycleLabel } from "@/lib/salary-cycle";
import { useFilterStore } from "@/lib/store/filter-store";
import { Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

export function GlobalFilterBar() {
  const cycleKey = useFilterStore((s) => s.cycleKey);
  const accountId = useFilterStore((s) => s.accountId);
  const kind = useFilterStore((s) => s.kind);
  const categoryId = useFilterStore((s) => s.categoryId);
  const setCycleKey = useFilterStore((s) => s.setCycleKey);
  const setKind = useFilterStore((s) => s.setKind);
  const setCategoryId = useFilterStore((s) => s.setCategoryId);
  const reset = useFilterStore((s) => s.reset);

  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: getSettings,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: getActiveCategories,
  });

  const salaryDay = settings?.salaryDay ?? 1;
  const currentKey = getCurrentCycleKey(salaryDay);
  const cycleOptions = getPreviousCycleKeys(currentKey, 12);

  useEffect(() => {
    if (!cycleKey && settings) {
      setCycleKey(currentKey);
    }
  }, [cycleKey, currentKey, settings, setCycleKey]);

  if (!settings) return null;

  const hasFilters =
    cycleKey !== currentKey || accountId || kind !== "all" || categoryId;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-card/60 p-3 backdrop-blur-sm">
      <Select
        value={cycleKey ?? currentKey}
        onChange={(e) => setCycleKey(e.target.value)}
        className="h-9 w-auto min-w-[140px] text-xs"
        aria-label="Salary cycle"
      >
        {cycleOptions.map((k) => (
          <option key={k} value={k}>
            {formatCycleLabel(k)}
          </option>
        ))}
      </Select>
      <Select
        value={kind}
        onChange={(e) => setKind(e.target.value as "all" | "expense" | "income")}
        className="h-9 w-auto min-w-[110px] text-xs"
        aria-label="Transaction type"
      >
        <option value="all">All types</option>
        <option value="expense">Expenses</option>
        <option value="income">Income</option>
      </Select>
      <Select
        value={categoryId ?? ""}
        onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : null)}
        className="h-9 w-auto min-w-[130px] text-xs"
        aria-label="Category"
      >
        <option value="">All categories</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </Select>
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={reset} className="h-9 gap-1.5 text-xs">
          <RotateCcw size={14} />
          Reset
        </Button>
      )}
    </div>
  );
}

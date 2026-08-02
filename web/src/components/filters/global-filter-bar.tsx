"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSettings } from "@/lib/db";
import { getCurrentCycleKey, getPreviousCycleKeys, formatCycleLabel } from "@/lib/salary-cycle";
import { useFilterStore } from "@/lib/store/filter-store";
import { useCategoriesQuery } from "@/hooks/use-categories";
import { useMobileLayout } from "@/hooks/use-mobile-layout";
import { Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RotateCcw, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/design/cn";

export function GlobalFilterBar({
  className,
  collapsible = false,
}: {
  className?: string;
  /** On mobile, show a single button that expands filters. */
  collapsible?: boolean;
}) {
  const isMobileLayout = useMobileLayout();
  const [expanded, setExpanded] = useState(false);
  const cycleKey = useFilterStore((s) => s.cycleKey);
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

  const { data: categories = [] } = useCategoriesQuery();

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
    cycleKey !== currentKey || kind !== "all" || categoryId;

  const showCollapsed = collapsible && isMobileLayout && !expanded;

  if (showCollapsed) {
    return (
      <div className={cn("pb-3", className)}>
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="flex w-full min-h-11 items-center justify-between gap-2 rounded-xl border border-border/60 bg-muted/30 px-4 py-2.5 text-sm transition-colors active:scale-[0.99] hover:bg-muted/50"
          aria-expanded={false}
        >
          <span className="flex items-center gap-2 text-muted-foreground">
            <SlidersHorizontal size={16} />
            <span>
              {formatCycleLabel(cycleKey ?? currentKey)}
              {hasFilters ? " · filtered" : ""}
            </span>
          </span>
          <span className="text-xs font-medium text-primary">Edit</span>
        </button>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2 border-b border-border/60 pb-4", className)}>
      {collapsible && isMobileLayout && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-10 shrink-0 gap-1.5 text-xs"
          onClick={() => setExpanded(false)}
        >
          Hide filters
        </Button>
      )}
      <Select
        tone="filter"
        value={cycleKey ?? currentKey}
        onChange={(e) => setCycleKey(e.target.value)}
        className="w-auto min-w-[9.5rem] shrink-0"
        aria-label="Salary cycle"
      >
        {cycleOptions.map((k) => (
          <option key={k} value={k}>
            {formatCycleLabel(k)}
          </option>
        ))}
      </Select>
      <Select
        tone="filter"
        value={kind}
        onChange={(e) => setKind(e.target.value as "all" | "expense" | "income")}
        className="w-auto min-w-[6.75rem] shrink-0"
        aria-label="Transaction type"
      >
        <option value="all">All types</option>
        <option value="expense">Expenses</option>
        <option value="income">Income</option>
      </Select>
      <Select
        tone="filter"
        value={categoryId ?? ""}
        onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : null)}
        className="w-auto min-w-[8rem] shrink-0"
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
        <Button variant="ghost" size="sm" onClick={reset} className="h-10 shrink-0 gap-1.5 text-xs">
          <RotateCcw size={14} />
          Reset
        </Button>
      )}
    </div>
  );
}

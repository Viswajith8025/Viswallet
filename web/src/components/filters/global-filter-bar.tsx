"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSettings } from "@/lib/db";
import { getCurrentCycleKey, getPreviousCycleKeys, formatCycleLabel } from "@/lib/salary-cycle";
import { selectCategoryId, selectCycleKey, useFilterStore } from "@/lib/store/filter-store";
import { queryKeys } from "@/lib/react-query/keys";
import { useCategoriesQuery } from "@/hooks/use-categories";
import { useMobileLayout } from "@/hooks/use-mobile-layout";
import { Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RotateCcw, SlidersHorizontal } from "lucide-react";
import { copy } from "@/lib/ux/copy";
import { panelVariants } from "@/lib/design/variants";
import { cn } from "@/lib/design/cn";

export function GlobalFilterBar({
  className,
  collapsible = false,
  showCategoryFilter = true,
}: {
  className?: string;
  /** On mobile, show a single button that expands filters. */
  collapsible?: boolean;
  /** Category filter only applies on Search; hide on dashboard-style pages. */
  showCategoryFilter?: boolean;
}) {
  const isMobileLayout = useMobileLayout();
  const [expanded, setExpanded] = useState(false);
  const cycleKey = useFilterStore(selectCycleKey);
  const categoryId = useFilterStore(selectCategoryId);
  const setCycleKey = useFilterStore((s) => s.setCycleKey);
  const setCategoryId = useFilterStore((s) => s.setCategoryId);
  const reset = useFilterStore((s) => s.reset);

  const { data: settings } = useQuery({
    queryKey: queryKeys.settings,
    queryFn: getSettings,
    staleTime: 60_000,
  });

  const { data: categories = [] } = useCategoriesQuery();

  const salaryDay = settings?.salaryDay ?? 1;
  const currentKey = getCurrentCycleKey(salaryDay);
  const cycleOptions = getPreviousCycleKeys(currentKey, 12);
  const viewingPastCycle = cycleKey != null && cycleKey !== currentKey;

  useEffect(() => {
    if (!cycleKey && settings) {
      setCycleKey(currentKey);
    }
  }, [cycleKey, currentKey, settings, setCycleKey]);

  if (!settings) {
    return (
      <div className={cn("pb-3", className)}>
        <div className="h-11 w-full max-w-xs animate-pulse rounded-xl bg-muted/40" aria-hidden />
      </div>
    );
  }

  const hasFilters =
    viewingPastCycle || (showCategoryFilter && categoryId != null);

  const showCollapsed = collapsible && isMobileLayout && !expanded;

  if (showCollapsed) {
    return (
      <div className={cn("space-y-2 pb-3", className)}>
        {viewingPastCycle && (
          <p className="text-xs text-muted-foreground">{copy.filters.pastCycleNote}</p>
        )}
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className={cn(
            "flex w-full min-h-11 items-center justify-between gap-2 px-4 py-2.5 text-sm transition-colors active:scale-[0.99] hover:bg-muted/50",
            panelVariants.muted,
          )}
          aria-expanded={false}
        >
          <span className="flex items-center gap-2 text-muted-foreground">
            <SlidersHorizontal size={16} />
            <span>
              Cycle: {formatCycleLabel(cycleKey ?? currentKey)}
              {hasFilters ? ` · ${copy.filters.filtered}` : ""}
            </span>
          </span>
          <span className="text-xs font-medium text-primary">{copy.filters.change}</span>
        </button>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {viewingPastCycle && (
        <div className={cn("flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground", panelVariants.muted)}>
          <span>{copy.filters.pastCycleBanner(formatCycleLabel(cycleKey ?? currentKey))}</span>
          <button
            type="button"
            className="min-h-11 px-2 font-medium text-primary hover:underline sm:min-h-0"
            onClick={() => setCycleKey(currentKey)}
          >
            {copy.filters.backToCurrent}
          </button>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2 border-b border-border/60 pb-4">
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
        {showCategoryFilter && (
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
        )}
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={reset} className="h-10 shrink-0 gap-1.5 text-xs">
            <RotateCcw size={14} />
            Reset
          </Button>
        )}
      </div>
    </div>
  );
}

"use client";

import { cn } from "@/lib/design/cn";
import type { Category } from "@/lib/db/types";
import { CategoryIconBadge } from "@/components/categories/category-icon-badge";

export function CategoryPicker({
  categories,
  value,
  onChange,
  label = "Category",
}: {
  categories: Category[];
  value: string;
  onChange: (categoryId: string) => void;
  label?: string;
}) {
  return (
    <div className="space-y-2.5 md:col-span-2">
      <span className="text-sm font-medium text-foreground/80">{label}</span>
      <div className="scroll-premium grid max-h-52 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4 md:grid-cols-5">
        {categories.map((c) => {
          if (c.id == null) return null;
          const id = String(c.id);
          const active = id === value;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onChange(id)}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl border px-2 py-2.5 text-center transition-all",
                active
                  ? "border-primary bg-primary-muted shadow-sm ring-1 ring-primary/20"
                  : "border-border bg-surface hover:border-border-strong hover:bg-surface-secondary",
              )}
              aria-pressed={active}
            >
              <CategoryIconBadge category={c} size="sm" />
              <span className="line-clamp-2 text-[10px] font-medium leading-tight text-foreground">
                {c.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

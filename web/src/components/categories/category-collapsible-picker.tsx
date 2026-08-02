"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { Category } from "@/lib/db/types";
import { CategoryGrid } from "@/components/categories/category-grid";
import { CategoryIconBadge } from "@/components/categories/category-icon-badge";
import { cn } from "@/lib/design/cn";

export function CategoryCollapsiblePicker({
  categories,
  value,
  onChange,
  kind = "expense",
  className,
}: {
  categories: Category[];
  value: string;
  onChange: (categoryId: string) => void;
  kind?: "expense" | "income";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const resolvedValue = value || String(categories[0]?.id ?? "");
  const selected = categories.find((c) => String(c.id) === resolvedValue);

  return (
    <div className={cn("px-4 pb-2", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 rounded-xl border border-border/60 bg-muted/30 px-4 py-3.5 text-left transition-colors active:scale-[0.98] hover:bg-muted/50 min-h-[3.25rem]"
        aria-expanded={open}
      >
        <CategoryIconBadge category={selected} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">Category</p>
          <p className="truncate font-medium">{selected?.name ?? "Pick a category"}</p>
        </div>
        <ChevronDown
          size={18}
          className={cn("shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="scroll-premium mt-2 max-h-[min(52vh,420px)] overflow-y-auto rounded-xl border border-border/60 bg-background">
          <CategoryGrid
            categories={categories}
            value={resolvedValue}
            onChange={onChange}
            kind={kind}
            onSelect={() => setOpen(false)}
          />
        </div>
      )}
    </div>
  );
}

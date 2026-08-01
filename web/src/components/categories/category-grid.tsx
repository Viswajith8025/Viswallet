"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { cn } from "@/lib/design/cn";
import type { Category } from "@/lib/db/types";
import { CategoryIconBadge } from "@/components/categories/category-icon-badge";

export function CategoryGrid({
  categories,
  value,
  onChange,
  onSelect,
  showManageLink = true,
}: {
  categories: Category[];
  value: string;
  onChange: (categoryId: string) => void;
  onSelect?: (categoryId: string) => void;
  showManageLink?: boolean;
}) {
  function pick(id: string) {
    onChange(id);
    onSelect?.(id);
  }

  return (
    <div className="grid grid-cols-4 gap-x-2 gap-y-5 px-4 py-4">
      {categories.map((c) => {
        if (c.id == null) return null;
        const id = String(c.id);
        const active = id === value;
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => pick(id)}
            className="flex flex-col items-center gap-2 text-center"
            aria-pressed={active}
          >
            <CategoryIconBadge
              category={c}
              size="grid"
              className={cn(active && "ring-2 ring-primary ring-offset-2 ring-offset-background")}
            />
            <span className="line-clamp-2 text-[11px] leading-tight text-muted-foreground">
              {c.name}
            </span>
          </button>
        );
      })}
      {showManageLink && (
        <Link
          href="/categories"
          className="flex flex-col items-center gap-2 text-center text-muted-foreground transition-colors hover:text-foreground"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-muted/80">
            <Plus size={22} strokeWidth={1.75} />
          </span>
          <span className="text-[11px] leading-tight">Categories</span>
        </Link>
      )}
    </div>
  );
}

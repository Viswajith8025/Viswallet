"use client";

import { useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/design/cn";
import type { Category } from "@/lib/db/types";
import { CategoryIconBadge } from "@/components/categories/category-icon-badge";
import { CreateCategoryDialog } from "@/components/categories/create-category-dialog";
import {
  archiveCategory,
  filterQuickAddCategories,
  showCategoryInQuickAdd,
} from "@/lib/categories/manage-category";
import { useInvalidateFinance } from "@/hooks";
import { confirmAction } from "@/lib/store/confirm-store";
import { showToast } from "@/lib/store/toast-store";

export function CategoryGrid({
  categories,
  value,
  onChange,
  onSelect,
  kind = "expense",
}: {
  categories: Category[];
  value: string;
  onChange: (categoryId: string) => void;
  onSelect?: (categoryId: string) => void;
  kind?: "expense" | "income";
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const invalidate = useInvalidateFinance();

  const visible = useMemo(() => filterQuickAddCategories(categories), [categories]);
  const hidden = useMemo(
    () => categories.filter((c) => c.hiddenFromQuickAdd && !c.isDeleted),
    [categories],
  );

  function pick(id: string) {
    if (editMode) return;
    onChange(id);
    onSelect?.(id);
  }

  async function handleRemove(cat: Category) {
    const isSystem = cat.isSystem;
    const ok = await confirmAction({
      title: isSystem ? "Hide category?" : "Remove category?",
      description: isSystem
        ? `"${cat.name}" will be hidden from quick add. You can restore it from Edit categories.`
        : `"${cat.name}" will be removed. Existing transactions keep this category.`,
      confirmLabel: isSystem ? "Hide" : "Remove",
      destructive: true,
    });
    if (!ok || cat.id == null) return;

    const result = await archiveCategory(cat);
    await invalidate();

    if (String(cat.id) === value) {
      const next = filterQuickAddCategories(categories).find((c) => c.id !== cat.id);
      if (next?.id != null) onChange(String(next.id));
    }

    showToast(
      result === "hidden" ? `"${cat.name}" hidden` : `"${cat.name}" removed`,
      { tone: "default" },
    );
  }

  async function handleRestore(cat: Category) {
    if (cat.id == null) return;
    await showCategoryInQuickAdd(cat.id);
    await invalidate();
    showToast(`"${cat.name}" restored`, { tone: "success" });
  }

  return (
    <>
      <div className="flex items-center justify-between gap-2 px-4 pb-2">
        <p className="text-xs text-muted-foreground">
          {editMode ? "Tap × to hide or remove" : `${visible.length} categories`}
        </p>
        <button
          type="button"
          onClick={() => setEditMode((v) => !v)}
          className="text-xs font-medium text-primary"
        >
          {editMode ? "Done" : "Edit categories"}
        </button>
      </div>

      <div className="grid grid-cols-4 gap-x-2 gap-y-5 px-4 py-2">
        {visible.map((c) => {
          if (c.id == null) return null;
          const id = String(c.id);
          const active = id === value;
          return (
            <div key={c.id} className="relative">
              <button
                type="button"
                onClick={() => pick(id)}
                className="flex w-full flex-col items-center gap-2 text-center"
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
              {editMode && (
                <button
                  type="button"
                  onClick={() => void handleRemove(c)}
                  className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm"
                  aria-label={`Remove ${c.name}`}
                >
                  <X size={12} strokeWidth={2.5} />
                </button>
              )}
            </div>
          );
        })}
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="flex flex-col items-center gap-2 text-center text-muted-foreground transition-colors hover:text-foreground"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full border border-dashed border-border bg-muted/50">
            <Plus size={22} strokeWidth={1.75} />
          </span>
          <span className="text-[11px] leading-tight font-medium">Add</span>
        </button>
      </div>

      {editMode && hidden.length > 0 && (
        <div className="border-t border-border/50 px-4 py-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Hidden ({hidden.length})</p>
          <div className="flex flex-wrap gap-2">
            {hidden.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => void handleRestore(c)}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground hover:border-primary/30 hover:text-foreground"
              >
                <CategoryIconBadge category={c} size="sm" />
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <CreateCategoryDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        kind={kind}
        onCreated={(id) => pick(String(id))}
      />
    </>
  );
}

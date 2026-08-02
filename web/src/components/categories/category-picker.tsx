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
  sortCategoriesForDisplay,
} from "@/lib/categories/manage-category";
import { useInvalidateFinance } from "@/hooks";
import { confirmAction } from "@/lib/store/confirm-store";
import { showToast } from "@/lib/store/toast-store";

export function CategoryPicker({
  categories,
  value,
  onChange,
  label = "Category",
  kind = "expense",
}: {
  categories: Category[];
  value: string;
  onChange: (categoryId: string) => void;
  label?: string;
  kind?: "expense" | "income";
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const invalidate = useInvalidateFinance();

  const visible = useMemo(() => sortCategoriesForDisplay(categories), [categories]);
  const hidden = useMemo(
    () => categories.filter((c) => c.hiddenFromQuickAdd && !c.isDeleted),
    [categories],
  );

  async function handleRemove(cat: Category) {
    const isSystem = cat.isSystem;
    const ok = await confirmAction({
      title: isSystem ? "Hide category?" : "Remove category?",
      description: isSystem
        ? `"${cat.name}" will be hidden from quick add.`
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
      <div className="space-y-2.5 md:col-span-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-foreground/80">{label}</span>
          <button
            type="button"
            onClick={() => setEditMode((v) => !v)}
            className="text-xs font-medium text-primary"
          >
            {editMode ? "Done" : "Edit"}
          </button>
        </div>
        <div className="scroll-premium grid max-h-52 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4 md:grid-cols-5">
          {visible.map((c) => {
            if (c.id == null) return null;
            const id = String(c.id);
            const active = id === value;
            return (
              <div key={c.id} className="relative">
                <button
                  type="button"
                  onClick={() => !editMode && onChange(id)}
                  className={cn(
                    "flex w-full flex-col items-center gap-2 rounded-xl border px-2 py-2.5 text-center transition-all",
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
            className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 px-2 py-2.5 text-center transition-all hover:border-primary/40 hover:bg-muted/50"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
              <Plus size={16} className="text-muted-foreground" />
            </span>
            <span className="line-clamp-2 text-[10px] font-medium leading-tight text-muted-foreground">
              Add
            </span>
          </button>
        </div>
        {editMode && hidden.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Hidden — tap to restore</p>
            <div className="flex flex-wrap gap-2">
              {hidden.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => void handleRestore(c)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border px-2 py-1 text-xs text-muted-foreground hover:border-primary/30"
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <CreateCategoryDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        kind={kind}
        onCreated={(id) => onChange(String(id))}
      />
    </>
  );
}

"use client";

import { useState } from "react";
import { Lock, Trash2 } from "lucide-react";
import { PageHeader, EmptyState, PageContainer } from "@/components/ui/page";
import { DexiePageGate } from "@/components/layout/dexie-page-gate";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CategoryIconBadge } from "@/components/categories/category-icon-badge";
import { db } from "@/lib/db";
import type { Category } from "@/lib/db/types";
import { useInvalidateFinance, useAsyncAction, useDexieTable } from "@/hooks";
import { confirmAction } from "@/lib/store/confirm-store";
import { DEFAULT_CATEGORY_COLOR } from "@/lib/categories-default";
import { CATEGORY_ICON_NAMES } from "@/lib/category-icons";
import { createCustomCategory } from "@/lib/categories/create-category";
import { notifyDataMutation } from "@/lib/db/notify-mutation";
import { cn } from "@/lib/design/cn";
import { showToast } from "@/lib/store/toast-store";

export default function CategoriesPage() {
  const invalidate = useInvalidateFinance();
  const { loading: saving, run } = useAsyncAction();
  const { data: categories = [], isPending, isError, refetch } = useDexieTable(
    "categories",
    () => db.categories.filter((c) => !c.isDeleted).sortBy("sortOrder"),
  );
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(DEFAULT_CATEGORY_COLOR);
  const [iconName, setIconName] = useState("circle-dot");
  const [kind, setKind] = useState<"expense" | "income">("expense");

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    await run(async () => {
      await createCustomCategory({
        name,
        iconName,
        color,
        kind,
      });
      setName("");
      setColor(DEFAULT_CATEGORY_COLOR);
      setIconName("circle-dot");
      setKind("expense");
      setShowForm(false);
      showToast("Category created", { tone: "success" });
      await invalidate();
    }, { errorMessage: "Could not create category. Try a different name." });
  }

  async function remove(cat: Category) {
    if (cat.isSystem) return;
    const ok = await confirmAction({
      title: "Delete category?",
      description: `"${cat.name}" will be archived. Existing transactions keep this category.`,
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    await db.categories.update(cat.id!, { isDeleted: true });
    notifyDataMutation();
    await invalidate();
    showToast("Category removed", { tone: "default" });
  }

  const system = categories.filter((c) => c.isSystem);
  const custom = categories.filter((c) => !c.isSystem);

  return (
    <PageContainer className="max-w-5xl">
      <PageHeader
        title="Categories"
        description="Add custom categories for spending or income. They appear in quick add and transactions."
        actions={<Button onClick={() => setShowForm(!showForm)}>Add category</Button>}
      />

      <DexiePageGate isPending={isPending} isError={isError} onRetry={() => refetch()} label="Loading categories…">
      <div className="space-y-8">

      {showForm && (
        <Card>
          <CardContent className="p-5">
            <form onSubmit={addCategory} className="space-y-4">
              <div className="flex flex-wrap items-end gap-4">
                <Input label="Category name" required value={name} onChange={(e) => setName(e.target.value)} className="min-w-[200px] flex-1" placeholder="Pet care, side hustle…" />
                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-muted-foreground">Type</span>
                  <select
                    value={kind}
                    onChange={(e) => setKind(e.target.value as "expense" | "income")}
                    className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </label>
                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-muted-foreground">Color</span>
                  <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-14 cursor-pointer rounded-xl border border-input" />
                </label>
                <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
              <div className="space-y-2">
                <span className="text-sm font-medium text-muted-foreground">Icon</span>
                <div className="scroll-premium grid max-h-40 grid-cols-6 gap-2 overflow-y-auto sm:grid-cols-8">
                  {CATEGORY_ICON_NAMES.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setIconName(icon)}
                      className={cn(
                        "flex items-center justify-center rounded-xl border p-1 transition-all",
                        iconName === icon
                          ? "border-primary bg-primary-muted ring-1 ring-primary/20"
                          : "border-border hover:border-border-strong",
                      )}
                      aria-pressed={iconName === icon}
                      aria-label={icon}
                    >
                      <CategoryIconBadge iconName={icon} color={color} size="sm" />
                    </button>
                  ))}
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-5">
          <h2 className="mb-4 flex items-center gap-2 font-semibold">
            <Lock size={16} className="text-muted-foreground" /> System categories
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {system.map((c) => (
              <div key={c.id} className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3">
                <CategoryIconBadge category={c} size="sm" />
                <span className="text-sm font-medium">{c.name}</span>
                <Lock size={12} className="ml-auto text-muted-foreground" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <h2 className="mb-4 font-semibold">Your custom categories</h2>
          {custom.length === 0 ? (
            <EmptyState
              title="No custom categories yet"
              description="Tap Add category or use Custom when adding a transaction."
              action={<Button onClick={() => setShowForm(true)}>Add category</Button>}
            />
          ) : (
            <ul className="divide-y divide-border">
              {custom.map((c) => (
                <li key={c.id} className="flex items-center gap-3 py-3">
                  <CategoryIconBadge category={c} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.countsTowardSpending ? "Expense" : "Income"}
                    </p>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => remove(c)} aria-label={`Delete ${c.name}`}><Trash2 size={14} className="text-destructive" /></Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      </div>
      </DexiePageGate>
    </PageContainer>
  );
}

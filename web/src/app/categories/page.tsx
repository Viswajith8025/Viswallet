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
import { cn } from "@/lib/design/cn";
import { sanitizeName } from "@/lib/security";

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

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    await run(async () => {
      const slug = name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      const maxOrder = categories.reduce((m, c) => Math.max(m, c.sortOrder), 0);
      await db.categories.add({
        name: sanitizeName(name),
        slug: slug || `custom-${Date.now()}`,
        iconName,
        color,
        isSystem: false,
        countsTowardSpending: true,
        sortOrder: maxOrder + 1,
        isDeleted: false,
      });
      setName("");
      setColor(DEFAULT_CATEGORY_COLOR);
      setIconName("circle-dot");
      setShowForm(false);
      await invalidate();
    });
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
    await invalidate();
  }

  const system = categories.filter((c) => c.isSystem);
  const custom = categories.filter((c) => !c.isSystem);

  return (
    <PageContainer className="max-w-5xl">
      <PageHeader
        title="Categories"
        description="System categories are read-only. Add custom ones for your spending."
        actions={<Button onClick={() => setShowForm(!showForm)}>Add category</Button>}
      />

      <DexiePageGate isPending={isPending} isError={isError} onRetry={() => refetch()} label="Loading categories…">
      <div className="space-y-8">

      {showForm && (
        <Card>
          <CardContent className="p-5">
            <form onSubmit={addCategory} className="space-y-4">
              <div className="flex flex-wrap items-end gap-4">
                <Input label="Category name" required value={name} onChange={(e) => setName(e.target.value)} className="min-w-[200px] flex-1" />
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
          <h2 className="mb-4 font-semibold">Custom categories</h2>
          {custom.length === 0 ? (
            <EmptyState title="No custom categories" description="Create one to organize unique spending." />
          ) : (
            <ul className="divide-y divide-border">
              {custom.map((c) => (
                <li key={c.id} className="flex items-center gap-3 py-3">
                  <CategoryIconBadge category={c} size="sm" />
                  <span className="flex-1 font-medium">{c.name}</span>
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

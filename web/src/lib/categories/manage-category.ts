import { db } from "@/lib/db/client";
import type { Category } from "@/lib/db/types";
import { notifyDataMutation } from "@/lib/db/notify-mutation";

export function filterQuickAddCategories(categories: Category[]): Category[] {
  return categories.filter((c) => !c.hiddenFromQuickAdd);
}

export async function hideCategoryFromQuickAdd(categoryId: number): Promise<void> {
  await db.categories.update(categoryId, { hiddenFromQuickAdd: true });
  notifyDataMutation();
}

export async function showCategoryInQuickAdd(categoryId: number): Promise<void> {
  await db.categories.update(categoryId, { hiddenFromQuickAdd: false });
  notifyDataMutation();
}

/** Soft-delete custom categories; system categories are only hidden from quick add. */
export async function archiveCategory(category: Category): Promise<"hidden" | "deleted"> {
  if (category.id == null) throw new Error("Category not found.");
  if (category.isSystem) {
    await hideCategoryFromQuickAdd(category.id);
    return "hidden";
  }
  await db.categories.update(category.id, { isDeleted: true, hiddenFromQuickAdd: true });
  notifyDataMutation();
  return "deleted";
}

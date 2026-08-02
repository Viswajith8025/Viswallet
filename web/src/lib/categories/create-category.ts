import { db } from "@/lib/db/client";
import type { Category } from "@/lib/db/types";
import { DEFAULT_CATEGORY_COLOR } from "@/lib/categories-default";
import { notifyDataMutation } from "@/lib/db/notify-mutation";
import { sanitizeName } from "@/lib/security";

export type CreateCategoryInput = {
  name: string;
  iconName?: string;
  color?: string;
  /** Expense categories count toward spending; income categories do not. */
  kind?: "expense" | "income";
};

function slugifyName(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  return base || "custom";
}

export async function ensureUniqueCategorySlug(baseSlug: string): Promise<string> {
  const rows = await db.categories.toArray();
  const slugs = new Set(rows.map((c) => c.slug));
  if (!slugs.has(baseSlug)) return baseSlug;
  let i = 2;
  while (slugs.has(`${baseSlug}-${i}`)) i += 1;
  return `${baseSlug}-${i}`;
}

export async function createCustomCategory(input: CreateCategoryInput): Promise<Category> {
  const name = sanitizeName(input.name);
  if (!name.trim()) {
    throw new Error("Enter a category name.");
  }

  const slug = await ensureUniqueCategorySlug(slugifyName(name));
  const maxOrder = await db.categories.orderBy("sortOrder").last();
  const sortOrder = (maxOrder?.sortOrder ?? 0) + 1;
  const kind = input.kind ?? "expense";

  try {
    const id = (await db.categories.add({
      name,
      slug,
      iconName: input.iconName ?? "circle-dot",
      color: input.color ?? DEFAULT_CATEGORY_COLOR,
      isSystem: false,
      countsTowardSpending: kind === "expense",
      sortOrder,
      isDeleted: false,
      rowVersion: 1,
      hiddenFromQuickAdd: false,
    })) as number;

    const created = await db.categories.get(id);
    if (!created) throw new Error("Category was not saved.");

    notifyDataMutation();
    return created;
  } catch (err) {
    const errName = err instanceof Error ? err.name : "";
    if (errName === "ConstraintError") {
      const retrySlug = await ensureUniqueCategorySlug(`${slug}-2`);
      const id = (await db.categories.add({
        name,
        slug: retrySlug,
        iconName: input.iconName ?? "circle-dot",
        color: input.color ?? DEFAULT_CATEGORY_COLOR,
        isSystem: false,
        countsTowardSpending: kind === "expense",
        sortOrder,
        isDeleted: false,
        rowVersion: 1,
        hiddenFromQuickAdd: false,
      })) as number;
      const created = await db.categories.get(id);
      if (!created) throw new Error("Category was not saved.");
      notifyDataMutation();
      return created;
    }
    throw err;
  }
}

import { getActiveCategories } from "@/lib/db";

export async function getCategoryIdBySlug(slug: string): Promise<number> {
  const cats = await getActiveCategories();
  const match = cats.find((c) => c.slug === slug);
  if (match?.id != null) return match.id;
  const fallback = cats.find((c) => c.slug === "misc");
  if (fallback?.id != null) return fallback.id;
  throw new Error("No category found for obligation expense.");
}

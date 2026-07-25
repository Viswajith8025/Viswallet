import { db } from "../client";
import type { Category } from "../types";

/** Active categories sorted by sortOrder. */
export async function getActiveCategories(): Promise<Category[]> {
  return db.categories.filter((c) => !c.isDeleted).sortBy("sortOrder");
}

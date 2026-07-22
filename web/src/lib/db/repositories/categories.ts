import Dexie from "dexie";
import { db } from "../client";
import type { Category } from "../types";

/** Indexed: isDeleted + sortOrder via compound range query. */
export async function getActiveCategories(): Promise<Category[]> {
  try {
    return await db.categories
      .where("[isDeleted+sortOrder]")
      .between([false, Dexie.minKey], [false, Dexie.maxKey])
      .toArray();
  } catch {
    return db.categories.filter((c) => !c.isDeleted).sortBy("sortOrder");
  }
}

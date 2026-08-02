import { db } from "../client";
import type { Account } from "../types";

export async function getActiveAccounts(): Promise<Account[]> {
  return db.accounts.filter((a) => a.isActive).toArray();
}

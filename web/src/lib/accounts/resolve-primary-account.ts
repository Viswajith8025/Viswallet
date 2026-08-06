import { db } from "@/lib/db";
import type { Account } from "@/lib/db/types";

/** Main bank account — salary lands here; default for lend/borrow cash movements. */
export async function getPrimaryAccount(): Promise<Account | undefined> {
  const accounts = await db.accounts.filter((a) => a.isActive).toArray();
  return (
    accounts.find((a) => a.role === "primary") ??
    accounts.find((a) => a.isDefault) ??
    accounts[0]
  );
}

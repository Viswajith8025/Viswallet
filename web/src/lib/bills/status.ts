import { isPast, startOfDay } from "date-fns";
import { db } from "@/lib/db";
import type { Bill, BillStatus } from "@/lib/db/types";

/** Derive bill status from due date — paid status is preserved. */
export function computeBillStatus(bill: Bill): BillStatus {
  if (bill.status === "paid") return "paid";
  if (isPast(startOfDay(new Date(bill.dueAt)))) return "overdue";
  return "upcoming";
}

/** Persist overdue transitions so dashboards stay accurate. */
export async function loadBillsWithSyncedStatus(): Promise<Bill[]> {
  const rows = await db.bills.orderBy("dueAt").toArray();
  const now = new Date();
  const synced: Bill[] = [];

  for (const bill of rows) {
    if (bill.status === "paid") {
      synced.push(bill);
      continue;
    }
    const computed = computeBillStatus(bill);
    if (computed !== bill.status && bill.id) {
      await db.bills.update(bill.id, { status: computed, updatedAt: now });
      synced.push({ ...bill, status: computed });
    } else {
      synced.push(bill);
    }
  }

  return synced;
}

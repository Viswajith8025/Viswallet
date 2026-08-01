import { emitDbDataChanged } from "@/lib/notifications/bus";

/** Fire after Dexie writes that don't go through transaction repositories. */
export function notifyDataMutation(): void {
  emitDbDataChanged();
}

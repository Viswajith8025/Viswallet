import { runNotificationScheduler } from "@/lib/engines/premium/notification-scheduler";
import { runFinanceNotifications } from "@/lib/notifications/finance-alerts";
import { emitNotificationsChanged } from "@/lib/notifications/bus";

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let syncInFlight: Promise<void> | null = null;

/** Recompute bill/EMI/subscription/finance alerts from current IndexedDB state. */
export async function syncDynamicNotifications(): Promise<void> {
  if (syncInFlight) return syncInFlight;

  syncInFlight = (async () => {
    await runNotificationScheduler();
    await runFinanceNotifications();
    emitNotificationsChanged();
  })().finally(() => {
    syncInFlight = null;
  });

  return syncInFlight;
}

/** Debounced sync after mutations (transactions, bills, etc.). */
export function scheduleNotificationSync(): void {
  if (typeof window === "undefined") return;
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    void syncDynamicNotifications();
  }, 1200);
}

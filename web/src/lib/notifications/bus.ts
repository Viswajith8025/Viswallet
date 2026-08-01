const NOTIFICATIONS_EVENT = "viswallet:notifications-changed";
const DB_DATA_EVENT = "viswallet:db-data-changed";
const CLOUD_SYNC_ACTIVE_EVENT = "viswallet:cloud-sync-active";

export function emitNotificationsChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(NOTIFICATIONS_EVENT));
}

export function onNotificationsChanged(handler: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(NOTIFICATIONS_EVENT, handler);
  return () => window.removeEventListener(NOTIFICATIONS_EVENT, handler);
}

export function emitDbDataChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(DB_DATA_EVENT));
}

export function onDbDataChanged(handler: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(DB_DATA_EVENT, handler);
  return () => window.removeEventListener(DB_DATA_EVENT, handler);
}

export function emitCloudSyncActive(active: boolean): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CLOUD_SYNC_ACTIVE_EVENT, { detail: active }));
}

export function onCloudSyncActive(handler: (active: boolean) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const fn = (e: Event) => handler((e as CustomEvent<boolean>).detail);
  window.addEventListener(CLOUD_SYNC_ACTIVE_EVENT, fn);
  return () => window.removeEventListener(CLOUD_SYNC_ACTIVE_EVENT, fn);
}
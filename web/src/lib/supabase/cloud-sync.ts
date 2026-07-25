import { BACKUP_VERSION } from "@/lib/security/constants";
import { getSupabase } from "@/lib/supabase/client";
import { getAuthUser } from "@/lib/supabase/auth";
import { exportAllDataForSync, importAllData, resetLocalDatabase } from "@/lib/db/client";
import { emitDbDataChanged, emitNotificationsChanged } from "@/lib/notifications/bus";

const LAST_SYNC_KEY = "vw_cloud_last_sync_at";
const USER_ID_KEY = "vw_cloud_user_id";

let syncInFlight: Promise<void> | null = null;
let loginSyncInFlight: Promise<"pulled" | "pushed" | "noop"> | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

function getLastLocalSyncAt(): Date | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(LAST_SYNC_KEY);
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

function setLastLocalSyncAt(date: Date): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LAST_SYNC_KEY, date.toISOString());
}

function getStoredCloudUserId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(USER_ID_KEY);
}

function setStoredCloudUserId(userId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_ID_KEY, userId);
}

export function getCloudLastSyncedAt(): Date | null {
  return getLastLocalSyncAt();
}

export function clearCloudSyncState(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LAST_SYNC_KEY);
  localStorage.removeItem(USER_ID_KEY);
}

async function ensureAccountScopedLocalData(userId: string): Promise<void> {
  const storedUserId = getStoredCloudUserId();
  if (storedUserId && storedUserId !== userId) {
    await resetLocalDatabase();
    localStorage.removeItem(LAST_SYNC_KEY);
  }
  setStoredCloudUserId(userId);
}

/** Pull cloud vault and merge into local IndexedDB if cloud is newer. */
export async function pullCloudVault(): Promise<boolean> {
  const sb = getSupabase();
  const user = await getAuthUser();
  if (!sb || !user) return false;

  await ensureAccountScopedLocalData(user.id);

  const { data, error } = await sb
    .from("user_data_vaults")
    .select("payload, updated_at, backup_version")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    if (isMissingVaultTable(error.message)) return false;
    throw new Error(error.message);
  }
  if (!data?.payload) return false;

  const cloudUpdated = new Date(data.updated_at as string);
  const localSync = getLastLocalSyncAt();

  if (localSync && cloudUpdated <= localSync) {
    return false;
  }

  const json =
    typeof data.payload === "string" ? data.payload : JSON.stringify(data.payload);

  await importAllData(json, { skipRateLimit: true });
  setLastLocalSyncAt(cloudUpdated);
  emitNotificationsChanged();
  emitDbDataChanged();
  return true;
}

/** Push local IndexedDB snapshot to cloud vault. */
export async function pushCloudVault(): Promise<void> {
  const sb = getSupabase();
  const user = await getAuthUser();
  if (!sb || !user) return;

  await ensureAccountScopedLocalData(user.id);

  const json = await exportAllDataForSync();
  const payload = JSON.parse(json) as Record<string, unknown>;
  const now = new Date().toISOString();

  const { error } = await sb.from("user_data_vaults").upsert(
    {
      user_id: user.id,
      payload,
      backup_version: BACKUP_VERSION,
      updated_at: now,
    },
    { onConflict: "user_id" },
  );

  if (error) {
    if (isMissingVaultTable(error.message)) return;
    throw new Error(error.message);
  }
  setLastLocalSyncAt(new Date(now));
}

function isMissingVaultTable(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("user_data_vaults") ||
    m.includes("does not exist") ||
    m.includes("could not find the table") ||
    m.includes("schema cache")
  );
}

/** After login: pull if cloud exists, else push local data. */
export async function syncCloudOnLogin(): Promise<"pulled" | "pushed" | "noop"> {
  if (loginSyncInFlight) return loginSyncInFlight;

  loginSyncInFlight = (async () => {
    const sb = getSupabase();
    const user = await getAuthUser();
    if (!sb || !user) return "noop";

    await ensureAccountScopedLocalData(user.id);

    const { data, error } = await sb
      .from("user_data_vaults")
      .select("updated_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      if (isMissingVaultTable(error.message)) return "noop";
      throw new Error(error.message);
    }

    if (data?.updated_at) {
      const pulled = await pullCloudVault();
      return pulled ? "pulled" : "noop";
    }

    await pushCloudVault();
    return "pushed";
  })().finally(() => {
    loginSyncInFlight = null;
  });

  return loginSyncInFlight;
}

export async function syncCloudNow(): Promise<void> {
  if (syncInFlight) return syncInFlight;

  syncInFlight = (async () => {
    const user = await getAuthUser();
    if (!user) return;
    await pushCloudVault();
  })().finally(() => {
    syncInFlight = null;
  });

  return syncInFlight;
}

export function scheduleCloudSync(): void {
  if (typeof window === "undefined") return;
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    void syncCloudNow();
  }, 3000);
}

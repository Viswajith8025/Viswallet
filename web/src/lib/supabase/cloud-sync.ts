import { BACKUP_VERSION, MAX_BACKUP_BYTES } from "@/lib/security/constants";
import { getSupabase } from "@/lib/supabase/client";
import { getAuthUser } from "@/lib/supabase/auth";
import { exportAllDataForSync, importAllData, resetLocalDatabase, getSettings } from "@/lib/db/client";
import {
  emitCloudSyncActive,
  emitDbDataChanged,
  emitNotificationsChanged,
} from "@/lib/notifications/bus";

const LAST_SYNC_KEY = "vw_cloud_last_sync_at";
const USER_ID_KEY = "vw_cloud_user_id";
const VAULT_UNAVAILABLE_KEY = "vw_vault_unavailable";
const CLOUD_SYNC_TIMEOUT_MS = 12_000;

let syncInFlight: Promise<void> | null = null;
let loginSyncInFlight: Promise<"pulled" | "pushed" | "noop"> | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let vaultUnavailableMemory =
  typeof window !== "undefined" && localStorage.getItem(VAULT_UNAVAILABLE_KEY) === "1";

function withCloudTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  if (typeof window === "undefined") return promise;
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      console.warn(`[Viswallet] Cloud sync timed out: ${label}`);
      reject(new Error(`Cloud sync timed out: ${label}`));
    }, CLOUD_SYNC_TIMEOUT_MS);

    promise
      .then((value) => {
        window.clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        window.clearTimeout(timer);
        reject(err);
      });
  });
}

function isCloudVaultEnvEnabled(): boolean {
  return process.env.NEXT_PUBLIC_CLOUD_VAULT === "true";
}

function canUseCloudVault(): boolean {
  return isCloudVaultEnvEnabled() && !isVaultUnavailable();
}

function isVaultUnavailable(): boolean {
  if (vaultUnavailableMemory) return true;
  if (typeof window === "undefined") return false;
  return localStorage.getItem(VAULT_UNAVAILABLE_KEY) === "1";
}

function markVaultUnavailable(): void {
  vaultUnavailableMemory = true;
  if (typeof window !== "undefined") {
    localStorage.setItem(VAULT_UNAVAILABLE_KEY, "1");
  }
}

function clearVaultUnavailable(): void {
  vaultUnavailableMemory = false;
  if (typeof window !== "undefined") {
    localStorage.removeItem(VAULT_UNAVAILABLE_KEY);
  }
}

type SupabaseErrorLike = {
  message?: string;
  code?: string;
  status?: number;
  details?: string;
  hint?: string;
};

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
  // Keep vault-unavailable flag — the Supabase table is still missing after sign-out.
}

export function isCloudVaultConfigured(): boolean {
  return isCloudVaultEnvEnabled();
}

export function isCloudVaultBlocked(): boolean {
  return isVaultUnavailable();
}

export function canSyncCloudVault(): boolean {
  return canUseCloudVault();
}

/** Whether background auto-push should run (env on; retries even if vault was temporarily missing). */
export function shouldAutoCloudSync(): boolean {
  return isCloudVaultEnvEnabled();
}

async function ensureAccountScopedLocalData(userId: string): Promise<void> {
  const storedUserId = getStoredCloudUserId();
  if (storedUserId && storedUserId !== userId) {
    await resetLocalDatabase();
    localStorage.removeItem(LAST_SYNC_KEY);
  }
  setStoredCloudUserId(userId);
}

type PullCloudVaultOptions = {
  /** Ignore per-browser sync timestamp — used after login to restore account data. */
  force?: boolean;
};

async function fetchCloudVaultRow(userId: string) {
  const sb = getSupabase();
  if (!sb) return null;

  const { data, error } = await sb
    .from("user_data_vaults")
    .select("payload, updated_at, backup_version")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    if (isMissingVaultTable(error)) {
      markVaultUnavailable();
      return null;
    }
    throw new Error(error.message);
  }

  return data;
}

/** Pull cloud vault into local IndexedDB when cloud is newer (or when forced). */
export async function pullCloudVault(options: PullCloudVaultOptions = {}): Promise<boolean> {
  if (!canUseCloudVault()) return false;

  const user = await getAuthUser();
  if (!user) return false;

  await ensureAccountScopedLocalData(user.id);

  const data = await fetchCloudVaultRow(user.id);
  if (!data?.payload) return false;

  const cloudUpdated = new Date(data.updated_at as string);
  const localSync = getLastLocalSyncAt();

  if (!options.force && localSync && cloudUpdated <= localSync) {
    return false;
  }

  const json =
    typeof data.payload === "string" ? data.payload : JSON.stringify(data.payload);

  await importAllData(json, { skipRateLimit: true });
  setLastLocalSyncAt(cloudUpdated);
  clearVaultUnavailable();
  emitNotificationsChanged();
  emitDbDataChanged();
  return true;
}

/** Push local IndexedDB snapshot to cloud vault. */
export async function pushCloudVault(): Promise<void> {
  if (!isCloudVaultEnvEnabled()) return;

  const sb = getSupabase();
  const user = await getAuthUser();
  if (!sb || !user) return;

  await ensureAccountScopedLocalData(user.id);

  const json = await exportAllDataForSync();
  if (json.length > MAX_BACKUP_BYTES) {
    throw new Error("Local data exceeds cloud vault size limit. Export a backup and trim old records.");
  }
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
    if (isMissingVaultTable(error)) {
      markVaultUnavailable();
      return;
    }
    throw new Error(error.message);
  }
  clearVaultUnavailable();
  setLastLocalSyncAt(new Date(now));
}

function isMissingVaultTable(error: SupabaseErrorLike | string): boolean {
  const payload = typeof error === "string" ? { message: error } : error;
  const m = `${payload.message ?? ""} ${payload.details ?? ""} ${payload.hint ?? ""}`.toLowerCase();
  const code = (payload.code ?? "").toLowerCase();

  return (
    payload.status === 404 ||
    code === "42p01" ||
    code === "pgrst205" ||
    code === "pgrst116" ||
    m.includes("user_data_vaults") ||
    m.includes("does not exist") ||
    m.includes("could not find the table") ||
    m.includes("schema cache") ||
    m.includes("not found")
  );
}

/** After login: always restore from cloud when a vault exists; otherwise push local setup once. */
export async function syncCloudOnLogin(): Promise<"pulled" | "pushed" | "noop"> {
  if (loginSyncInFlight) return loginSyncInFlight;
  if (!isCloudVaultEnvEnabled()) return "noop";

  loginSyncInFlight = withCloudTimeout(
    (async () => {
      const user = await getAuthUser();
      if (!user) return "noop";

      await ensureAccountScopedLocalData(user.id);

      const data = await fetchCloudVaultRow(user.id);
      if (!data) return "noop";

      if (data.payload) {
        const pulled = await pullCloudVault({ force: true });
        if (pulled) clearVaultUnavailable();
        return pulled ? "pulled" : "noop";
      }

      const settings = await getSettings();
      if (!settings.onboardingComplete) {
        return "noop";
      }

      await pushCloudVault();
      clearVaultUnavailable();
      return "pushed";
    })(),
    "login-sync",
  ).finally(() => {
    loginSyncInFlight = null;
  });

  return loginSyncInFlight;
}

export async function syncCloudNow(): Promise<void> {
  if (syncInFlight) return syncInFlight;
  if (!shouldAutoCloudSync()) return;

  syncInFlight = withCloudTimeout(
    (async () => {
      emitCloudSyncActive(true);
      try {
        const user = await getAuthUser();
        if (!user) return;

        const cloudRow = await fetchCloudVaultRow(user.id);
        const cloudUpdated = cloudRow?.updated_at ? new Date(cloudRow.updated_at as string) : null;
        const localSync = getLastLocalSyncAt();

        const pulled = await pullCloudVault();
        if (pulled) return;

        if (!cloudRow?.payload) {
          await pushCloudVault();
          return;
        }

        // Cloud exists — only push when this device has newer changes than the vault.
        if (localSync && cloudUpdated && localSync > cloudUpdated) {
          await pushCloudVault();
        }
      } finally {
        emitCloudSyncActive(false);
      }
    })(),
    "background-sync",
  ).finally(() => {
    syncInFlight = null;
  });

  return syncInFlight;
}

const AUTO_SYNC_DEBOUNCE_MS = 800;

export function scheduleCloudSync(): void {
  if (typeof window === "undefined") return;
  if (!shouldAutoCloudSync()) return;
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    void syncCloudNow();
  }, AUTO_SYNC_DEBOUNCE_MS);
}

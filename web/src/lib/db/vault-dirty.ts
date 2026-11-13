const DIRTY_KEY = "vw_vault_dirty";

let applyDepth = 0;

/** Cloud apply must not mark the vault dirty or it will push forever. */
export function beginVaultApply(): void {
  applyDepth += 1;
}

export function endVaultApply(): void {
  applyDepth = Math.max(0, applyDepth - 1);
}

/** Returns the token written, so a later clear does not drop a newer edit. */
export function markVaultDirty(): string | null {
  if (applyDepth > 0 || typeof localStorage === "undefined") return null;
  const token = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  try {
    localStorage.setItem(DIRTY_KEY, token);
  } catch {
    return null;
  }
  return token;
}

export function readVaultDirtyToken(): string | null {
  if (typeof localStorage === "undefined") return null;
  try {
    return localStorage.getItem(DIRTY_KEY);
  } catch {
    return null;
  }
}

export function isVaultDirty(): boolean {
  return readVaultDirtyToken() != null;
}

export function clearVaultDirty(token: string | null): void {
  if (!token || typeof localStorage === "undefined") return;
  try {
    if (localStorage.getItem(DIRTY_KEY) === token) localStorage.removeItem(DIRTY_KEY);
  } catch {
    /* ignore */
  }
}

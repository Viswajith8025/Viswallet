import { SESSION_STORAGE_KEY } from "./constants";

export function createSessionExpiry(autoLockMinutes: number): number {
  return Date.now() + autoLockMinutes * 60 * 1000;
}

export function persistSession(expiresAt: number): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(SESSION_STORAGE_KEY, String(expiresAt));
}

export function clearSession(): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(SESSION_STORAGE_KEY);
}

export function getSessionExpiry(): number | null {
  if (typeof sessionStorage === "undefined") return null;
  const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) return null;
  const exp = parseInt(raw, 10);
  return Number.isFinite(exp) ? exp : null;
}

export function isSessionValid(): boolean {
  const exp = getSessionExpiry();
  if (!exp) return false;
  return Date.now() < exp;
}

export function extendSession(autoLockMinutes: number): void {
  persistSession(createSessionExpiry(autoLockMinutes));
}

import { getSettings, updateSettings } from "@/lib/db";
import {
  hashPin,
  verifyPin,
  logAudit,
  MAX_PIN_ATTEMPTS,
  PIN_LOCKOUT_MS,
  SecureError,
  pinSchema,
} from "@/lib/security";
import { extendSession, clearSession } from "@/lib/security/session";

export async function isPinLocked(): Promise<boolean> {
  const s = await getSettings();
  if (!s.pinLockedUntil) return false;
  if (new Date() < new Date(s.pinLockedUntil)) return true;
  await updateSettings({ pinLockedUntil: undefined, failedPinAttempts: 0 });
  return false;
}

export async function enableAppLock(pin: string): Promise<void> {
  pinSchema.parse(pin);
  const { hash, salt } = await hashPin(pin);
  await updateSettings({
    appLockEnabled: true,
    pinHash: hash,
    pinSalt: salt,
    failedPinAttempts: 0,
    pinLockedUntil: undefined,
  });
  await logAudit("app.pin_set", { success: true });
}

export async function disableAppLock(pin: string): Promise<void> {
  const s = await getSettings();
  if (!s.pinHash || !s.pinSalt) {
    await updateSettings({
      appLockEnabled: false,
      pinHash: undefined,
      pinSalt: undefined,
      failedPinAttempts: 0,
      pinLockedUntil: undefined,
    });
    return;
  }
  pinSchema.parse(pin);
  const valid = await verifyPin(pin, s.pinHash, s.pinSalt);
  if (!valid) throw new SecureError("PIN_INVALID");
  await updateSettings({
    appLockEnabled: false,
    pinHash: undefined,
    pinSalt: undefined,
    failedPinAttempts: 0,
    pinLockedUntil: undefined,
  });
  clearSession();
  await logAudit("app.pin_disabled", { success: true });
}

export async function unlockWithPin(pin: string): Promise<void> {
  if (await isPinLocked()) throw new SecureError("PIN_LOCKED");

  const s = await getSettings();
  if (!s.pinHash || !s.pinSalt) throw new SecureError("PIN_INVALID");

  pinSchema.parse(pin);
  const valid = await verifyPin(pin, s.pinHash, s.pinSalt);
  if (!valid) {
    const attempts = (s.failedPinAttempts ?? 0) + 1;
    const updates: Parameters<typeof updateSettings>[0] = { failedPinAttempts: attempts };
    if (attempts >= MAX_PIN_ATTEMPTS) {
      updates.pinLockedUntil = new Date(Date.now() + PIN_LOCKOUT_MS);
      updates.failedPinAttempts = 0;
    }
    await updateSettings(updates);
    await logAudit("app.pin_failed", { success: false });
    if (attempts >= MAX_PIN_ATTEMPTS) throw new SecureError("PIN_LOCKED");
    throw new SecureError("PIN_INVALID");
  }

  await updateSettings({ failedPinAttempts: 0, pinLockedUntil: undefined });
  extendSession(s.autoLockMinutes ?? 15);
  await logAudit("app.unlock", { success: true });
}

export async function lockApp(): Promise<void> {
  clearSession();
  await logAudit("app.lock", { success: true });
}

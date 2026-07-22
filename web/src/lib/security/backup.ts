import { ENCRYPTED_BACKUP_PREFIX } from "./constants";
import { decryptBackup, encryptBackup } from "./crypto";
import { SecureError } from "./errors";
import { checkRateLimit } from "./rate-limit";
import { EXPORT_RATE_LIMIT, IMPORT_RATE_LIMIT } from "./constants";
import { parseBackupJson } from "./validation";
import type { ValidatedBackup } from "./validation";

export function validateBackupFile(file: File): void {
  if (file.size === 0) throw new SecureError("BACKUP_INVALID");
  if (file.size > 10 * 1024 * 1024) throw new SecureError("BACKUP_TOO_LARGE");

  const name = file.name.toLowerCase();
  const type = file.type;
  const validType =
    type === "application/json" || type === "text/json" || type === "" || type === "text/plain";
  const validExt = name.endsWith(".json") || name.endsWith(".vwbackup");

  if (!validType && !validExt) throw new SecureError("BACKUP_WRONG_TYPE");
}

export async function readBackupFile(file: File, passphrase?: string): Promise<string> {
  validateBackupFile(file);
  const text = await file.text();

  if (text.startsWith(ENCRYPTED_BACKUP_PREFIX) || text.startsWith('{"v":1,"salt"')) {
    if (!passphrase) throw new SecureError("BACKUP_DECRYPT_FAILED");
    try {
      const payload = text.startsWith(ENCRYPTED_BACKUP_PREFIX)
        ? text.slice(ENCRYPTED_BACKUP_PREFIX.length)
        : text;
      return await decryptBackup(payload, passphrase);
    } catch {
      throw new SecureError("BACKUP_DECRYPT_FAILED");
    }
  }

  return text;
}

export function validateBackupPayload(raw: string): ValidatedBackup {
  try {
    return parseBackupJson(raw);
  } catch {
    throw new SecureError("BACKUP_INVALID");
  }
}

export function assertImportRateLimit(): void {
  const { allowed } = checkRateLimit(
    "backup-import",
    IMPORT_RATE_LIMIT.maxAttempts,
    IMPORT_RATE_LIMIT.windowMs,
  );
  if (!allowed) throw new SecureError("RATE_LIMITED");
}

export function assertExportRateLimit(): void {
  const { allowed } = checkRateLimit(
    "backup-export",
    EXPORT_RATE_LIMIT.maxAttempts,
    EXPORT_RATE_LIMIT.windowMs,
  );
  if (!allowed) throw new SecureError("RATE_LIMITED");
}

export async function wrapEncryptedExport(json: string, passphrase: string): Promise<string> {
  const encrypted = await encryptBackup(json, passphrase);
  return `${ENCRYPTED_BACKUP_PREFIX}${encrypted}`;
}

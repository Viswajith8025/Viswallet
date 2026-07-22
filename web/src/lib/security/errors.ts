/** User-safe error messages — never expose internal details. */
export const SECURE_ERRORS = {
  BACKUP_INVALID: "Backup file is invalid or corrupted.",
  BACKUP_TOO_LARGE: "Backup file exceeds the maximum allowed size (10 MB).",
  BACKUP_WRONG_TYPE: "Only JSON backup files are accepted.",
  BACKUP_DECRYPT_FAILED: "Could not decrypt backup. Check your passphrase.",
  IMPORT_FAILED: "Import failed. Your existing data was not changed.",
  EXPORT_FAILED: "Export failed. Please try again.",
  PIN_INVALID: "Incorrect PIN.",
  PIN_LOCKED: "Too many attempts. Try again later.",
  PIN_WEAK: "PIN must be 4–8 digits.",
  PIN_MISMATCH: "PINs do not match.",
  RATE_LIMITED: "Too many attempts. Please wait before trying again.",
  GENERIC: "Something went wrong. Please try again.",
  SETTINGS_UNAVAILABLE: "Settings are not available. Refresh the page.",
} as const;

export type SecureErrorCode = keyof typeof SECURE_ERRORS;

export class SecureError extends Error {
  readonly code: SecureErrorCode;

  constructor(code: SecureErrorCode) {
    super(SECURE_ERRORS[code]);
    this.name = "SecureError";
    this.code = code;
  }
}

/** Map unknown errors to safe user messages. */
export function toSecureMessage(error: unknown): string {
  if (error instanceof SecureError) return error.message;
  return SECURE_ERRORS.GENERIC;
}

/** User-safe error messages — calm, clear, never expose internals. */
export const SECURE_ERRORS = {
  BACKUP_INVALID: "That backup file doesn't look right. Try another file.",
  BACKUP_TOO_LARGE: "This file is larger than 10 MB. Try a smaller export.",
  BACKUP_WRONG_TYPE: "Please choose a JSON or .vwbackup file.",
  BACKUP_DECRYPT_FAILED: "Couldn't open this backup. Check your passphrase.",
  IMPORT_FAILED: "Import didn't complete. Your current data is unchanged.",
  EXPORT_FAILED: "Export didn't finish. Try again in a moment.",
  PIN_INVALID: "That PIN didn't match.",
  PIN_LOCKED: "Too many tries. Wait a bit, then try again.",
  PIN_WEAK: "Use 4 to 8 digits for your PIN.",
  PIN_MISMATCH: "Those PINs don't match.",
  RATE_LIMITED: "A few too many attempts. Pause for a moment.",
  GENERIC: "Something went wrong. Try again in a moment.",
  SETTINGS_UNAVAILABLE: "Settings aren't available right now. Refresh the page.",
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

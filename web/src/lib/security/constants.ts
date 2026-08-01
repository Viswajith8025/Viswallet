/** Maximum backup file size (10 MB). */
export const MAX_BACKUP_BYTES = 10 * 1024 * 1024;

/** Maximum records per table in a backup. */
export const MAX_BACKUP_RECORDS = 50_000;

/** String field limits. */
export const MAX_TITLE_LENGTH = 200;
export const MAX_NAME_LENGTH = 120;
export const MAX_NOTES_LENGTH = 2_000;
export const MAX_EMAIL_LENGTH = 254;
export const MAX_URL_LENGTH = 2_048;
/** Profile photo stored as a compressed data URL in IndexedDB. */
export const MAX_AVATAR_DATA_LENGTH = 400_000;
export const MAX_TAGS = 20;
export const MAX_TAG_LENGTH = 40;

/** Money limits (paise) — ~₹100 crore cap. */
export const MAX_AMOUNT_PAISE = 10_000_000_000;

/** PIN / app lock. */
export const PIN_MIN_LENGTH = 4;
export const PIN_MAX_LENGTH = 8;
export const MAX_PIN_ATTEMPTS = 5;
export const PIN_LOCKOUT_MS = 30 * 60 * 1000;
export const DEFAULT_AUTO_LOCK_MINUTES = 15;
export const SESSION_STORAGE_KEY = "vw_session";

/** Rate limits (client-side). */
export const IMPORT_RATE_LIMIT = { maxAttempts: 3, windowMs: 60_000 };
export const EXPORT_RATE_LIMIT = { maxAttempts: 10, windowMs: 60_000 };
export const RESET_RATE_LIMIT = { maxAttempts: 2, windowMs: 300_000 };

/** Backup format. */
export const BACKUP_VERSION = 3;
export const ENCRYPTED_BACKUP_PREFIX = "VWENC1:";

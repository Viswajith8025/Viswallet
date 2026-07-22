import {
  MAX_EMAIL_LENGTH,
  MAX_NAME_LENGTH,
  MAX_NOTES_LENGTH,
  MAX_TAG_LENGTH,
  MAX_TAGS,
  MAX_TITLE_LENGTH,
  MAX_URL_LENGTH,
} from "./constants";

/** Strip control chars and angle brackets; cap length. */
export function sanitizeText(value: string, maxLength: number): string {
  return value
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, maxLength);
}

export function sanitizeTitle(value: string): string {
  return sanitizeText(value, MAX_TITLE_LENGTH);
}

export function sanitizeName(value: string): string {
  return sanitizeText(value, MAX_NAME_LENGTH);
}

export function sanitizeNotes(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const s = sanitizeText(value, MAX_NOTES_LENGTH);
  return s || undefined;
}

export function sanitizeEmail(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const s = sanitizeText(value, MAX_EMAIL_LENGTH).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return undefined;
  return s;
}

export function sanitizeUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const s = sanitizeText(value, MAX_URL_LENGTH);
  try {
    const u = new URL(s);
    if (u.protocol !== "http:" && u.protocol !== "https:") return undefined;
    return u.toString();
  } catch {
    return undefined;
  }
}

export function sanitizeSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 48);
}

export function sanitizeTags(tags: string[]): string[] {
  return tags
    .slice(0, MAX_TAGS)
    .map((t) => sanitizeText(t, MAX_TAG_LENGTH))
    .filter(Boolean);
}

export function clampPaise(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.min(Math.floor(value), 10_000_000_000);
}

export function clampSalaryDay(day: number): number {
  if (!Number.isFinite(day)) return 1;
  return Math.min(28, Math.max(1, Math.floor(day)));
}

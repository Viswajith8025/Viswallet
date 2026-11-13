import { applyThemeMode, type ThemeMode } from "./resolve";

/** Single theme preference. The boot script, header toggle, and Settings select all read this. */
export const THEME_STORAGE_KEY = "vw-theme";

const listeners = new Set<() => void>();

function isThemeMode(value: string | null): value is ThemeMode {
  return value === "dark" || value === "light" || value === "system";
}

/** A choice the user (or a previous session) wrote to vw-theme. Null when the key is absent. */
export function readExplicitTheme(): ThemeMode | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeMode(stored) ? stored : null;
  } catch {
    return null;
  }
}

/** vw-theme, then the legacy boot cache, then dark. */
export function readThemeMode(): ThemeMode {
  const explicit = readExplicitTheme();
  if (explicit) return explicit;
  if (typeof window === "undefined") return "dark";
  try {
    const raw = localStorage.getItem("vw_boot_cache");
    if (raw) {
      const mode = (JSON.parse(raw) as { themeMode?: string }).themeMode ?? null;
      if (isThemeMode(mode)) return mode;
    }
  } catch {
    /* ignore malformed boot cache */
  }
  return "dark";
}

export function subscribeTheme(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emitTheme(): void {
  listeners.forEach((listener) => listener());
}

/** Persist and apply. Synchronous so a navigation cannot outrun the write. */
export function writeThemeMode(mode: ThemeMode): void {
  localStorage.setItem(THEME_STORAGE_KEY, mode);
  applyThemeMode(mode);
  emitTheme();
}

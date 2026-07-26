import type { AccentColor, AppSettings, ThemeMode } from "./types";

const BOOT_CACHE_KEY = "vw_boot_cache";

export type BootCache = {
  themeMode: ThemeMode;
  accentColor: AccentColor;
  onboardingComplete: boolean;
  appLockEnabled: boolean;
  autoLockMinutes: number;
};

let settingsMemoryCache: AppSettings | null = null;

export function peekBootCache(): BootCache | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(BOOT_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as BootCache;
  } catch {
    return null;
  }
}

export function writeBootCache(settings: AppSettings): void {
  if (typeof window === "undefined") return;
  const cache: BootCache = {
    themeMode: settings.themeMode,
    accentColor: (settings.accentColor ?? "violet") as AccentColor,
    onboardingComplete: settings.onboardingComplete,
    appLockEnabled: settings.appLockEnabled && Boolean(settings.pinHash),
    autoLockMinutes: settings.autoLockMinutes ?? 15,
  };
  localStorage.setItem(BOOT_CACHE_KEY, JSON.stringify(cache));
}

export function readSettingsCache(): AppSettings | null {
  return settingsMemoryCache;
}

export function rememberSettings(settings: AppSettings): AppSettings {
  settingsMemoryCache = settings;
  writeBootCache(settings);
  return settings;
}

export function clearSettingsCache(): void {
  settingsMemoryCache = null;
  if (typeof window !== "undefined") {
    localStorage.removeItem(BOOT_CACHE_KEY);
  }
}

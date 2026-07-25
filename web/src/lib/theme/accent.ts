import type { AccentColor } from "@/lib/db/types";
import { ACCENT_PALETTES } from "@/lib/db/types";
import { resolveThemeMode } from "@/lib/theme/resolve";

function isDarkTheme(): boolean {
  if (typeof window === "undefined") return false;
  const mode = document.documentElement.getAttribute("data-theme");
  if (mode === "dark") return true;
  if (mode === "light") return false;
  return resolveThemeMode("system") === "dark";
}

export function applyAccentColor(accent: AccentColor): void {
  const palette = ACCENT_PALETTES[accent] ?? ACCENT_PALETTES.violet;
  const root = document.documentElement;
  const dark = isDarkTheme();
  root.style.setProperty("--primary", dark ? palette.ring : palette.primary);
  root.style.setProperty("--primary-hover", dark ? palette.primary : palette.ring);
  root.style.setProperty("--ring", palette.ring);
  root.style.setProperty("--accent-foreground", dark ? palette.ring : palette.primary);
  root.setAttribute("data-accent", accent);
}

export function clearAccentOverrides(): void {
  const root = document.documentElement;
  root.style.removeProperty("--primary");
  root.style.removeProperty("--ring");
  root.style.removeProperty("--accent-foreground");
  root.removeAttribute("data-accent");
}

import type { AccentColor } from "@/lib/db/types";
import { ACCENT_PALETTES } from "@/lib/db/types";

export function applyAccentColor(accent: AccentColor): void {
  const palette = ACCENT_PALETTES[accent] ?? ACCENT_PALETTES.violet;
  const root = document.documentElement;
  root.style.setProperty("--primary", palette.primary);
  root.style.setProperty("--ring", palette.ring);
  root.style.setProperty("--accent-foreground", palette.primary);
  root.setAttribute("data-accent", accent);
}

export function clearAccentOverrides(): void {
  const root = document.documentElement;
  root.style.removeProperty("--primary");
  root.style.removeProperty("--ring");
  root.style.removeProperty("--accent-foreground");
  root.removeAttribute("data-accent");
}

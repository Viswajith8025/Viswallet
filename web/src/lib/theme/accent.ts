/** Accent palettes are ignored. This clears any inline color left by an older build. */
export function applyAccentColor(): void {
  clearAccentOverrides();
}

export function clearAccentOverrides(): void {
  const root = document.documentElement;
  root.style.removeProperty("--primary");
  root.style.removeProperty("--primary-hover");
  root.style.removeProperty("--ring");
  root.style.removeProperty("--accent-foreground");
  root.removeAttribute("data-accent");
}

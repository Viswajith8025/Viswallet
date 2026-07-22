/**
 * Viswallet Design System v3 — token reference.
 * Source of truth for runtime values is globals.css (`:root` + `@theme inline`).
 */

export const radius = {
  sm: "var(--radius-sm)",
  md: "var(--radius-md)",
  lg: "var(--radius-lg)",
  xl: "var(--radius-xl)",
  "2xl": "var(--radius-2xl)",
  full: "9999px",
} as const;

export const shadow = {
  xs: "var(--shadow-xs)",
  sm: "var(--shadow-sm)",
  md: "var(--shadow-md)",
  lg: "var(--shadow-lg)",
  xl: "var(--shadow-xl)",
  glow: "var(--shadow-glow)",
} as const;

export const duration = {
  fast: "var(--duration-fast)",
  normal: "var(--duration-normal)",
  slow: "var(--duration-slow)",
} as const;

export const ease = {
  outExpo: "var(--ease-out-expo)",
  spring: "var(--ease-spring)",
} as const;

/** Lucide icon sizes — use with `<Icon size="md" />` */
export const iconSize = {
  xs: 14,
  sm: 16,
  md: 18,
  lg: 20,
  xl: 24,
} as const;

export type IconSize = keyof typeof iconSize;

export const typography = {
  eyebrow: "text-eyebrow",
  label: "text-label",
  body: "text-body",
  caption: "text-caption",
  title: "text-title",
  display: "text-display",
  stat: "text-stat",
} as const;

export const spacing = {
  page: "space-y-8",
  section: "space-y-6",
  stack: "space-y-4",
  inline: "gap-2",
  card: "p-5",
} as const;

/**
 * Single source of truth for the Viswallet mark.
 * Filled geometry only — reads clearly from 16px favicon to 512px PWA icon.
 */
export const LOGO_VIEWBOX = 48;

export const LOGO_TILE_RX = 13;

export const LOGO_COLORS = {
  violet: "#5f4a8b",
  cream: "#fefacd",
  creamDeep: "#ede6b0",
} as const;

/** Left wallet fold */
export const LOGO_WING_LEFT = "M11 12H22.25L24.75 37H11V12Z";

/** Right wallet fold — slightly deeper tone */
export const LOGO_WING_RIGHT = "M37 12H25.75L23.25 37H37V12Z";

/** Clasp across the fold */
export const LOGO_CLASP =
  "M16.75 14.25H31.25C32.05 14.25 32.75 14.95 32.75 15.75V17C32.75 17.8 32.05 18.5 31.25 18.5H16.75C15.95 18.5 15.25 17.8 15.25 17V15.75C15.25 14.95 15.95 14.25 16.75 14.25Z";

export function logoTileRadius(size: number): number {
  return (size * LOGO_TILE_RX) / LOGO_VIEWBOX;
}

/**
 * Viswallet premium mark — vault seal with geometric V facets.
 * Filled geometry only; reads from 16px favicon to 512px PWA icon.
 */
export const LOGO_VIEWBOX = 48;

export const LOGO_TILE_RX = 14;

export const LOGO_COLORS = {
  violetDeep: "#3d3058",
  violet: "#5f4a8b",
  violetGlow: "#6b5a95",
  cream: "#fefacd",
  creamDeep: "#e8dfb8",
  gold: "#c9b87a",
} as const;

/** Base tile */
export const LOGO_TILE = "M0 0H48V48H0V0Z";

/** Soft top luminance for depth */
export const LOGO_TILE_LUMINANCE =
  "M0 0H48V22C48 22 38 18.5 24 19.5C10 18.5 0 22 0 22V0Z";

/** Inner seal ring */
export const LOGO_INNER_RING =
  "M2.5 2.5H45.5V45.5H2.5V2.5Z";

/** Wallet crown flap */
export const LOGO_CROWN = "M11 17.25C11 13.35 16.2 10.25 24 10.25C31.8 10.25 37 13.35 37 17.25L35.1 20H12.9L11 17.25Z";

/** Left V facet */
export const LOGO_V_LEFT = "M12.75 20.25L23.75 37.75H21L11.25 20.25H12.75Z";

/** Right V facet */
export const LOGO_V_RIGHT = "M35.25 20.25L24.25 37.75H27L36.75 20.25H35.25Z";

/** Premium clasp bar */
export const LOGO_CLASP =
  "M17 15.25H31C32.1 15.25 33 16.15 33 17.25V18.05C33 19.15 32.1 20.05 31 20.05H17C15.9 20.05 15 19.15 15 18.05V17.25C15 16.15 15.9 15.25 17 15.25Z";

export function logoTileRadius(size: number): number {
  return (size * LOGO_TILE_RX) / LOGO_VIEWBOX;
}

import {
  LOGO_CLASP,
  LOGO_COLORS,
  LOGO_TILE_RX,
  LOGO_VIEWBOX,
  LOGO_WING_LEFT,
  LOGO_WING_RIGHT,
} from "@/lib/brand/logo-signature";

/** Shared mark for next/og ImageResponse routes — no client hooks. */
export function OgLogoMark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox={`0 0 ${LOGO_VIEWBOX} ${LOGO_VIEWBOX}`}>
      <rect width={LOGO_VIEWBOX} height={LOGO_VIEWBOX} rx={LOGO_TILE_RX} fill={LOGO_COLORS.violet} />
      <path d={LOGO_WING_LEFT} fill={LOGO_COLORS.cream} />
      <path d={LOGO_WING_RIGHT} fill={LOGO_COLORS.creamDeep} />
      <path d={LOGO_CLASP} fill={LOGO_COLORS.violet} />
    </svg>
  );
}

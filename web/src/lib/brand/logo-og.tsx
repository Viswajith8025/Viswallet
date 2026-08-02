import {
  LOGO_CROWN,
  LOGO_CLASP,
  LOGO_COLORS,
  LOGO_TILE_LUMINANCE,
  LOGO_TILE_RX,
  LOGO_V_LEFT,
  LOGO_V_RIGHT,
  LOGO_VIEWBOX,
} from "@/lib/brand/logo-signature";

/**
 * Flat mark for next/og ImageResponse — no clipPath or strokes (Satori-safe).
 */
export function OgLogoMark({ size }: { size: number }) {
  const radius = (size * LOGO_TILE_RX) / LOGO_VIEWBOX;

  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: LOGO_COLORS.violetDeep,
        borderRadius: radius,
      }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${LOGO_VIEWBOX} ${LOGO_VIEWBOX}`} fill="none">
        <rect width={LOGO_VIEWBOX} height={LOGO_VIEWBOX} rx={LOGO_TILE_RX} fill={LOGO_COLORS.violetDeep} />
        <path d={LOGO_TILE_LUMINANCE} fill={LOGO_COLORS.violetGlow} opacity={0.42} />
        <path d={LOGO_CROWN} fill={LOGO_COLORS.creamDeep} />
        <path d={LOGO_V_LEFT} fill={LOGO_COLORS.cream} />
        <path d={LOGO_V_RIGHT} fill={LOGO_COLORS.creamDeep} />
        <path d={LOGO_CLASP} fill={LOGO_COLORS.gold} />
      </svg>
    </div>
  );
}

import {
  LOGO_CROWN,
  LOGO_CLASP,
  LOGO_COLORS,
  LOGO_INNER_RING,
  LOGO_TILE,
  LOGO_TILE_LUMINANCE,
  LOGO_TILE_RX,
  LOGO_V_LEFT,
  LOGO_V_RIGHT,
  LOGO_VIEWBOX,
} from "@/lib/brand/logo-signature";

export type LogoMarkVariant = "default" | "inverse" | "mark-only";

type LogoMarkContentProps = {
  variant?: LogoMarkVariant;
};

/**
 * Shared mark geometry for in-app SVG and next/og icon routes.
 */
export function LogoMarkContent({ variant = "default" }: LogoMarkContentProps) {
  const isInverse = variant === "inverse";

  const tileBase = isInverse ? LOGO_COLORS.cream : LOGO_COLORS.violetDeep;
  const tileGlow = isInverse ? LOGO_COLORS.creamDeep : LOGO_COLORS.violetGlow;
  const ringStroke = isInverse ? LOGO_COLORS.violet : LOGO_COLORS.violetGlow;
  const crownFill = isInverse ? LOGO_COLORS.violetDeep : LOGO_COLORS.creamDeep;
  const vLeftFill = isInverse ? LOGO_COLORS.violet : LOGO_COLORS.cream;
  const vRightFill = isInverse ? LOGO_COLORS.violetDeep : LOGO_COLORS.creamDeep;
  const claspFill = isInverse ? LOGO_COLORS.cream : LOGO_COLORS.gold;

  if (variant === "mark-only") {
    return (
      <>
        <path d={LOGO_CROWN} fill="currentColor" opacity={0.55} />
        <path d={LOGO_V_LEFT} fill="currentColor" />
        <path d={LOGO_V_RIGHT} fill="currentColor" opacity={0.78} />
        <path d={LOGO_CLASP} fill="currentColor" opacity={0.9} />
      </>
    );
  }

  return (
    <>
      <path d={LOGO_TILE} fill={tileBase} />
      <path d={LOGO_TILE_LUMINANCE} fill={tileGlow} opacity={isInverse ? 0.35 : 0.42} />
      <path
        d={LOGO_INNER_RING}
        fill="none"
        stroke={ringStroke}
        strokeWidth={0.45}
        opacity={isInverse ? 0.22 : 0.38}
      />
      <path d={LOGO_CROWN} fill={crownFill} />
      <path d={LOGO_V_LEFT} fill={vLeftFill} />
      <path d={LOGO_V_RIGHT} fill={vRightFill} />
      <path d={LOGO_CLASP} fill={claspFill} />
    </>
  );
}

export function logoMarkSvgProps() {
  return {
    viewBox: `0 0 ${LOGO_VIEWBOX} ${LOGO_VIEWBOX}`,
    fill: "none" as const,
    xmlns: "http://www.w3.org/2000/svg",
  };
}

export function logoMarkClipRadius() {
  return LOGO_TILE_RX;
}

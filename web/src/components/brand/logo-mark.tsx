import { cn } from "@/lib/design/cn";
import {
  LOGO_CLASP,
  LOGO_COLORS,
  LOGO_TILE_RX,
  LOGO_VIEWBOX,
  LOGO_WING_LEFT,
  LOGO_WING_RIGHT,
} from "@/lib/brand/logo-signature";

type LogoMarkProps = {
  size?: number;
  className?: string;
  /** Violet tile with cream mark (default) */
  variant?: "default" | "inverse" | "mark-only";
};

/**
 * Viswallet mark — two folded planes with a violet V valley (wallet + Vishwajit V).
 */
export function LogoMark({ size = 36, className, variant = "default" }: LogoMarkProps) {
  const tileFill =
    variant === "inverse" ? LOGO_COLORS.cream : variant === "mark-only" ? "none" : LOGO_COLORS.violet;
  const wingPrimary =
    variant === "inverse" ? LOGO_COLORS.violet : variant === "mark-only" ? "currentColor" : LOGO_COLORS.cream;
  const wingSecondary =
    variant === "inverse" ? LOGO_COLORS.violet : variant === "mark-only" ? "currentColor" : LOGO_COLORS.creamDeep;
  const claspFill =
    variant === "inverse" ? LOGO_COLORS.cream : variant === "mark-only" ? "currentColor" : LOGO_COLORS.violet;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${LOGO_VIEWBOX} ${LOGO_VIEWBOX}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden
    >
      {variant !== "mark-only" && (
        <rect width={LOGO_VIEWBOX} height={LOGO_VIEWBOX} rx={LOGO_TILE_RX} fill={tileFill} />
      )}
      <path d={LOGO_WING_LEFT} fill={wingPrimary} />
      <path d={LOGO_WING_RIGHT} fill={wingSecondary} opacity={variant === "mark-only" ? 0.72 : 1} />
      {variant !== "mark-only" && <path d={LOGO_CLASP} fill={claspFill} />}
    </svg>
  );
}

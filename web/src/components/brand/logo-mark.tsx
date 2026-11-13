import { cn } from "@/lib/design/cn";
import { LOGO_PATH } from "@/lib/brand/constants";

type LogoMarkProps = {
  size?: number;
  className?: string;
  /** Kept for compatibility with existing call sites */
  variant?: "default" | "inverse" | "mark-only";
};

/** Lime receipt mark. The SVG already includes its tile; do not restyle the artwork. */
export function LogoMark({ size = 36, className }: LogoMarkProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- brand SVG, sized per context
    <img
      src={LOGO_PATH}
      alt=""
      width={size}
      height={size}
      className={cn("shrink-0 select-none", className)}
      style={{ width: size, height: size }}
      aria-hidden
      decoding="async"
    />
  );
}

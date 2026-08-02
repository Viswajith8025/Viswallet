import { cn } from "@/lib/design/cn";
import { LOGO_PATH, LOGO_PATH_2X } from "@/lib/brand/constants";

type LogoMarkProps = {
  size?: number;
  className?: string;
  /** Kept for compatibility with existing call sites */
  variant?: "default" | "inverse" | "mark-only";
};

/**
 * Official visWallet logo mark — raster artwork, never stretched or distorted.
 */
export function LogoMark({ size = 36, className }: LogoMarkProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- official brand raster; sized per context
    <img
      src={LOGO_PATH}
      srcSet={`${LOGO_PATH} 1x, ${LOGO_PATH_2X} 2x`}
      alt=""
      width={size}
      height={size}
      className={cn("shrink-0 select-none rounded-[22%]", className)}
      style={{ width: size, height: size }}
      aria-hidden
      decoding="async"
    />
  );
}

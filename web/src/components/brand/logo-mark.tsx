"use client";

import { useId } from "react";
import { cn } from "@/lib/design/cn";
import {
  LogoMarkContent,
  logoMarkClipRadius,
  logoMarkSvgProps,
  type LogoMarkVariant,
} from "@/lib/brand/logo-mark-content";

type LogoMarkProps = {
  size?: number;
  className?: string;
  /** Violet vault tile with cream mark (default) */
  variant?: LogoMarkVariant;
};

/**
 * Viswallet premium mark — vault seal with geometric V facets.
 */
export function LogoMark({ size = 36, className, variant = "default" }: LogoMarkProps) {
  const clipId = useId();
  const rx = logoMarkClipRadius();

  return (
    <svg
      width={size}
      height={size}
      {...logoMarkSvgProps()}
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <defs>
        <clipPath id={clipId}>
          <rect width={48} height={48} rx={rx} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <LogoMarkContent variant={variant} />
      </g>
    </svg>
  );
}

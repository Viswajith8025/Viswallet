"use client";

import { cn } from "@/lib/design/cn";
import { LogoMark } from "@/components/brand/logo-mark";

type BrandLoaderProps = {
  className?: string;
  size?: number;
  label?: string;
  fullScreen?: boolean;
};

/** Branded loading state — subtle logo pulse, no generic spinner. */
export function BrandLoader({ className, size = 44, label, fullScreen = false }: BrandLoaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6",
        fullScreen ? "min-h-[100dvh] min-h-screen bg-background" : "py-16",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="brand-logo-pulse rounded-[22%] p-0.5">
        <LogoMark size={size} />
      </div>
      {label && (
        <p className="mt-5 text-sm text-muted-foreground" aria-hidden>
          {label}
        </p>
      )}
      <span className="sr-only">{label ?? "Loading"}</span>
    </div>
  );
}

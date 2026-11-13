import { cn } from "@/lib/design/cn";
import { BRAND_TAGLINE } from "@/lib/brand/constants";

type BrandTaglineProps = {
  className?: string;
  inverted?: boolean;
};

/** Secondary brand line — lowercase mono, never louder than the lockup. */
export function BrandTagline({ className, inverted = false }: BrandTaglineProps) {
  return (
    <p
      className={cn(
        "font-mono text-[11px] font-medium lowercase leading-none tracking-[0.04em]",
        inverted ? "text-[#9A968A]" : "text-muted-foreground",
        className,
      )}
    >
      {BRAND_TAGLINE}
    </p>
  );
}

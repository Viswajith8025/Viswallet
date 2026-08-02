import { cn } from "@/lib/design/cn";
import { BRAND_TAGLINE } from "@/lib/brand/constants";

type BrandTaglineProps = {
  className?: string;
  inverted?: boolean;
};

/** Secondary brand line — always lowercase, never emphasized over the logo. */
export function BrandTagline({ className, inverted = false }: BrandTaglineProps) {
  return (
    <p
      className={cn(
        "text-[11px] font-normal leading-snug tracking-[0.01em]",
        inverted ? "text-[var(--cream)]/55" : "text-muted-foreground/75",
        className,
      )}
    >
      {BRAND_TAGLINE}
    </p>
  );
}

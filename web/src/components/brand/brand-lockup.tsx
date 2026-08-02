import Link from "next/link";
import { cn } from "@/lib/design/cn";
import { BRAND_NAME } from "@/lib/brand/constants";
import { LogoMark } from "@/components/brand/logo-mark";
import { BrandTagline } from "@/components/brand/brand-tagline";

type BrandLockupProps = {
  className?: string;
  markSize?: number;
  inverted?: boolean;
  href?: string;
  showTagline?: boolean;
  /** Hide wordmark text — logo only */
  markOnly?: boolean;
  taglineClassName?: string;
  layout?: "horizontal" | "vertical";
};

export function BrandLockup({
  className,
  markSize = 36,
  inverted = false,
  href,
  showTagline = false,
  markOnly = false,
  taglineClassName,
  layout = "horizontal",
}: BrandLockupProps) {
  const content = (
    <div
      className={cn(
        layout === "vertical" ? "flex flex-col items-center text-center" : "flex items-center gap-3",
        className,
      )}
    >
      <LogoMark size={markSize} />
      {!markOnly && (
        <div className={cn("min-w-0", layout === "vertical" && "mt-3")}>
          <p
            className={cn(
              "font-display text-[17px] font-semibold leading-none tracking-[-0.03em]",
              inverted ? "text-[var(--cream)]" : "text-foreground",
            )}
          >
            {BRAND_NAME}
          </p>
          {showTagline && (
            <BrandTagline inverted={inverted} className={cn("mt-1.5", taglineClassName)} />
          )}
        </div>
      )}
      {markOnly && showTagline && (
        <BrandTagline inverted={inverted} className={cn("mt-3", taglineClassName)} />
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex transition-opacity hover:opacity-90" aria-label={`${BRAND_NAME} home`}>
        {content}
      </Link>
    );
  }

  return content;
}

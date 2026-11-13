import Link from "next/link";
import { cn } from "@/lib/design/cn";
import { BRAND_NAME, BRAND_VIS, BRAND_WALLET } from "@/lib/brand/constants";
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
  const visSize = Math.max(15, Math.round(markSize * 0.52));
  const wordmark = (
    <span className="inline-flex min-w-0 items-baseline">
      <span
        className={cn(
          "font-display font-extrabold leading-none tracking-[-0.04em]",
          inverted ? "text-[#F4F1E8]" : "text-foreground",
        )}
        style={{ fontSize: visSize }}
      >
        {BRAND_VIS}
      </span>
      <span
        className={cn(
          "font-mono font-medium uppercase leading-none tracking-[0.18em]",
          inverted ? "text-[#F4F1E8]" : "text-foreground",
        )}
        style={{ fontSize: Math.round(visSize * 0.55), marginLeft: "0.28em" }}
      >
        {BRAND_WALLET}
      </span>
    </span>
  );

  const content = (
    <div
      className={cn(
        layout === "vertical" ? "flex flex-col items-center text-center" : "flex items-center gap-2.5",
        className,
      )}
    >
      <LogoMark size={markSize} />
      {!markOnly && (
        <div className={cn("min-w-0", layout === "vertical" && "mt-3")}>
          {wordmark}
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
      <Link href={href} className="inline-flex transition-opacity duration-150 hover:opacity-90" aria-label={`${BRAND_NAME} home`}>
        {content}
      </Link>
    );
  }

  return content;
}

import { BrandLockup } from "@/components/brand/brand-lockup";

type LogoWordmarkProps = {
  className?: string;
  markSize?: number;
  inverted?: boolean;
  href?: string;
  showTagline?: boolean;
  layout?: "horizontal" | "vertical";
};

/** Logo + visWallet wordmark with optional tagline. */
export function LogoWordmark({
  className,
  markSize = 36,
  inverted = false,
  href,
  showTagline = false,
  layout = "horizontal",
}: LogoWordmarkProps) {
  return (
    <BrandLockup
      className={className}
      markSize={markSize}
      inverted={inverted}
      href={href}
      showTagline={showTagline}
      layout={layout}
    />
  );
}

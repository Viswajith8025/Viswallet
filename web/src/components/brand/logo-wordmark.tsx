import Link from "next/link";
import { cn } from "@/lib/design/cn";
import { LogoMark } from "@/components/brand/logo-mark";

type LogoWordmarkProps = {
  className?: string;
  markSize?: number;
  inverted?: boolean;
  href?: string;
  showTagline?: boolean;
};

export function LogoWordmark({
  className,
  markSize = 36,
  inverted = false,
  href,
  showTagline = false,
}: LogoWordmarkProps) {
  const content = (
    <div className={cn("flex items-center gap-3", className)}>
      <LogoMark size={markSize} variant={inverted ? "inverse" : "default"} />
      <div className="min-w-0">
        <p
          className={cn(
            "font-display text-[17px] font-semibold leading-none tracking-[-0.04em]",
            inverted ? "text-[var(--cream)]" : "text-foreground",
          )}
        >
          Viswallet
        </p>
        {showTagline && (
          <p
            className={cn(
              "mt-1.5 text-[10px] font-medium tracking-[0.22em] uppercase",
              inverted ? "text-[var(--cream)]/45" : "text-muted-foreground/70",
            )}
          >
            Personal finance
          </p>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex transition-opacity hover:opacity-85">
        {content}
      </Link>
    );
  }

  return content;
}

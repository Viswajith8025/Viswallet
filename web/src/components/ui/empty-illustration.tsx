import type { ReactNode } from "react";
import { cn } from "@/lib/design/cn";
import { LogoMark } from "@/components/brand/logo-mark";

type IllustrationVariant = "wallet" | "transactions" | "goals" | "inbox";

const paths: Record<IllustrationVariant, ReactNode> = {
  wallet: null,
  transactions: (
    <>
      <rect x="10" y="10" width="44" height="8" rx="4" className="fill-muted-foreground/15" />
      <rect x="10" y="24" width="36" height="8" rx="4" className="fill-primary/15" />
      <rect x="10" y="38" width="42" height="8" rx="4" className="fill-muted-foreground/10" />
      <circle cx="48" cy="28" r="10" className="fill-success/20 stroke-success/40" strokeWidth="1.5" />
      <path d="M44 28 L47 31 L52 25" className="stroke-success" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </>
  ),
  goals: (
    <>
      <circle cx="32" cy="32" r="22" className="fill-primary/8 stroke-primary/25" strokeWidth="1.5" />
      <path
        d="M32 18 L36 28 L46 28 L38 34 L41 44 L32 38 L23 44 L26 34 L18 28 L28 28 Z"
        className="fill-warning/30 stroke-warning/50"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </>
  ),
  inbox: (
    <>
      <path
        d="M12 20 L12 44 Q12 48 16 48 L48 48 Q52 48 52 44 L52 20 Q52 16 48 16 L16 16 Q12 16 12 20 Z"
        className="fill-muted/80 stroke-border-strong"
        strokeWidth="1.5"
      />
      <path d="M12 24 L28 36 L44 24" className="stroke-primary/40" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </>
  ),
};

export function EmptyIllustration({
  variant = "inbox",
  className,
}: {
  variant?: IllustrationVariant;
  className?: string;
}) {
  if (variant === "wallet") {
    return (
      <div
        className={cn(
          "flex h-20 w-20 items-center justify-center rounded-xl border border-border-light bg-surface-secondary/80 p-2 shadow-xs animate-gentle-float",
          className,
        )}
        aria-hidden
      >
        <LogoMark size={52} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex h-20 w-20 items-center justify-center rounded-xl border border-border-light bg-surface-secondary shadow-xs animate-gentle-float",
        className,
      )}
      aria-hidden
    >
      <svg viewBox="0 0 64 64" className="h-12 w-12" fill="none">
        {paths[variant]}
      </svg>
    </div>
  );
}

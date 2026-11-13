"use client";

import { ViewTransition } from "react";
import { cn } from "@/lib/design/cn";
import { formatINR } from "@/lib/money";

/** Same named transition on Home and Money so the figure moves instead of swapping. */
export function SharedBalance({
  paise,
  className,
}: {
  paise: number;
  className?: string;
}) {
  return (
    <ViewTransition name="hero-balance" share="auto" default="none">
      <p className={cn("money text-ink", className)}>{formatINR(paise)}</p>
    </ViewTransition>
  );
}

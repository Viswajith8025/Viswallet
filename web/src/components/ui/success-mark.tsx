"use client";

import { useReducedMotion } from "motion/react";
import { cn } from "@/lib/design/cn";

export function SuccessMark({
  size = "lg",
  className,
  label = "Saved",
}: {
  size?: "md" | "lg";
  className?: string;
  label?: string;
}) {
  const reduced = useReducedMotion();
  const box = size === "lg" ? "h-14 w-14" : "h-11 w-11";

  return (
    <div className={cn("flex flex-col items-center text-center text-lime", className)}>
      <svg viewBox="0 0 24 24" className={box} aria-hidden>
        <path
          d="M5 12.5 9.5 17 19 7"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          pathLength={1}
          className={reduced ? undefined : "success-draw"}
        />
      </svg>
      {label && <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-ink">{label}</p>}
    </div>
  );
}

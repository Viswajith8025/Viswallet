"use client";

import { LogoMark } from "@/components/brand/logo-mark";

export function SplashScreen({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="rounded-[22px] p-1 shadow-[0_20px_50px_-24px_color-mix(in_srgb,var(--violet-deep)_55%,transparent)]">
        <LogoMark size={52} />
      </div>
      <p className="mt-8 font-display text-[16px] font-semibold tracking-[-0.04em] text-foreground">
        Viswallet
      </p>
      <p className="mt-2 text-[11px] font-medium tracking-[0.2em] uppercase text-muted-foreground/70">
        Personal finance
      </p>
      <p className="mt-3 text-sm text-muted-foreground">{label}</p>
      <div className="mt-8 h-px w-10 bg-border/80" aria-hidden />
    </div>
  );
}

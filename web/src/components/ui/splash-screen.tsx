"use client";

import { LogoMark } from "@/components/brand/logo-mark";

export function SplashScreen({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <LogoMark size={44} />
      <p className="mt-8 font-display text-[15px] font-medium tracking-tight text-foreground">Viswallet</p>
      <p className="mt-2 text-sm text-muted-foreground">{label}</p>
      <div className="mt-8 h-px w-12 bg-border" aria-hidden />
    </div>
  );
}

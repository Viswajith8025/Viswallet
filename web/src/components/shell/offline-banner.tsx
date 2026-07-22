"use client";

import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/hooks/use-online-status";

export function OfflineBanner() {
  const online = useOnlineStatus();
  if (online) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center justify-center gap-2 border-b border-warning/30 bg-warning/10 px-4 py-2 text-sm text-warning-foreground"
    >
      <WifiOff size={14} aria-hidden />
      <span>You&apos;re offline. Changes save locally and sync when you&apos;re back online.</span>
    </div>
  );
}

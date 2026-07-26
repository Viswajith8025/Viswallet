"use client";

import { useEffect } from "react";
import { useSecurityStore, setupActivityMonitor, setupSessionWatcher } from "@/lib/store/security-store";
import { peekBootCache } from "@/lib/db";
import { AppLockScreen } from "./app-lock";

export function SecurityProvider({ children }: { children: React.ReactNode }) {
  const init = useSecurityStore((s) => s.init);
  const initialized = useSecurityStore((s) => s.initialized);
  const appLockEnabled = useSecurityStore((s) => s.appLockEnabled);
  const unlocked = useSecurityStore((s) => s.unlocked);
  const bootLockEnabled = peekBootCache()?.appLockEnabled ?? false;

  useEffect(() => {
    init();
    const cleanupActivity = setupActivityMonitor();
    const cleanupSession = setupSessionWatcher();
    return () => {
      cleanupActivity();
      cleanupSession();
    };
  }, [init]);

  if (!initialized) {
    if (bootLockEnabled) return <AppLockScreen />;
    return <>{children}</>;
  }

  if (appLockEnabled && !unlocked) {
    return <AppLockScreen />;
  }

  return <>{children}</>;
}

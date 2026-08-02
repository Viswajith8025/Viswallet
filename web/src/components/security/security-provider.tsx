"use client";

import { useEffect } from "react";
import { useSecurityStore, setupActivityMonitor, setupSessionWatcher } from "@/lib/store/security-store";
import { AppLockScreen } from "./app-lock";
import { SplashScreen } from "@/components/ui/splash-screen";

export function SecurityProvider({ children }: { children: React.ReactNode }) {
  const init = useSecurityStore((s) => s.init);
  const initialized = useSecurityStore((s) => s.initialized);
  const appLockEnabled = useSecurityStore((s) => s.appLockEnabled);
  const unlocked = useSecurityStore((s) => s.unlocked);

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
    return <SplashScreen />;
  }

  if (appLockEnabled && !unlocked) {
    return <AppLockScreen />;
  }

  return <>{children}</>;
}

"use client";

import { useEffect } from "react";

export function PremiumBootstrap() {
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    const run = async () => {
      const [{ recordMonthlySnapshot }, { evaluateAchievements }, { syncDynamicNotifications }] =
        await Promise.all([
          import("@/lib/engines/premium/snapshot-recorder"),
          import("@/lib/engines/premium/achievement-engine"),
          import("@/lib/notifications/sync"),
        ]);
      await recordMonthlySnapshot();
      await evaluateAchievements();
      await syncDynamicNotifications();
    };

    const start = () => {
      void run();
      interval = setInterval(run, 15 * 60 * 1000);
    };

    const idle = window.requestIdleCallback?.(() => start(), { timeout: 4000 });
    const fallback = window.setTimeout(start, 2500);

    return () => {
      if (idle != null) window.cancelIdleCallback(idle);
      window.clearTimeout(fallback);
      if (interval) clearInterval(interval);
    };
  }, []);

  return null;
}

"use client";

import { useEffect } from "react";
import { onDbDataChanged } from "@/lib/notifications/bus";

async function runPremiumJobs(): Promise<void> {
  const [{ recordMonthlySnapshot }, { evaluateAchievements }, { syncDynamicNotifications }] =
    await Promise.all([
      import("@/lib/engines/premium/snapshot-recorder"),
      import("@/lib/engines/premium/achievement-engine"),
      import("@/lib/notifications/sync"),
    ]);
  await recordMonthlySnapshot();
  await evaluateAchievements();
  await syncDynamicNotifications();
}

export function PremiumBootstrap() {
  useEffect(() => {
    let debounce: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const schedule = () => {
      if (debounce) clearTimeout(debounce);
      debounce = setTimeout(() => {
        if (!cancelled) void runPremiumJobs();
      }, 600);
    };

    const idle = window.requestIdleCallback?.(() => {
      if (!cancelled) void runPremiumJobs();
    }, { timeout: 4000 });
    const fallback = window.setTimeout(() => {
      if (!cancelled) void runPremiumJobs();
    }, 2500);

    const offDb = onDbDataChanged(schedule);

    return () => {
      cancelled = true;
      if (idle != null) window.cancelIdleCallback(idle);
      window.clearTimeout(fallback);
      if (debounce) clearTimeout(debounce);
      offDb();
    };
  }, []);

  return null;
}

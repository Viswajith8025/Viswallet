"use client";

import { useEffect } from "react";
import { recordMonthlySnapshot } from "@/lib/engines/premium/snapshot-recorder";
import { evaluateAchievements } from "@/lib/engines/premium/achievement-engine";
import { syncDynamicNotifications } from "@/lib/notifications/sync";

export function PremiumBootstrap() {
  useEffect(() => {
    const run = async () => {
      await recordMonthlySnapshot();
      await evaluateAchievements();
      await syncDynamicNotifications();
    };
    run();
    const interval = setInterval(run, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return null;
}

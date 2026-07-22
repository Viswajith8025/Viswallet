"use client";

import { useEffect } from "react";
import { recordMonthlySnapshot } from "@/lib/engines/premium/snapshot-recorder";
import { evaluateAchievements } from "@/lib/engines/premium/achievement-engine";
import { runNotificationScheduler } from "@/lib/engines/premium/notification-scheduler";

export function PremiumBootstrap() {
  useEffect(() => {
    const run = async () => {
      await recordMonthlySnapshot();
      await evaluateAchievements();
      await runNotificationScheduler();
    };
    run();
    const interval = setInterval(run, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return null;
}

"use client";

import { useEffect, useState } from "react";
import { FinanceGate } from "@/components/layout/finance-gate";
import { HeroBalanceCard } from "@/components/dashboard/hero-balance-card";
import { NetWorthCard } from "@/components/dashboard/net-worth-card";
import { ActionCenter } from "@/components/dashboard/action-center";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { WeekChart } from "@/components/dashboard/week-chart";
import { AiCoachStrip } from "@/components/ai/ai-coach-strip";
import { getProfile } from "@/lib/db";
import { useDb } from "@/components/providers/db-provider";
import { copy } from "@/lib/ux/copy";

export default function DashboardPage() {
  const { version } = useDb();
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    getProfile()
      .then((profile) => setDisplayName(profile.displayName))
      .catch(() => setDisplayName(""));
  }, [version]);

  const greeting = copy.greeting(displayName).toLowerCase();

  return (
    <FinanceGate skeleton="dashboard">
      {(data) => (
        <div className="mx-auto flex max-w-6xl flex-col gap-6">
          <div className="grid items-stretch gap-4 lg:grid-cols-12">
            <div className="flex h-full lg:col-span-8">
              <HeroBalanceCard data={data} greeting={greeting} />
            </div>
            <div className="flex h-full flex-col gap-4 lg:col-span-4">
              <NetWorthCard netWorthPaise={data.netWorthPaise} className="min-h-0 flex-1" />
              <ActionCenter />
            </div>
          </div>
          <div className="grid items-start gap-6 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <RecentActivity data={data} />
            </div>
            <div className="lg:col-span-5">
              <WeekChart data={data} />
            </div>
          </div>
          <AiCoachStrip data={data} />
        </div>
      )}
    </FinanceGate>
  );
}

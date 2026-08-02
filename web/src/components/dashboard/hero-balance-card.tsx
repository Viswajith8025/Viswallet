"use client";

import { Card, CardContent } from "@/components/ui/card";
import { formatINR } from "@/lib/money";

export function HeroBalanceCard({
  remainingPaise,
  daysLeft,
  incomePaise,
  expensePaise,
  savingsRate,
  headline = "Available this cycle",
  showDaysLeft = true,
}: {
  remainingPaise: number;
  daysLeft: number;
  incomePaise: number;
  expensePaise: number;
  savingsRate: number;
  headline?: string;
  showDaysLeft?: boolean;
}) {
  return (
    <Card className="hero-balance-card overflow-hidden">
      <CardContent className="p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium opacity-80">{headline}</p>
            <p className="mt-2 font-display text-4xl font-semibold tabular-nums tracking-tight md:text-[2.75rem]">
              {formatINR(remainingPaise)}
            </p>
          </div>
          {showDaysLeft && (
            <p className="rounded-full border border-current/15 px-3 py-1 text-xs font-medium tabular-nums backdrop-blur-sm">
              {daysLeft} days left
            </p>
          )}
        </div>
        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 border-t border-current/10 pt-5 text-sm opacity-85">
          <span>Income {formatINR(incomePaise)}</span>
          <span>Spent {formatINR(expensePaise)}</span>
          <span>{savingsRate}% unspent</span>
        </div>
      </CardContent>
    </Card>
  );
}

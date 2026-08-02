"use client";

import { Activity, PiggyBank, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatINR } from "@/lib/money";
import { cn } from "@/lib/design/cn";

export function InsightsHero({
  healthScore,
  budgetUsedPct,
  totalSpent,
  remainingPaise,
  safeSpendDaily,
  daysLeft,
  insightCount,
}: {
  healthScore: number;
  budgetUsedPct: number;
  totalSpent: number;
  remainingPaise: number;
  safeSpendDaily: number;
  daysLeft: number;
  insightCount: number;
}) {
  const healthTone =
    healthScore >= 70 ? "text-success" : healthScore >= 40 ? "text-warning" : "text-destructive";
  const healthLabel =
    healthScore >= 70 ? "Strong" : healthScore >= 40 ? "Fair" : "Needs attention";

  return (
    <Card className="hero-balance-card overflow-hidden border-0 shadow-none">
      <CardContent className="p-5 lg:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide opacity-75">Health score</p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className={cn("font-display text-4xl font-semibold tabular-nums tracking-tight", healthTone)}>
                {healthScore}
              </span>
              <span className="text-lg opacity-60">/ 100</span>
            </div>
            <p className="mt-1 text-sm opacity-80">{healthLabel}</p>
          </div>
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-current/15 bg-background/10 backdrop-blur-sm"
            aria-hidden
          >
            <Activity size={28} className={healthTone} strokeWidth={1.75} />
          </div>
        </div>

        <div className="mt-5 space-y-2">
          <div className="flex justify-between text-xs opacity-85">
            <span>Budget used · {budgetUsedPct}%</span>
            <span className="tabular-nums">{formatINR(totalSpent)}</span>
          </div>
          <Progress
            value={Math.min(budgetUsedPct, 100)}
            max={100}
            size="md"
            className="opacity-90"
          />
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2 border-t border-current/10 pt-4 text-center text-xs">
          <div className="rounded-lg bg-background/10 px-2 py-2">
            <PiggyBank size={14} className="mx-auto mb-1 opacity-70" />
            <p className="font-semibold tabular-nums">{formatINR(remainingPaise)}</p>
            <p className="opacity-70">Left</p>
          </div>
          <div className="rounded-lg bg-background/10 px-2 py-2">
            <p className="mt-[18px] font-semibold tabular-nums">{formatINR(safeSpendDaily)}</p>
            <p className="opacity-70">Per day</p>
          </div>
          <div className="rounded-lg bg-background/10 px-2 py-2">
            <Sparkles size={14} className="mx-auto mb-1 opacity-70" />
            <p className="font-semibold tabular-nums">{insightCount}</p>
            <p className="opacity-70">Tips</p>
          </div>
        </div>
        {daysLeft > 0 && (
          <p className="mt-3 text-center text-xs opacity-75">{daysLeft} days left in this cycle</p>
        )}
      </CardContent>
    </Card>
  );
}

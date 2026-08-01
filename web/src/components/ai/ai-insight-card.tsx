"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchAiInsights, type AiInsightsResult } from "@/lib/ai/client";
import { formatCycleLabel } from "@/lib/salary-cycle";
import type { FinanceSnapshot } from "@/lib/engines/finance-snapshot";
import { cn } from "@/lib/design/cn";

type TopCategory = { name: string; amountPaise: number };

export function AiInsightCard({
  data,
  enabled,
  topCategories,
  compact,
}: {
  data: FinanceSnapshot;
  enabled: boolean;
  topCategories: TopCategory[];
  compact?: boolean;
}) {
  const [result, setResult] = useState<AiInsightsResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    void (async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetchAiInsights({
          monthLabel: formatCycleLabel(data.monthKey),
          salaryPaise: data.salaryPaise,
          expensePaise: data.expensePaise,
          remainingPaise: data.remainingPaise,
          daysLeft: data.daysLeft,
          safeSpendDaily: data.safeSpendDaily,
          borrowedBalance: data.borrowedBalance,
          billsDuePaise: data.billsDuePaise,
          emiMonthlyPaise: data.emiMonthlyPaise,
          healthScore: data.healthScore,
          topCategories,
        });
        if (!cancelled) setResult(res);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "AI coach unavailable.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    enabled,
    data.monthKey,
    data.salaryPaise,
    data.expensePaise,
    data.remainingPaise,
    data.daysLeft,
    data.safeSpendDaily,
    data.borrowedBalance,
    data.billsDuePaise,
    data.emiMonthlyPaise,
    data.healthScore,
    topCategories,
  ]);

  if (!enabled) return null;

  const body = loading ? (
    <p className="text-sm text-muted-foreground">Reading your cycle…</p>
  ) : error ? (
    <p className="text-sm text-muted-foreground">{error}</p>
  ) : result ? (
  <>
    <p className={cn("leading-relaxed text-foreground", compact ? "text-sm" : "")}>
      {result.summary}
    </p>
    {result.tips.length > 0 && (
      <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
        {result.tips.map((tip) => (
          <li key={tip} className="flex gap-2">
            <span className="text-primary shrink-0">•</span>
            <span>{tip}</span>
          </li>
        ))}
      </ul>
    )}
  </>
  ) : null;

  if (compact) {
    return (
      <div className="rounded-xl border border-primary/20 bg-primary/[0.03] p-4">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles size={16} className="text-primary" />
            AI coach
          </div>
          <Link
            href="/insights"
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-0.5"
          >
            More <ArrowRight size={12} />
          </Link>
        </div>
        {body}
      </div>
    );
  }

  return (
    <Card className="border-primary/20 bg-primary/[0.03]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Sparkles size={18} className="text-primary" />
          AI coach
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0 text-sm">
        {body}
        <p className="text-xs text-muted-foreground/80">
          Uses this cycle&apos;s totals, bills, debt, and top categories — not your full history.
        </p>
      </CardContent>
    </Card>
  );
}

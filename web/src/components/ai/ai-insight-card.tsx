"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchAiInsights, type AiInsightsResult } from "@/lib/ai/client";
import { formatCycleLabel } from "@/lib/salary-cycle";
import type { FinanceSnapshot } from "@/lib/engines/finance-snapshot";

type TopCategory = { name: string; amountPaise: number };

export function AiInsightCard({
  data,
  enabled,
  topCategories,
}: {
  data: FinanceSnapshot;
  enabled: boolean;
  topCategories: TopCategory[];
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
          topCategories,
        });
        if (!cancelled) setResult(res);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "AI insights unavailable.");
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
    topCategories,
  ]);

  if (!enabled) return null;

  return (
    <Card className="border-primary/20 bg-primary/[0.03]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Sparkles size={18} className="text-primary" />
          AI coach
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0 text-sm">
        {loading ? (
          <p className="text-muted-foreground">Analyzing your cycle…</p>
        ) : error ? (
          <p className="text-muted-foreground">{error}</p>
        ) : result ? (
          <>
            <p className="leading-relaxed text-foreground">{result.summary}</p>
            {result.tips.length > 0 && (
              <ul className="space-y-2 text-muted-foreground">
                {result.tips.map((tip) => (
                  <li key={tip} className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : null}
        <p className="text-xs text-muted-foreground/80">
          Summary uses cycle totals only — not your full transaction history.
        </p>
      </CardContent>
    </Card>
  );
}

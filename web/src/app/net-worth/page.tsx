"use client";

import { useQuery } from "@tanstack/react-query";
import { PageHeader, StatCard, PageContainer } from "@/components/ui/page";
import { FinanceGate } from "@/components/layout/finance-gate";
import { GlobalFilterBar } from "@/components/filters/global-filter-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getNetWorthTrend } from "@/lib/engines/premium/snapshot-recorder";
import { formatINR } from "@/lib/money";
import { formatCycleLabel } from "@/lib/salary-cycle";

export default function NetWorthPage() {
  const { data: trend = [] } = useQuery({
    queryKey: ["net-worth-trend"],
    queryFn: () => getNetWorthTrend(12),
  });

  const maxNw = Math.max(...trend.map((t) => t.netWorthPaise), 1);

  return (
    <FinanceGate>
      {(data) => {
        const breakdown = [
          { label: "Available this cycle", value: data.remainingPaise, tone: "default" as const },
          { label: "Savings goals", value: data.goalsSaved, tone: "positive" as const },
          { label: "Investments", value: data.investmentValue, tone: "primary" as const },
          { label: "Lent to others", value: data.lentBalance, tone: "default" as const },
          { label: "Borrowed (liability)", value: -data.borrowedBalance, tone: "negative" as const },
        ];

        return (
          <PageContainer className="max-w-5xl">
            <PageHeader
              eyebrow={formatCycleLabel(data.monthKey)}
              title="Net Worth"
              description="Track your wealth over time with monthly snapshots."
            />
            <GlobalFilterBar />

            <Card className="border-primary/20 bg-gradient-to-br from-card to-muted/30">
              <CardContent className="p-8 text-center">
                <p className="text-sm text-muted-foreground">Total net worth</p>
                <p className="mt-2 text-5xl font-semibold tabular-nums tracking-tight">{formatINR(data.netWorthPaise)}</p>
                <p className="mt-3 text-sm text-muted-foreground">Health score {data.healthScore}/100</p>
              </CardContent>
            </Card>

            {trend.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Net worth trend</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex h-40 items-end gap-2">
                    {trend.map((point) => (
                      <div key={point.monthKey} className="flex flex-1 flex-col items-center gap-1">
                        <div
                          className="w-full rounded-t-md bg-primary transition-all"
                          style={{ height: `${Math.max(8, (point.netWorthPaise / maxNw) * 100)}%` }}
                          title={formatINR(point.netWorthPaise)}
                        />
                        <span className="text-[9px] text-muted-foreground">
                          {point.monthKey.slice(5)}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              {breakdown.map((row) => (
                <StatCard
                  key={row.label}
                  label={row.label}
                  value={formatINR(Math.abs(row.value))}
                  hint={row.value < 0 ? "Liability" : undefined}
                  tone={row.tone}
                />
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">How it&apos;s calculated</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-0 text-sm text-muted-foreground">
                <p>Net worth = cycle balance + savings goals + investments + money lent − money borrowed.</p>
                <p>
                  Snapshots are recorded automatically each cycle for historical trend analysis.
                </p>
              </CardContent>
            </Card>
          </PageContainer>
        );
      }}
    </FinanceGate>
  );
}

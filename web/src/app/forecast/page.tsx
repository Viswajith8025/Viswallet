"use client";

import Link from "next/link";
import { TrendingUp, Calendar, Flame } from "lucide-react";
import { PageHeader, PageContainer, StatCard, EmptyState } from "@/components/ui/page";
import { FinanceGate } from "@/components/layout/finance-gate";
import { GlobalFilterBar } from "@/components/filters/global-filter-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildCashFlowForecast } from "@/lib/engines/premium/forecast-engine";
import { formatINR } from "@/lib/money";
import { formatCycleLabel } from "@/lib/salary-cycle";
import { Progress } from "@/components/ui/progress";

export default function ForecastPage() {
  return (
    <FinanceGate>
      {(data) => {
        const fixedOutflow =
          data.subscriptionMonthlyPaise + data.emiMonthlyPaise + data.billsDuePaise;
        const forecast = buildCashFlowForecast(
          data.transactions,
          data.monthKey,
          data.salaryDay,
          data.remainingPaise,
          fixedOutflow,
        );

        if (data.transactions.length === 0) {
          return (
            <PageContainer className="max-w-5xl">
              <PageHeader
                eyebrow={formatCycleLabel(data.monthKey)}
                title="Cash Flow Forecast"
                description="Projected balance based on your spending pace and fixed obligations."
              />
              <EmptyState
                title="Add transactions to forecast"
                description="Record a few expenses and income entries to project your cash flow over the next three months."
                illustration="transactions"
                action={
                  <Link href="/transactions?add=expense" className="inline-flex">
                    <span className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground">
                      Add expense
                    </span>
                  </Link>
                }
              />
            </PageContainer>
          );
        }

        return (
          <PageContainer className="max-w-5xl">
            <PageHeader
              eyebrow={formatCycleLabel(data.monthKey)}
              title="Cash Flow Forecast"
              description="Projected balance based on your spending pace and fixed obligations."
            />
            <GlobalFilterBar />

            <div className="grid gap-4 md:grid-cols-3">
              <StatCard
                label="Projected balance (3 mo)"
                value={formatINR(forecast.projectedEndBalancePaise)}
                icon={<TrendingUp size={16} />}
              />
              <StatCard
                label="Avg daily spend"
                value={formatINR(forecast.avgDailySpendPaise)}
                icon={<Flame size={16} />}
              />
              <StatCard
                label="Runway"
                value={forecast.runwayDays > 365 ? "12+ mo" : `${forecast.runwayDays} days`}
                hint="At current burn rate"
                icon={<Calendar size={16} />}
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">3-month projection</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                {forecast.points.map((p) => (
                  <div key={p.date} className="rounded-xl border border-border/60 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-medium">{p.label}</span>
                      <span className="text-lg font-semibold tabular-nums">
                        {formatINR(p.projectedBalancePaise)}
                      </span>
                    </div>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>In +{formatINR(p.projectedIncomePaise)}</span>
                      <span>Out −{formatINR(p.projectedExpensePaise)}</span>
                    </div>
                    <Progress
                      value={Math.min(100, Math.max(5, (p.projectedBalancePaise / Math.max(data.incomePaise, 1)) * 100))}
                      max={100}
                      size="md"
                      className="mt-2"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 text-sm text-muted-foreground">
                Monthly burn estimate includes subscriptions ({formatINR(data.subscriptionMonthlyPaise)}),
                EMIs ({formatINR(data.emiMonthlyPaise)}), and variable spending at your current daily pace.
              </CardContent>
            </Card>
          </PageContainer>
        );
      }}
    </FinanceGate>
  );
}

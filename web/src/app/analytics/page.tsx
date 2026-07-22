"use client";

import dynamic from "next/dynamic";
import { PageHeader, StatCard, PageContainer } from "@/components/ui/page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FinanceGate } from "@/components/layout/finance-gate";
import { GlobalFilterBar } from "@/components/filters/global-filter-bar";
import { SpendingHeatmapGrid } from "@/components/analytics/spending-heatmap";
import { FadeIn, Stagger, StaggerItem } from "@/components/ui/motion";
import { PageSkeleton } from "@/components/ui/skeleton";
import { sumByCategory } from "@/lib/engines/finance-snapshot";
import { buildSpendingHeatmap } from "@/lib/engines/premium/heatmap";
import { generateBudgetRecommendations } from "@/lib/engines/premium/budget-recommendations";
import { formatINR } from "@/lib/money";
import { formatCycleLabel } from "@/lib/salary-cycle";

const AnalyticsCharts = dynamic(
  () => import("@/features/analytics/analytics-charts").then((m) => m.AnalyticsCharts),
  { loading: () => <PageSkeleton />, ssr: false },
);

export default function AnalyticsPage() {
  return (
    <FinanceGate>
      {(data) => {
        const expenseBreakdown = sumByCategory(data.transactions, data.categories, "expense");
        const incomeBreakdown = sumByCategory(data.transactions, data.categories, "income");
        const savingsRate = data.incomePaise
          ? Math.round(((data.incomePaise - data.expensePaise) / data.incomePaise) * 100)
          : 0;
        const heatmap = buildSpendingHeatmap(data.transactions);
        const recommendations = generateBudgetRecommendations(data);

        return (
          <PageContainer>
            <FadeIn>
              <PageHeader
                eyebrow={formatCycleLabel(data.monthKey)}
                title="Analytics"
                description="Category analytics, spending heatmaps, and budget intelligence."
              />
            </FadeIn>
            <GlobalFilterBar />

            <Stagger className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StaggerItem>
                <StatCard label="Income" value={formatINR(data.incomePaise)} tone="positive" />
              </StaggerItem>
              <StaggerItem>
                <StatCard label="Expenses" value={formatINR(data.expensePaise)} tone="negative" />
              </StaggerItem>
              <StaggerItem>
                <StatCard label="Savings rate" value={`${savingsRate}%`} tone="primary" />
              </StaggerItem>
              <StaggerItem>
                <StatCard label="Transactions" value={data.transactions.length} />
              </StaggerItem>
            </Stagger>

            <AnalyticsCharts expenseBreakdown={expenseBreakdown} />

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Spending heatmap</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <SpendingHeatmapGrid data={heatmap} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Category recommendations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 pt-0">
                  {recommendations.slice(0, 6).map((r) => (
                    <div key={r.category} className="flex justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm">
                      <span>{r.category}</span>
                      <span className="tabular-nums font-medium">{formatINR(r.recommendedPaise)}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {incomeBreakdown.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Income sources</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 pt-0">
                  {incomeBreakdown.map((i) => (
                    <div
                      key={i.name}
                      className="flex items-center justify-between rounded-xl px-3 py-3 text-sm transition-colors hover:bg-muted/40"
                    >
                      <div className="flex items-center gap-3">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: i.color }} />
                        <span className="font-medium">{i.name}</span>
                      </div>
                      <span className="font-semibold tabular-nums text-success">{formatINR(i.amount)}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </PageContainer>
        );
      }}
    </FinanceGate>
  );
}

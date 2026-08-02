"use client";

import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { PageHeader, EmptyState, PageContainer } from "@/components/ui/page";
import { Button } from "@/components/ui/button";
import { FinanceGate } from "@/components/layout/finance-gate";
import { GlobalFilterBar } from "@/components/filters/global-filter-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { sumByCategory } from "@/lib/engines/finance-snapshot";
import { generatePremiumInsights } from "@/lib/engines/premium/insights-engine";
import { generateBudgetRecommendations } from "@/lib/engines/premium/budget-recommendations";
import { formatINR } from "@/lib/money";
import { formatCycleLabel } from "@/lib/salary-cycle";
import { cn } from "@/lib/design/cn";
import { Progress } from "@/components/ui/progress";
import { AiInsightCard } from "@/components/ai/ai-insight-card";
import { InsightsHero } from "@/components/insights/insights-hero";
import { InsightFeedItem } from "@/components/insights/insight-feed-item";
import { useAiFeatures } from "@/hooks/use-ai-features";
import type { FinanceSnapshot } from "@/lib/engines/finance-snapshot";
import { copy } from "@/lib/ux/copy";

function InsightsBody({ data }: { data: FinanceSnapshot }) {
  const { active: showAi } = useAiFeatures();
  const breakdown = sumByCategory(data.transactions, data.categories, "expense");
  const totalSpent = data.expensePaise;
  const budgetUsedPct = data.salaryPaise > 0 ? Math.round((totalSpent / data.salaryPaise) * 100) : 0;
  const allInsights = generatePremiumInsights(data);
  const feedInsights = allInsights.filter((i) => i.id !== "health");
  const recommendations = generateBudgetRecommendations(data);
  const topCategories = breakdown.slice(0, 5).map((c) => ({ name: c.name, amountPaise: c.amount }));
  const topSpending = breakdown.slice(0, 6);

  return (
    <PageContainer>
      <PageHeader
        eyebrow={formatCycleLabel(data.monthKey)}
        title={copy.pages.insights.title}
        description={copy.insights.pageDescription}
      />

      <GlobalFilterBar collapsible showCategoryFilter={false} className="border-b-0 pb-0" />

      <InsightsHero
        healthScore={data.healthScore}
        budgetUsedPct={budgetUsedPct}
        totalSpent={totalSpent}
        remainingPaise={data.remainingPaise}
        safeSpendDaily={data.safeSpendDaily}
        daysLeft={data.daysLeft}
        insightCount={allInsights.length}
      />

      {showAi && (
        <AiInsightCard data={data} enabled={showAi} topCategories={topCategories} />
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2 px-0.5">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <Sparkles size={18} className="text-primary" />
            {copy.insights.smartAnalysis}
          </h2>
          <span className="text-xs text-muted-foreground">{copy.insights.tipsCount(feedInsights.length)}</span>
        </div>
        <div className="space-y-3">
          {feedInsights.map((insight) => (
            <InsightFeedItem key={insight.id} insight={insight} />
          ))}
        </div>
      </section>

      {recommendations.length > 0 && (
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">{copy.insights.budgetTweaks}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {recommendations.map((r) => (
              <div
                key={r.category}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/50 bg-muted/20 px-4 py-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-medium">{r.category}</p>
                  <p className="text-xs text-muted-foreground">{r.reason}</p>
                </div>
                <div className="text-right">
                  <p className="tabular-nums text-xs text-muted-foreground">
                    {formatINR(r.currentPaise)} → {formatINR(r.recommendedPaise)}
                  </p>
                  <p
                    className={cn(
                      "text-sm font-semibold tabular-nums",
                      r.changePaise < 0 ? "text-success" : "text-warning",
                    )}
                  >
                    {r.changePaise >= 0 ? "+" : ""}{formatINR(r.changePaise)}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="border-border/60">
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-semibold">{copy.insights.topSpending}</CardTitle>
          <Link
            href="/analytics"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary"
          >
            {copy.insights.allCharts}
            <ArrowRight size={13} />
          </Link>
        </CardHeader>
        <CardContent className="pt-0">
          {topSpending.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {copy.empty.chart.description}
            </p>
          ) : (
          <div className="space-y-4">
            {topSpending.map((item) => {
              const pct = totalSpent > 0 ? (item.amount / totalSpent) * 100 : 0;
              return (
                <div key={item.name}>
                  <div className="mb-1.5 flex justify-between gap-2 text-sm">
                    <span className="truncate">{item.name}</span>
                    <span className="shrink-0 tabular-nums font-medium">{formatINR(item.amount)}</span>
                  </div>
                  <Progress value={pct} max={100} size="md" color={item.color} />
                </div>
              );
            })}
          </div>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}

export default function InsightsPage() {
  return (
    <FinanceGate>
      {(data) => {
        if (data.transactions.length === 0) {
          return (
            <PageContainer>
              <PageHeader
                eyebrow={formatCycleLabel(data.monthKey)}
                title={copy.pages.insights.title}
                description={copy.insights.pageDescription}
              />
              <GlobalFilterBar collapsible showCategoryFilter={false} className="border-b-0 pb-0" />
              <EmptyState
                title={copy.insights.notEnoughTitle}
                description={copy.insights.notEnoughDescription}
                illustration="transactions"
                action={
                  <Link href="/transactions?add=expense">
                    <Button size="sm">{copy.insights.addFirstExpense}</Button>
                  </Link>
                }
              />
            </PageContainer>
          );
        }

        return <InsightsBody data={data} />;
      }}
    </FinanceGate>
  );
}

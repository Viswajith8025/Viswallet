"use client";

import Link from "next/link";
import { Sparkles, ArrowRight, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { PageHeader, StatCard, PageContainer, EmptyState } from "@/components/ui/page";
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
import { useAiFeatures } from "@/hooks/use-ai-features";
import type { FinanceSnapshot } from "@/lib/engines/finance-snapshot";

const SEVERITY_STYLES = {
  info: "bg-muted/60 border-border/50",
  success: "bg-success/5 border-success/20",
  warning: "bg-warning/5 border-warning/30",
  critical: "bg-destructive/5 border-destructive/30",
};

const SEVERITY_ICONS = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  critical: AlertTriangle,
};

function InsightsBody({ data }: { data: FinanceSnapshot }) {
  const { active: showAi } = useAiFeatures();
  const breakdown = sumByCategory(data.transactions, data.categories, "expense");
  const totalSpent = data.expensePaise;
  const budgetUsedPct = data.salaryPaise > 0 ? Math.round((totalSpent / data.salaryPaise) * 100) : 0;
  const insights = generatePremiumInsights(data);
  const recommendations = generateBudgetRecommendations(data);
  const topCategories = breakdown.slice(0, 5).map((c) => ({ name: c.name, amountPaise: c.amount }));

  return (
    <PageContainer className="max-w-5xl">
      <PageHeader
        eyebrow={formatCycleLabel(data.monthKey)}
        title="Smart Financial Insights"
        description="On-device rules plus optional AI coaching when enabled in Settings."
      />
      <GlobalFilterBar />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Health score"
          value={`${data.healthScore}/100`}
          tone={data.healthScore >= 70 ? "positive" : data.healthScore >= 40 ? "primary" : "negative"}
        />
        <StatCard label="Budget used" value={`${budgetUsedPct}%`} hint={formatINR(totalSpent)} />
        <StatCard label="Insights" value={insights.length} hint="Active recommendations" />
      </div>

      <AiInsightCard data={data} enabled={showAi} topCategories={topCategories} />

      <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <Sparkles size={18} />
                  Smart analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                {insights.map((insight) => {
                  const Icon = SEVERITY_ICONS[insight.severity];
                  return (
                    <div
                      key={insight.id}
                      className={cn("rounded-xl border p-4", SEVERITY_STYLES[insight.severity])}
                    >
                      <div className="flex gap-3">
                        <Icon size={18} className="mt-0.5 shrink-0 text-primary" />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">{insight.title}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{insight.body}</p>
                          {insight.action && (
                            <Link
                              href={insight.action.href}
                              className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                            >
                              {insight.action.label} <ArrowRight size={14} />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Budget recommendations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                {recommendations.map((r) => (
                  <div key={r.category} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 p-3 text-sm">
                    <div>
                      <p className="font-medium">{r.category}</p>
                      <p className="text-xs text-muted-foreground">{r.reason}</p>
                    </div>
                    <div className="text-right">
                      <p className="tabular-nums">{formatINR(r.currentPaise)} → {formatINR(r.recommendedPaise)}</p>
                      <p className={cn("text-xs font-medium", r.changePaise < 0 ? "text-success" : "text-warning")}>
                        {r.changePaise >= 0 ? "+" : ""}{formatINR(r.changePaise)}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Spending by category</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {breakdown.map((item) => {
                    const pct = totalSpent > 0 ? (item.amount / totalSpent) * 100 : 0;
                    return (
                      <div key={item.name}>
                        <div className="mb-1 flex justify-between text-sm">
                          <span>{item.name}</span>
                          <span className="tabular-nums font-medium">{formatINR(item.amount)}</span>
                        </div>
                        <Progress value={pct} max={100} size="md" color={item.color} />
                      </div>
                    );
                  })}
                </div>
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
            <PageContainer className="max-w-5xl">
              <PageHeader
                eyebrow={formatCycleLabel(data.monthKey)}
                title="Smart Financial Insights"
                description="On-device rules plus optional AI coaching when enabled in Settings."
              />
              <EmptyState
                title="Not enough data yet"
                description="Add expenses and income to unlock personalized insights and budget recommendations."
                illustration="transactions"
                action={
                  <Link href="/transactions?add=expense" className="inline-flex">
                    <span className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground">
                      Add your first expense
                    </span>
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

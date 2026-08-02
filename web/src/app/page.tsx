"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageHeader, StatCard, EmptyState, PageContainer, MetricStrip } from "@/components/ui/page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FinanceGate } from "@/components/layout/finance-gate";
import { GlobalFilterBar } from "@/components/filters/global-filter-bar";
import { HeroBalanceCard } from "@/components/dashboard/hero-balance-card";
import { ActionCenter } from "@/components/dashboard/action-center";
import { LoanDueReminders } from "@/components/dashboard/loan-due-reminders";
import { AiCoachStrip } from "@/components/ai/ai-coach-strip";
import { TransactionRow } from "@/components/shared/transaction-row";
import { formatINR } from "@/lib/money";
import { formatCycleLabel } from "@/lib/salary-cycle";
import { categoryMap } from "@/lib/engines/finance-snapshot";
import { getProfile, getSettings } from "@/lib/db";
import { useDb } from "@/components/providers/db-provider";
import { useUIStore } from "@/lib/store/ui-store";
import { copy } from "@/lib/ux/copy";
import { DEFAULT_DASHBOARD_WIDGETS, type DashboardWidgetId } from "@/lib/db/types";

export default function DashboardPage() {
  const router = useRouter();
  const { version } = useDb();
  const setQuickAddOpen = useUIStore((s) => s.setQuickAddOpen);
  const [widgets, setWidgets] = useState<DashboardWidgetId[]>(DEFAULT_DASHBOARD_WIDGETS);
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    getSettings().then((s) => setWidgets(s.dashboardWidgets ?? DEFAULT_DASHBOARD_WIDGETS));
    getProfile()
      .then((p) => setDisplayName(p.displayName))
      .catch(() => setDisplayName(""));
  }, [version]);

  const show = (id: DashboardWidgetId) => widgets.includes(id);

  return (
    <FinanceGate skeleton="dashboard">
      {(data) => {
        const cats = categoryMap(data.categories);
        const recent = data.transactions.slice(0, 8);
        const savingsRate = data.incomePaise
          ? Math.round(((data.incomePaise - data.expensePaise) / data.incomePaise) * 100)
          : 0;

        return (
          <PageContainer>
            <PageHeader
              eyebrow={formatCycleLabel(data.monthKey)}
              title={copy.greeting(displayName)}
              actions={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuickAddOpen(true, "expense")}
                >
                  {copy.buttons.newTransaction}
                </Button>
              }
              mobileActions={
                <Button size="sm" onClick={() => setQuickAddOpen(true, "expense")}>
                  {copy.buttons.add}
                </Button>
              }
            />

            <GlobalFilterBar collapsible showCategoryFilter={false} className="border-b-0 pb-0" />

            {show("hero") && (
              <section className="space-y-4">
                <HeroBalanceCard
                  remainingPaise={data.remainingPaise}
                  daysLeft={data.daysLeft}
                  incomePaise={data.incomePaise}
                  expensePaise={data.expensePaise}
                  savingsRate={savingsRate}
                />

                <MetricStrip className={data.borrowedBalance > 0 ? "lg:grid-cols-5" : undefined}>
                  <StatCard
                    inset
                    label={copy.labels.dailyBudget}
                    value={formatINR(data.safeSpendDaily)}
                    hint={copy.dashboard.daysInCycle(data.daysLeft)}
                    tone="positive"
                  />
                  <StatCard inset label={copy.labels.health} value={data.healthScore} hint={copy.dashboard.healthHint} />
                  <StatCard inset label={copy.labels.netWorth} value={formatINR(data.netWorthPaise)} />
                  <StatCard
                    inset
                    label={copy.labels.fixedCosts}
                    value={formatINR(
                      data.subscriptionMonthlyPaise + data.billsDuePaise + data.emiMonthlyPaise,
                    )}
                    hint={copy.dashboard.fixedCostsHint}
                  />
                  {data.borrowedBalance > 0 && (
                    <StatCard
                      inset
                      label={copy.labels.youOwe}
                      value={formatINR(data.borrowedBalance)}
                      hint={copy.dashboard.youOweHint}
                      tone="negative"
                    />
                  )}
                </MetricStrip>
              </section>
            )}

            {show("stats") && !show("hero") && (
              <MetricStrip>
                <StatCard inset label={copy.labels.netWorth} value={formatINR(data.netWorthPaise)} />
                <StatCard inset label={copy.labels.subscriptions} value={formatINR(data.subscriptionMonthlyPaise)} />
                <StatCard
                  inset
                  label={copy.labels.billsDue}
                  value={formatINR(data.billsDuePaise)}
                  tone={data.billsDuePaise > 0 ? "negative" : "default"}
                />
                <StatCard inset label={copy.labels.emi} value={formatINR(data.emiMonthlyPaise)} />
              </MetricStrip>
            )}

            {show("obligations") && (
              <section className="animate-fade-in space-y-4">
                <ActionCenter />
                <AiCoachStrip data={data} />
              </section>
            )}

            {(show("recent") || show("insights")) && (
              <div className="grid gap-6 lg:grid-cols-5">
                {show("recent") && (
                  <Card className="lg:col-span-3">
                    <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle>{copy.dashboard.recent}</CardTitle>
                      <Link
                        href="/transactions"
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {copy.buttons.allTransactions}
                        <ArrowUpRight size={13} />
                      </Link>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {recent.length === 0 ? (
                        <EmptyState
                          minimal
                          compact
                          title={copy.empty.noActivity.title}
                          description={copy.empty.noActivity.description}
                          illustration="transactions"
                          action={
                            <Button size="sm" onClick={() => setQuickAddOpen(true, "expense")}>
                              {copy.buttons.addTransaction}
                            </Button>
                          }
                        />
                      ) : (
                        <ul>
                          {recent.map((t) => {
                            const cat = cats.get(t.categoryId);
                            return (
                              <TransactionRow
                                key={t.id}
                                transaction={t}
                                categoryName={cat?.name ?? copy.labels.uncategorized}
                                categoryColor={cat?.color}
                                categoryIconName={cat?.iconName}
                                compact
                                href={t.id ? `/transactions?edit=${t.id}` : "/transactions"}
                              />
                            );
                          })}
                        </ul>
                      )}
                    </CardContent>
                  </Card>
                )}

                {show("insights") && (
                  <Card className="lg:col-span-2">
                    <CardHeader className="pb-2">
                      <CardTitle>{copy.dashboard.thisCycle}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-0 text-sm leading-relaxed text-muted-foreground">
                      <p>
                        {copy.cycleNarrative(
                          formatINR(data.remainingPaise),
                          data.daysLeft,
                          formatINR(data.safeSpendDaily),
                        )}
                      </p>
                      <p>
                        {data.expensePaise > data.salaryPaise * 0.8
                          ? copy.dashboard.cycleNarrativeHigh
                          : copy.dashboard.cycleNarrativeComfortable}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => router.push("/insights")}
                      >
                        {copy.buttons.viewInsights}
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            <section className="animate-fade-in">
              <LoanDueReminders />
            </section>
          </PageContainer>
        );
      }}
    </FinanceGate>
  );
}

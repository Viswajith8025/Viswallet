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
import { DashboardAccountSwitcher } from "@/components/dashboard/dashboard-account-switcher";
import { ActionCenter } from "@/components/dashboard/action-center";
import { LoanDueReminders } from "@/components/dashboard/loan-due-reminders";
import { AiCoachStrip } from "@/components/ai/ai-coach-strip";
import { TransactionRow } from "@/components/shared/transaction-row";
import { formatINR } from "@/lib/money";
import { formatCycleLabel } from "@/lib/salary-cycle";
import { categoryMap } from "@/lib/engines/finance-snapshot";
import { getProfile, getSettings } from "@/lib/db";
import { useDb } from "@/components/providers/db-provider";
import { DEFAULT_DASHBOARD_WIDGETS, type DashboardWidgetId } from "@/lib/db/types";

function greeting(name?: string): string {
  const hour = new Date().getHours();
  const time = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  return name?.trim() ? `${time}, ${name.trim()}` : time;
}

export default function DashboardPage() {
  const router = useRouter();
  const { version } = useDb();
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
        const accountView = data.selectedAccount != null;
        const savingsRate = data.incomePaise
          ? Math.round(((data.incomePaise - data.expensePaise) / data.incomePaise) * 100)
          : 0;

        return (
          <PageContainer>
            <PageHeader
              eyebrow={formatCycleLabel(data.monthKey)}
              title={greeting(displayName)}
              actions={
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden sm:inline-flex"
                  onClick={() => router.push("/transactions?add=expense")}
                >
                  New transaction
                </Button>
              }
            />

            <DashboardAccountSwitcher />
            <GlobalFilterBar className="mt-4" />

            {show("hero") && (
              <section className="space-y-4">
                <HeroBalanceCard
                  remainingPaise={data.remainingPaise}
                  daysLeft={data.daysLeft}
                  incomePaise={data.incomePaise}
                  expensePaise={data.expensePaise}
                  savingsRate={savingsRate}
                  headline={
                    accountView
                      ? `Balance in ${data.selectedAccount!.name}`
                      : "Available this cycle"
                  }
                  showDaysLeft={!accountView}
                />

                <MetricStrip>
                  {accountView ? (
                    <>
                      <StatCard
                        label="Spent this cycle"
                        value={formatINR(data.expensePaise)}
                        hint="From this account"
                        tone={data.expensePaise > 0 ? "negative" : "default"}
                      />
                      <StatCard
                        label="Earned this cycle"
                        value={formatINR(data.incomePaise)}
                        hint="Tagged to this account"
                        tone="positive"
                      />
                      <StatCard
                        label="All accounts"
                        value={formatINR(data.accounts.reduce((s, a) => s + a.balancePaise, 0))}
                        hint="Total parked + bank"
                      />
                    </>
                  ) : (
                    <>
                      <StatCard
                        label="Daily budget"
                        value={formatINR(data.safeSpendDaily)}
                        hint={`${data.daysLeft} days in cycle`}
                        tone="positive"
                      />
                      <StatCard label="Health" value={data.healthScore} hint="Out of 100" />
                      <StatCard label="Net worth" value={formatINR(data.netWorthPaise)} />
                      <StatCard
                        label="In wallets & pots"
                        value={formatINR(data.parkedWalletsPaise)}
                        hint="Backup + savings"
                      />
                      <StatCard
                        label="Fixed costs"
                        value={formatINR(
                          data.subscriptionMonthlyPaise + data.billsDuePaise + data.emiMonthlyPaise,
                        )}
                        hint="Subs · bills · EMI"
                      />
                      {data.borrowedBalance > 0 && (
                        <StatCard
                          label="You owe"
                          value={formatINR(data.borrowedBalance)}
                          hint="Borrowed — mark paid on dashboard"
                          tone="negative"
                        />
                      )}
                    </>
                  )}
                </MetricStrip>
              </section>
            )}

            {show("stats") && !show("hero") && (
              <MetricStrip>
                <StatCard label="Net worth" value={formatINR(data.netWorthPaise)} />
                <StatCard label="Subscriptions" value={formatINR(data.subscriptionMonthlyPaise)} />
                <StatCard
                  label="Bills due"
                  value={formatINR(data.billsDuePaise)}
                  tone={data.billsDuePaise > 0 ? "negative" : "default"}
                />
                <StatCard label="EMI" value={formatINR(data.emiMonthlyPaise)} />
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
                      <CardTitle>
                        {accountView ? `Activity · ${data.selectedAccount!.name}` : "Recent"}
                      </CardTitle>
                      <Link
                        href="/transactions"
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                      >
                        All transactions
                        <ArrowUpRight size={13} />
                      </Link>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {recent.length === 0 ? (
                        <EmptyState
                          title={accountView ? "No tagged transactions" : "No activity yet"}
                          description={
                            accountView
                              ? "Expenses logged while this account is selected appear here. Use Transfer on Accounts for moves between wallets."
                              : "Record an expense or income to start tracking."
                          }
                          illustration="transactions"
                          action={
                            <Button size="sm" onClick={() => router.push("/transactions?add=expense")}>
                              Add transaction
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
                                categoryName={cat?.name ?? "Uncategorized"}
                                categoryColor={cat?.color}
                                categoryIconName={cat?.iconName}
                                compact
                                href="/transactions"
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
                      <CardTitle>This cycle</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-0 text-sm leading-relaxed text-muted-foreground">
                      <p>
                        You have{" "}
                        <span className="font-medium text-foreground">{formatINR(data.remainingPaise)}</span>{" "}
                        left with {data.daysLeft} days to go — about{" "}
                        <span className="font-medium text-foreground">{formatINR(data.safeSpendDaily)}</span> per
                        day.
                      </p>
                      <p>
                        {data.expensePaise > data.salaryPaise * 0.8
                          ? "Spending is running high. Worth a look at recurring costs."
                          : "Spending is within a comfortable range for this cycle."}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => router.push("/insights")}
                      >
                        View insights
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

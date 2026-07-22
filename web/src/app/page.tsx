"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowUpRight,
  Sparkles,
  TrendingDown,
  Wallet,
  Receipt,
  PiggyBank,
  CreditCard,
} from "lucide-react";
import { PageHeader, StatCard, EmptyState, PageContainer } from "@/components/ui/page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FinanceGate } from "@/components/layout/finance-gate";
import { GlobalFilterBar } from "@/components/filters/global-filter-bar";
import { FadeIn, Stagger, StaggerItem } from "@/components/ui/motion";
import { formatINR } from "@/lib/money";
import { formatCycleLabel } from "@/lib/salary-cycle";
import { categoryMap } from "@/lib/engines/finance-snapshot";
import { getSettings } from "@/lib/db";
import { DEFAULT_DASHBOARD_WIDGETS, type DashboardWidgetId } from "@/lib/db/types";
import { format } from "date-fns";

export default function DashboardPage() {
  const router = useRouter();
  const [widgets, setWidgets] = useState<DashboardWidgetId[]>(DEFAULT_DASHBOARD_WIDGETS);

  useEffect(() => {
    getSettings().then((s) => {
      if (!s.onboardingComplete) router.replace("/onboarding");
      setWidgets(s.dashboardWidgets ?? DEFAULT_DASHBOARD_WIDGETS);
    });
  }, [router]);

  const show = (id: DashboardWidgetId) => widgets.includes(id);

  return (
    <FinanceGate skeleton="dashboard">
      {(data) => {
        const cats = categoryMap(data.categories);
        const recent = data.transactions.slice(0, 6);
        const savingsRate = data.incomePaise
          ? Math.round(((data.incomePaise - data.expensePaise) / data.incomePaise) * 100)
          : 0;

        return (
          <PageContainer>
            <FadeIn>
              <PageHeader
                eyebrow={formatCycleLabel(data.monthKey)}
                title="Good to see you"
                description="A calm overview of your money this salary cycle."
                actions={
                  <Button onClick={() => router.push("/transactions?add=expense")}>
                    Add transaction
                  </Button>
                }
              />
            </FadeIn>
            <GlobalFilterBar />

            {show("hero") && (
            <Stagger className="grid gap-4 lg:grid-cols-4">
              <StaggerItem className="lg:col-span-2">
                <Card className="relative overflow-hidden border-0 bg-[var(--gradient-hero)] text-primary-foreground shadow-glow">
                  <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
                  <div className="pointer-events-none absolute -bottom-12 -left-8 h-32 w-32 rounded-full bg-black/10 blur-2xl" />
                  <CardContent className="relative p-6 md:p-7">
                    <div className="flex items-start justify-between">
                      <p className="text-sm font-medium text-primary-foreground/75">Available this cycle</p>
                      <Badge className="border-0 bg-white/15 text-primary-foreground">
                        {data.daysLeft}d left
                      </Badge>
                    </div>
                    <p className="mt-3 text-4xl font-semibold tabular-nums tracking-tight md:text-[2.75rem]">
                      {formatINR(data.remainingPaise)}
                    </p>
                    <div className="mt-5 flex flex-wrap gap-4 text-sm text-primary-foreground/80">
                      <span>Income {formatINR(data.incomePaise)}</span>
                      <span className="text-primary-foreground/40">·</span>
                      <span>Spent {formatINR(data.expensePaise)}</span>
                      <span className="text-primary-foreground/40">·</span>
                      <span>{savingsRate}% saved</span>
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>
              <StaggerItem>
                <StatCard
                  label="Safe spend / day"
                  value={formatINR(data.safeSpendDaily)}
                  hint={`${data.daysLeft} days remaining`}
                  tone="positive"
                  icon={<Wallet size={16} />}
                />
              </StaggerItem>
              <StaggerItem>
                <StatCard
                  label="Health score"
                  value={`${data.healthScore}`}
                  hint="Financial wellness"
                  tone="primary"
                  icon={<Sparkles size={16} />}
                />
              </StaggerItem>
            </Stagger>
            )}

            {show("stats") && (
            <Stagger className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StaggerItem>
                <StatCard label="Net worth" value={formatINR(data.netWorthPaise)} icon={<TrendingDown size={16} />} />
              </StaggerItem>
              <StaggerItem>
                <StatCard
                  label="Subscriptions"
                  value={formatINR(data.subscriptionMonthlyPaise)}
                  hint="Monthly run rate"
                  icon={<Receipt size={16} />}
                />
              </StaggerItem>
              <StaggerItem>
                <StatCard
                  label="Bills due"
                  value={formatINR(data.billsDuePaise)}
                  tone={data.billsDuePaise > 0 ? "negative" : "default"}
                  icon={<PiggyBank size={16} />}
                />
              </StaggerItem>
              <StaggerItem>
                <StatCard
                  label="EMI outflow"
                  value={formatINR(data.emiMonthlyPaise)}
                  icon={<CreditCard size={16} />}
                />
              </StaggerItem>
            </Stagger>
            )}

            {(show("recent") || show("insights")) && (
            <div className="grid gap-6 xl:grid-cols-3">
              {show("recent") && (
              <Card className="xl:col-span-2">
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <CardTitle>Recent activity</CardTitle>
                  <Link
                    href="/transactions"
                    className="text-sm font-medium text-primary transition-opacity hover:opacity-70"
                  >
                    View all
                  </Link>
                </CardHeader>
                <CardContent className="pt-0">
                  {recent.length === 0 ? (
                    <EmptyState
                      title="No transactions yet"
                      description="Add your first expense or income to see activity here."
                      action={
                        <Button onClick={() => router.push("/transactions?add=expense")}>
                          Add transaction
                        </Button>
                      }
                    />
                  ) : (
                    <ul className="divide-y divide-border/60">
                      {recent.map((t) => {
                        const cat = cats.get(t.categoryId);
                        return (
                          <li
                            key={t.id}
                            className="group flex items-center justify-between gap-4 py-3.5 transition-colors hover:bg-muted/30 -mx-2 px-2 rounded-xl"
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <div
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white shadow-xs"
                                style={{ background: cat?.color ?? "var(--primary)" }}
                              >
                                {cat?.name?.charAt(0) ?? "?"}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate font-medium">{t.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {cat?.name} · {format(new Date(t.occurredAt), "dd MMM")}
                                </p>
                              </div>
                            </div>
                            <span
                              className={`shrink-0 tabular-nums text-sm font-semibold ${
                                t.kind === "income" ? "text-success" : "text-foreground"
                              }`}
                            >
                              {t.kind === "income" ? "+" : "−"}
                              {formatINR(t.amountPaise)}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </CardContent>
              </Card>
              )}

              {show("insights") && (
              <Card>
                <CardHeader>
                  <CardTitle>Smart insights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <InsightRow icon={Sparkles} text={`You are at ${data.healthScore}/100 financial health.`} />
                  <InsightRow
                    icon={TrendingDown}
                    text={
                      data.expensePaise > data.salaryPaise * 0.8
                        ? "Spending is high this cycle. Review subscriptions and dining."
                        : "Spending pace looks healthy for this cycle."
                    }
                  />
                  <InsightRow
                    icon={Wallet}
                    text={`${formatINR(data.safeSpendDaily)} is your recommended daily limit.`}
                  />
                  <Button variant="outline" className="mt-2 w-full" onClick={() => router.push("/insights")}>
                    Open insights <ArrowUpRight size={14} />
                  </Button>
                </CardContent>
              </Card>
              )}
            </div>
            )}
          </PageContainer>
        );
      }}
    </FinanceGate>
  );
}

function InsightRow({ icon: Icon, text }: { icon: typeof Sparkles; text: string }) {
  return (
    <div className="flex gap-3 rounded-xl border border-border/50 bg-muted/40 p-3.5 text-sm leading-relaxed transition-colors hover:bg-muted/60">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon size={15} />
      </div>
      <p className="pt-0.5">{text}</p>
    </div>
  );
}

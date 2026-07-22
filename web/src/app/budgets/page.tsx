"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader, StatCard, EmptyState, PageContainer } from "@/components/ui/page";
import { FinanceGate } from "@/components/layout/finance-gate";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Hint } from "@/components/ui/hint";
import { useInvalidateFinance } from "@/hooks/use-invalidate-finance";
import { createBudgetPlanForCycle, db } from "@/lib/db";
import type { BudgetBucket } from "@/lib/db/types";
import type { FinanceSnapshot } from "@/lib/engines/finance-snapshot";
import { formatINR } from "@/lib/money";
import { formatCycleLabel } from "@/lib/salary-cycle";
import { categoryMap } from "@/lib/engines/finance-snapshot";

function BudgetsContent({ data }: { data: FinanceSnapshot }) {
  const invalidate = useInvalidateFinance();
  const [buckets, setBuckets] = useState<BudgetBucket[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let plan = await db.budgetPlans.where("monthKey").equals(data.monthKey).first();
      if (!plan && data.salaryPaise > 0) {
        const id = await createBudgetPlanForCycle(data.monthKey, data.salaryPaise);
        plan = await db.budgetPlans.get(id);
        await invalidate();
      }
      if (!cancelled && plan?.id) {
        const b = await db.budgetBuckets.where("planId").equals(plan.id).sortBy("sortOrder");
        setBuckets(b);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [data.monthKey, data.salaryPaise, invalidate]);

  if (data.salaryPaise <= 0) {
    return (
      <PageContainer className="max-w-5xl">
        <PageHeader title="Budgets" description="Allocate your salary across spending buckets." />
        <EmptyState
          title="Set your salary first"
          description="A budget plan is created automatically once your monthly salary is configured."
          action={
            <Link href="/salary">
              <Button>Go to salary</Button>
            </Link>
          }
        />
      </PageContainer>
    );
  }

  const cats = categoryMap(data.categories);
  const spentByBucket = new Map<string, number>();
  for (const t of data.transactions.filter((x) => x.kind === "expense")) {
    const cat = cats.get(t.categoryId);
    if (cat) spentByBucket.set(cat.slug, (spentByBucket.get(cat.slug) ?? 0) + t.amountPaise);
  }

  const totalAllocated = buckets.reduce((s, b) => s + b.allocatedPaise, 0);
  const totalSpent = buckets.reduce((s, b) => s + (spentByBucket.get(b.bucketKey) ?? 0), 0);

  return (
    <PageContainer className="max-w-5xl">
      <PageHeader
        eyebrow={formatCycleLabel(data.monthKey)}
        title="Budgets"
        description="Track how each bucket is performing against your plan."
        actions={
          <Link href="/salary">
            <Button variant="outline">Update salary</Button>
          </Link>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Salary" value={formatINR(data.salaryPaise)} />
        <StatCard label="Allocated" value={formatINR(totalAllocated)} hint={`${buckets.length} buckets`} />
        <StatCard
          label="Spent in buckets"
          value={formatINR(totalSpent)}
          tone={totalSpent > totalAllocated ? "negative" : "default"}
        />
      </div>

      <Hint>
        Your budget plan is created automatically from your salary. Spending is matched to categories — update salary to rebalance buckets.
      </Hint>

      {buckets.length === 0 ? (
        <EmptyState title="No budget plan" description="Your budget plan will appear here shortly." />
      ) : (
        <div className="space-y-4">
          {buckets.map((b) => {
            const spent = spentByBucket.get(b.bucketKey) ?? 0;
            const allocated = b.allocatedPaise;
            const over = spent > allocated;
            return (
              <Card key={b.id}>
                <CardContent className="p-5">
                  <div className="mb-3 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium">{b.displayName}</p>
                      <p className="text-xs capitalize text-muted-foreground">{b.bucketType}</p>
                    </div>
                    <p className="text-sm tabular-nums">
                      <span className={over ? "text-destructive" : "text-foreground"}>{formatINR(spent)}</span>
                      <span className="text-muted-foreground"> / {formatINR(allocated)}</span>
                    </p>
                  </div>
                  <Progress value={spent} max={allocated} overColor="var(--destructive)" />
                  <p className="mt-2 text-xs text-muted-foreground">
                    {over ? `${formatINR(spent - allocated)} over budget` : `${formatINR(allocated - spent)} remaining`}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}

export default function BudgetsPage() {
  return <FinanceGate>{(data) => <BudgetsContent data={data} />}</FinanceGate>;
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, StatCard, PageContainer, LoadingState } from "@/components/ui/page";
import { FinanceGate } from "@/components/layout/finance-gate";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Hint } from "@/components/ui/hint";
import { MoneyKeypad, applyKeypadKey } from "@/components/ui/money-keypad";
import { useInvalidateFinance } from "@/hooks/use-invalidate-finance";
import { createBudgetPlanForCycle, db } from "@/lib/db";
import type { FinanceSnapshot } from "@/lib/engines/finance-snapshot";
import { formatINR, parseRupeeInput } from "@/lib/money";
import { formatCycleLabel } from "@/lib/salary-cycle";
import { categoryMap } from "@/lib/engines/finance-snapshot";
import { expectedSalaryPaise } from "@/lib/salary/salary-prompt";

function BudgetsContent({ data }: { data: FinanceSnapshot }) {
  const invalidate = useInvalidateFinance();
  const salaryPaise = data.salaryPaise > 0 ? data.salaryPaise : expectedSalaryPaise(data);
  const [manual, setManual] = useState("");
  const [planTick, setPlanTick] = useState(0);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState("");

  const { data: buckets = [], isPending: bucketsLoading } = useQuery({
    queryKey: ["budget-buckets", data.monthKey, salaryPaise, planTick],
    queryFn: async () => {
      let plan = await db.budgetPlans.where("monthKey").equals(data.monthKey).first();
      if (!plan && salaryPaise > 0) {
        const id = await createBudgetPlanForCycle(data.monthKey, salaryPaise);
        plan = await db.budgetPlans.get(id);
        void invalidate();
      }
      if (!plan?.id) return [];
      return db.budgetBuckets.where("planId").equals(plan.id).sortBy("sortOrder");
    },
  });

  async function saveManual(event: React.FormEvent) {
    event.preventDefault();
    const paise = parseRupeeInput(manual);
    if (paise <= 0) return;
    await createBudgetPlanForCycle(data.monthKey, paise);
    setPlanTick((tick) => tick + 1);
    await invalidate();
  }

  async function saveBucket(id: number) {
    const paise = parseRupeeInput(draft);
    if (paise <= 0) return;
    await db.budgetBuckets.update(id, { allocatedPaise: paise });
    setEditingId(null);
    setPlanTick((tick) => tick + 1);
    await invalidate();
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
        <StatCard label="Salary" value={formatINR(salaryPaise)} />
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

      {bucketsLoading ? (
        <LoadingState label="Generating budget plan…" />
      ) : buckets.length === 0 ? (
        <form onSubmit={saveManual} className="max-w-md space-y-3">
          <h2 className="font-body text-lg text-ink">Set a monthly budget manually</h2>
          <input
            value={manual}
            onChange={(event) => setManual(event.target.value)}
            inputMode="decimal"
            aria-label="Monthly budget"
            placeholder="0"
            className="h-12 w-full rounded-[14px] border border-hairline bg-transparent px-4 font-mono text-lg text-ink outline-none focus:border-lime"
          />
          <button type="submit" className="h-12 rounded-full bg-lime px-5 font-medium text-[#0D0D0B] disabled:opacity-40" disabled={parseRupeeInput(manual) <= 0}>
            Create budget
          </button>
        </form>
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
                  <button
                    type="button"
                    className="relative h-14 w-full overflow-hidden rounded-full bg-sunken text-left"
                    onClick={() => {
                      setEditingId(b.id ?? null);
                      setDraft(String(allocated / 100));
                    }}
                    aria-label={`Adjust ${b.displayName}`}
                  >
                    <span
                      className={over ? "absolute inset-y-0 left-0 bg-chili/80" : "absolute inset-y-0 left-0 bg-lime"}
                      style={{ width: `${Math.min(100, allocated > 0 ? (spent / allocated) * 100 : 0)}%` }}
                    />
                    <span className="relative flex h-full items-center px-4 font-mono text-xs text-ink">
                      {b.displayName} · {formatINR(spent)} / {formatINR(allocated)}
                    </span>
                  </button>
                  {editingId === b.id && (
                    <div className="mt-3 space-y-3">
                      <p className="font-mono text-2xl text-ink">₹{draft || "0"}</p>
                      <MoneyKeypad onKey={(key) => setDraft((current) => applyKeypadKey(current, key))} />
                      <button type="button" className="h-11 rounded-full bg-lime px-4 font-medium text-[#0D0D0B]" onClick={() => b.id && void saveBucket(b.id)}>
                        Save bucket
                      </button>
                    </div>
                  )}
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

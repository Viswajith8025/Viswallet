"use client";

import { Plus } from "lucide-react";
import { PageHeader, StatCard, EmptyState, PageContainer } from "@/components/ui/page";
import { FinanceGate } from "@/components/layout/finance-gate";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { categoryMap } from "@/lib/engines/finance-snapshot";
import { formatINR } from "@/lib/money";
import { formatCycleLabel } from "@/lib/salary-cycle";
import { useUIStore } from "@/lib/store/ui-store";
import { DataList } from "@/components/ui/list";
import { TransactionRow } from "@/components/shared/transaction-row";

export default function IncomePage() {
  const setQuickAddOpen = useUIStore((s) => s.setQuickAddOpen);

  return (
    <FinanceGate>
      {(data) => {
  const cats = categoryMap(data.categories);
  const incomeTx = data.transactions.filter((t) => t.kind === "income");
  const txTotal = incomeTx.reduce((s, t) => s + t.amountPaise, 0);
  const salaryOnly = data.salaryPaise;
  const otherIncome = txTotal;

  return (
    <PageContainer className="max-w-5xl">
      <PageHeader
        eyebrow={formatCycleLabel(data.monthKey)}
        title="Income"
        description="Salary and additional income for this cycle."
        actions={
          <Button onClick={() => setQuickAddOpen(true, "income")}>
            <Plus size={16} /> Add income
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Total income" value={formatINR(data.incomePaise)} tone="positive" />
        <StatCard label="Salary" value={formatINR(salaryOnly)} />
        <StatCard label="Other income" value={formatINR(otherIncome)} hint={`${incomeTx.length} entries`} />
      </div>

      {incomeTx.length === 0 ? (
        <EmptyState
          title="No extra income logged"
          description="Your salary is included in the total. Add freelance, refunds, or other income here."
          illustration="wallet"
          action={<Button onClick={() => setQuickAddOpen(true, "income")}>Add income</Button>}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <DataList>
              {incomeTx.map((t) => (
                <TransactionRow
                  key={t.id}
                  transaction={t}
                  categoryName={cats.get(t.categoryId)?.name}
                  categoryColor={cats.get(t.categoryId)?.color}
                  href={`/transactions?edit=${t.id}`}
                />
              ))}
            </DataList>
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
      }}
    </FinanceGate>
  );
}

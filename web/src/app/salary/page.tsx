"use client";

import { useEffect, useState } from "react";
import { PageHeader, StatCard, PageContainer } from "@/components/ui/page";
import { FinanceGate } from "@/components/layout/finance-gate";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { db, getSettings, updateSettings, createBudgetPlanForCycle } from "@/lib/db";
import type { MonthlySalary } from "@/lib/db/types";
import type { FinanceSnapshot } from "@/lib/engines/finance-snapshot";
import { formatINR, parseRupeeInput } from "@/lib/money";
import { formatCycleLabel } from "@/lib/salary-cycle";
import { useInvalidateFinance } from "@/hooks/use-invalidate-finance";

function SalaryContent({ data }: { data: FinanceSnapshot }) {
  const invalidate = useInvalidateFinance();
  const [salary, setSalary] = useState<MonthlySalary | null>(null);
  const [amount, setAmount] = useState("");
  const [salaryDay, setSalaryDay] = useState("1");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [s, settings] = await Promise.all([
        db.monthlySalaries.where("monthKey").equals(data.monthKey).first(),
        getSettings(),
      ]);
      if (cancelled) return;
      setSalary(s ?? null);
      setAmount(s ? String(s.amountPaise / 100) : "");
      setSalaryDay(String(settings.salaryDay));
    })();
    return () => {
      cancelled = true;
    };
  }, [data.monthKey]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const paise = parseRupeeInput(amount);
    if (paise <= 0) {
      setFormError("Enter a monthly salary greater than zero.");
      return;
    }
    setSaving(true);
    const day = Math.min(28, Math.max(1, parseInt(salaryDay, 10) || 1));
    const now = new Date();
    await updateSettings({ salaryDay: day });
    if (salary?.id) {
      await db.monthlySalaries.update(salary.id, { amountPaise: paise, updatedAt: now });
    } else {
      await db.monthlySalaries.add({
        monthKey: data.monthKey,
        amountPaise: paise,
        receivedAt: now,
        createdAt: now,
        updatedAt: now,
      });
    }
    await createBudgetPlanForCycle(data.monthKey, paise);
    await invalidate();
    setSaving(false);
  }

  return (
    <PageContainer className="max-w-5xl">
      <PageHeader
        eyebrow={formatCycleLabel(data.monthKey)}
        title="Salary"
        description="Set your monthly salary and the day it arrives each cycle."
      />

      <div className="grid gap-4 md:grid-cols-2">
        <StatCard label="Current salary" value={formatINR(data.salaryPaise)} tone="positive" />
        <StatCard label="Salary day" value={salaryDay} hint="Day of month (1–28)" />
      </div>

      <Card>
        <CardContent className="p-5">
          <form onSubmit={handleSave} className="mx-auto max-w-md space-y-4">
            <Input
              label="Monthly salary (INR)"
              type="number"
              required
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 50000"
            />
            <Input
              label="Salary day (1–28)"
              type="number"
              min="1"
              max="28"
              value={salaryDay}
              onChange={(e) => setSalaryDay(e.target.value)}
              hint="Your salary cycle starts on this day each month."
            />
            {formError && <p className="text-sm text-destructive" role="alert">{formError}</p>}
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? "Saving..." : "Save salary"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </PageContainer>
  );
}

export default function SalaryPage() {
  return <FinanceGate>{(data) => <SalaryContent data={data} />}</FinanceGate>;
}

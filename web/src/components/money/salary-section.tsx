"use client";

import { useEffect, useState } from "react";
import { db, getSettings, updateSettings, createBudgetPlanForCycle } from "@/lib/db";
import type { MonthlySalary } from "@/lib/db/types";
import type { FinanceSnapshot } from "@/lib/engines/finance-snapshot";
import { formatINR, parseRupeeInput } from "@/lib/money";
import { useInvalidateFinance } from "@/hooks/use-invalidate-finance";
import { cn } from "@/lib/design/cn";

export function SalarySection({ data }: { data: FinanceSnapshot }) {
  const invalidate = useInvalidateFinance();
  const [salary, setSalary] = useState<MonthlySalary | null>(null);
  const [history, setHistory] = useState<MonthlySalary[]>([]);
  const [amount, setAmount] = useState("");
  const [salaryDay, setSalaryDay] = useState(1);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [current, settings, rows] = await Promise.all([
        db.monthlySalaries.where("monthKey").equals(data.monthKey).first(),
        getSettings(),
        db.monthlySalaries.toArray(),
      ]);
      if (cancelled) return;
      const expected = settings.expectedSalaryPaise ?? 0;
      setSalary(current ?? null);
      setAmount(expected > 0 ? String(expected / 100) : current && current.amountPaise > 0 ? String(current.amountPaise / 100) : "");
      setSalaryDay(settings.salaryDay);
      setHistory(rows.sort((a, b) => b.monthKey.localeCompare(a.monthKey)).slice(0, 6));
    })();
    return () => {
      cancelled = true;
    };
  }, [data.monthKey]);

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);
    const paise = parseRupeeInput(amount);
    if (paise <= 0) {
      setFormError("Enter a monthly salary greater than zero.");
      return;
    }
    setSaving(true);
    try {
      const day = Math.min(28, Math.max(1, salaryDay));
      const now = new Date();
      await updateSettings({ salaryDay: day, expectedSalaryPaise: paise });
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
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Couldn't save salary. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section id="salary" className="scroll-mt-20 space-y-4">
      <h2 className="font-body text-lg text-ink">Salary</h2>
      <p className="font-body text-sm text-ink-2">
        Expected {formatINR(parseRupeeInput(amount) || data.expectedSalaryPaise)}. Days 29–31 use the 28th so February still has a payday.
      </p>
      <form onSubmit={handleSave} className="space-y-4">
        <label className="block">
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-2">Expected salary</span>
          <input
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            inputMode="decimal"
            aria-label="Expected salary"
            className="mt-2 h-12 w-full rounded-[14px] border border-hairline bg-transparent px-4 font-mono text-lg text-ink outline-none focus:border-lime"
          />
        </label>
        <div className="grid grid-cols-7 gap-1" role="group" aria-label="Cycle start day">
          {Array.from({ length: 31 }, (_, index) => index + 1).map((day) => {
            const stored = Math.min(28, day);
            return (
              <button
                key={day}
                type="button"
                aria-pressed={day <= 28 ? salaryDay === day : false}
                className={cn(
                  "h-11 rounded-[10px] font-mono text-sm",
                  salaryDay === day ? "bg-lime text-[#0D0D0B]" : "border border-hairline text-ink",
                  day > 28 && "text-ink-2",
                )}
                onClick={() => setSalaryDay(stored)}
              >
                {day}
              </button>
            );
          })}
        </div>
        {formError ? <p className="text-sm text-chili" role="alert">{formError}</p> : null}
        <button type="submit" disabled={saving} className="h-12 w-full rounded-full bg-lime font-medium text-[#0D0D0B] disabled:opacity-40">
          {saving ? "Saving" : "Save salary"}
        </button>
      </form>
      {history.length > 0 && (
        <ul className="divide-y divide-hairline rounded-[14px] border border-hairline">
          {history.map((row) => (
            <li key={row.id ?? row.monthKey} className="flex min-h-14 items-center justify-between px-4">
              <span className="font-mono text-xs uppercase tracking-[0.08em] text-ink-2">{row.monthKey}</span>
              <span className="font-mono text-sm text-ink">{formatINR(row.amountPaise)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

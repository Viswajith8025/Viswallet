"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { useAiFeatures } from "@/hooks/use-ai-features";
import { fetchAiInsights } from "@/lib/ai/client";
import { db } from "@/lib/db";
import { sumByCategory, type FinanceSnapshot } from "@/lib/engines/finance-snapshot";
import { formatCycleLabel } from "@/lib/salary-cycle";

const DAY_MS = 24 * 60 * 60 * 1000;

export function AiCoachStrip({ data }: { data: FinanceSnapshot }) {
  const { available, enabled, loaded, active } = useAiFeatures();
  const [sentence, setSentence] = useState<string | null>(null);

  useEffect(() => {
    if (!loaded || !available || !enabled || !active) return;
    let cancelled = false;

    void (async () => {
      const settings = await db.settings.get(1);
      const cachedAt = settings?.aiCoachAt ? new Date(settings.aiCoachAt).getTime() : 0;
      if (settings?.aiCoachSentence && Date.now() - cachedAt < DAY_MS) {
        if (!cancelled) setSentence(settings.aiCoachSentence);
        return;
      }

      try {
        const breakdown = sumByCategory(data.transactions, data.categories, "expense");
        const result = await fetchAiInsights({
          monthLabel: formatCycleLabel(data.monthKey),
          salaryPaise: data.salaryPaise,
          expensePaise: data.expensePaise,
          remainingPaise: data.remainingPaise,
          daysLeft: data.daysLeft,
          safeSpendDaily: data.safeSpendDaily,
          borrowedBalance: data.borrowedBalance,
          billsDuePaise: data.billsDuePaise,
          emiMonthlyPaise: data.emiMonthlyPaise,
          topCategories: breakdown.slice(0, 5).map((row) => ({ name: row.name, amountPaise: row.amount })),
        });
        const line = result.summary.trim();
        if (!line || cancelled) return;
        await db.settings.update(1, { aiCoachSentence: line, aiCoachAt: new Date() });
        if (!cancelled) setSentence(line);
      } catch {
        if (!cancelled) setSentence(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loaded, available, enabled, active, data]);

  if (!loaded || !available || !enabled || !sentence) return null;

  return (
    <Link
      href="/insights"
      className="flex items-start gap-3 rounded-[14px] border border-hairline bg-surface p-4"
    >
      <Sparkles size={16} className="mt-0.5 shrink-0 text-lime" aria-hidden />
      <p className="font-body text-sm leading-relaxed text-ink">{sentence}</p>
    </Link>
  );
}

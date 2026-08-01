"use client";

import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { useAiFeatures } from "@/hooks/use-ai-features";
import { AiInsightCard } from "@/components/ai/ai-insight-card";
import type { FinanceSnapshot } from "@/lib/engines/finance-snapshot";
import { sumByCategory } from "@/lib/engines/finance-snapshot";

export function AiCoachStrip({ data }: { data: FinanceSnapshot }) {
  const { active, available, enabled } = useAiFeatures();

  if (!available) {
    return (
      <div className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        AI coach needs <code className="text-xs">GROQ_API_KEY</code> on Vercel (server-only). Cloud sync uses Supabase separately.
      </div>
    );
  }

  if (!enabled) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/[0.04] px-4 py-3">
        <div className="flex items-center gap-2 text-sm">
          <Sparkles size={16} className="text-primary" />
          <span>Turn on AI in Settings for natural-language add and coaching.</span>
        </div>
        <Link
          href="/settings"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          Enable AI <ArrowRight size={14} />
        </Link>
      </div>
    );
  }

  const breakdown = sumByCategory(data.transactions, data.categories, "expense");
  const topCategories = breakdown.slice(0, 5).map((c) => ({ name: c.name, amountPaise: c.amount }));

  return <AiInsightCard data={data} enabled={active} topCategories={topCategories} compact />;
}

"use client";

import Link from "next/link";
import { ArrowRight, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import type { InsightCard } from "@/lib/engines/premium/insights-engine";
import { cn } from "@/lib/design/cn";

const SEVERITY = {
  info: {
    icon: Info,
    border: "border-border/60",
    iconBg: "bg-muted text-muted-foreground",
  },
  success: {
    icon: CheckCircle2,
    border: "border-success/25",
    iconBg: "bg-success/15 text-success",
  },
  warning: {
    icon: AlertTriangle,
    border: "border-warning/30",
    iconBg: "bg-warning/15 text-warning",
  },
  critical: {
    icon: AlertTriangle,
    border: "border-destructive/30",
    iconBg: "bg-destructive/15 text-destructive",
  },
} as const;

export function InsightFeedItem({ insight }: { insight: InsightCard }) {
  const style = SEVERITY[insight.severity];
  const Icon = style.icon;

  return (
    <article
      className={cn(
        "rounded-2xl border bg-card/80 p-4 transition-colors",
        style.border,
      )}
    >
      <div className="flex gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            style.iconBg,
          )}
        >
          <Icon size={18} strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-medium leading-snug">{insight.title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{insight.body}</p>
          {insight.action && (
            <Link
              href={insight.action.href}
              className="mt-3 inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-2 text-sm font-medium text-primary transition-colors active:scale-[0.98] hover:bg-primary/15"
            >
              {insight.action.label}
              <ArrowRight size={14} />
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

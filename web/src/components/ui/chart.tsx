"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/page";
import { cn } from "@/lib/design/cn";
import { formatINR } from "@/lib/money";
import { copy } from "@/lib/ux/copy";
import { BarChart3 } from "lucide-react";

export function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; name?: string; color?: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border-light bg-elevated/98 px-3.5 py-2.5 shadow-[var(--shadow-md)] backdrop-blur-md">
      {label && <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="text-sm font-semibold tabular-nums tracking-[-0.02em]" style={{ color: p.color }}>
          {formatINR(p.value)}
        </p>
      ))}
    </div>
  );
}

export function ChartCard({
  title,
  description,
  children,
  empty = false,
  emptyTitle = copy.empty.chart.title,
  emptyDescription = copy.empty.chart.description,
  className,
  height = "h-72",
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  empty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
  height?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>}
      </CardHeader>
      <CardContent className={cn(height, "flex pt-0")}>
        {empty ? (
          <div className="flex h-full w-full items-center justify-center">
            <EmptyState
              minimal
              compact
              title={emptyTitle}
              description={emptyDescription}
              icon={BarChart3}
            />
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

export const CHART_COLORS = {
  grid: "var(--border)",
  axis: "var(--muted-foreground)",
  primary: "var(--chart-1)",
  cursor: "var(--primary-muted)",
};

export const CHART_VIOLET_SCALE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
] as const;

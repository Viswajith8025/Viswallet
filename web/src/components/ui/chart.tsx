"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/page";
import { cn } from "@/lib/design/cn";
import { formatINR } from "@/lib/money";
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
    <div className="rounded-xl border border-border bg-card/95 px-3 py-2 shadow-lg backdrop-blur-sm">
      {label && <p className="mb-1 text-[11px] font-medium text-muted-foreground">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="text-sm font-semibold tabular-nums" style={{ color: p.color }}>
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
  emptyTitle = "No data yet",
  emptyDescription,
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
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </CardHeader>
      <CardContent className={cn(height, "pt-0")}>
        {empty ? (
          <EmptyState
            title={emptyTitle}
            description={emptyDescription}
            icon={BarChart3}
          />
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

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
    <div className="rounded-[14px] border border-hairline bg-raised px-3.5 py-2.5">
      {label && <p className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.06em] text-ink-2">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="font-mono text-sm text-ink">
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
  grid: "transparent",
  axis: "var(--ink-2)",
  primary: "var(--lime)",
  cursor: "transparent",
};

export const CHART_VIOLET_SCALE = [
  "var(--lime)",
  "var(--cobalt)",
  "var(--marigold)",
  "var(--chili)",
  "var(--ink-2)",
  "var(--hairline-strong)",
] as const;

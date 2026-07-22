"use client";

import { formatINR } from "@/lib/money";
import type { SpendingHeatmap } from "@/lib/engines/premium/heatmap";
import { cn } from "@/lib/design/cn";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

export function SpendingHeatmapGrid({ data }: { data: SpendingHeatmap }) {
  const firstWeekday = data.cells[0]?.weekday ?? 0;
  const padding = Array.from({ length: firstWeekday }, (_, i) => (
    <div key={`pad-${i}`} className="aspect-square" />
  ));

  return (
    <div>
      <div className="mb-3 flex justify-between text-xs text-muted-foreground">
        <span>{data.monthLabel}</span>
        <span>Max {formatINR(data.maxAmountPaise)}</span>
      </div>
      <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[10px] text-muted-foreground">
        {WEEKDAYS.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {padding}
        {data.cells.map((cell) => (
          <div
            key={cell.date}
            title={`${cell.date}: ${formatINR(cell.amountPaise)}`}
            className={cn(
              "aspect-square rounded-md text-[10px] font-medium tabular-nums transition-colors",
              cell.amountPaise === 0
                ? "bg-muted/50 text-muted-foreground/50"
                : "text-primary-foreground",
            )}
            style={
              cell.amountPaise > 0
                ? {
                    backgroundColor: `color-mix(in srgb, var(--primary) ${Math.round(20 + cell.intensity * 80)}%, transparent)`,
                  }
                : undefined
            }
          >
            <span className="flex h-full items-center justify-center">{cell.day}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

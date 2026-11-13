"use client";

import { format, startOfWeek, addDays } from "date-fns";
import { Bar, BarChart, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useReducedMotion } from "motion/react";
import { ChartTooltip } from "@/components/ui/chart";
import { useMobileLayout } from "@/hooks/use-mobile-layout";
import type { FinanceSnapshot } from "@/lib/engines/finance-snapshot";

export function WeekChart({ data }: { data: FinanceSnapshot }) {
  const reduce = useReducedMotion();
  const mobile = useMobileLayout();
  const start = startOfWeek(new Date(), { weekStartsOn: 1 });
  const byDay = new Map<string, number>();
  for (const row of data.transactions) {
    if (row.kind !== "expense") continue;
    const key = format(new Date(row.occurredAt), "yyyy-MM-dd");
    byDay.set(key, (byDay.get(key) ?? 0) + row.amountPaise);
  }
  const today = format(new Date(), "yyyy-MM-dd");
  const points = Array.from({ length: 7 }, (_, index) => {
    const day = addDays(start, index);
    const key = format(day, "yyyy-MM-dd");
    return {
      name: format(day, "EEE"),
      amount: byDay.get(key) ?? 0,
      today: key === today,
    };
  });

  return (
    <section>
      <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-2">This week</h2>
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={points} margin={{ top: 8, right: 8, left: mobile ? 0 : -8, bottom: 0 }}>
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: "var(--ink-2)", fontFamily: "var(--font-mono)" }}
              axisLine={{ stroke: "var(--hairline-strong)" }}
              tickLine={false}
            />
            {!mobile && (
              <YAxis
                tickFormatter={(value) => `₹${Math.round(Number(value) / 100)}`}
                tick={{ fontSize: 11, fill: "var(--ink-2)", fontFamily: "var(--font-mono)" }}
                axisLine={false}
                tickLine={false}
                width={48}
              />
            )}
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "transparent" }} />
            <ReferenceLine
              y={data.safeSpendDaily}
              stroke="var(--marigold)"
              strokeDasharray="4 4"
              ifOverflow="extendDomain"
            />
            <Bar dataKey="amount" radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={!reduce} animationDuration={600} animationEasing="ease-out">
              {points.map((point) => (
                <Cell key={point.name} fill={point.today ? "var(--lime)" : "var(--hairline-strong)"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

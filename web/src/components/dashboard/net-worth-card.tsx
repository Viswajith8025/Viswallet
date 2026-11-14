"use client";

import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Line, LineChart, ResponsiveContainer, YAxis } from "recharts";
import { useInView, useReducedMotion } from "motion/react";
import { BorderBeam } from "@/components/ui/border-beam";
import { NumberTicker } from "@/components/ui/number-ticker";
import { db } from "@/lib/db";
import { formatINR, paiseToRupee } from "@/lib/money";
import { cn } from "@/lib/design/cn";

export function NetWorthCard({
  netWorthPaise,
  className,
}: {
  netWorthPaise: number;
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { amount: 0.4 });
  const reduce = useReducedMotion();
  const { data: snapshots = [] } = useQuery({
    queryKey: ["monthly-snapshots"],
    queryFn: () => db.monthlySnapshots.orderBy("monthKey").toArray(),
    staleTime: 60_000,
  });

  const points = snapshots.slice(-2);
  const previous = points.length >= 2 ? points[0]?.netWorthPaise : undefined;
  const delta = previous != null ? netWorthPaise - previous : null;
  const series =
    snapshots.length >= 2
      ? snapshots.slice(-6).map((row) => ({ value: row.netWorthPaise }))
      : [];

  return (
    <section
      ref={ref}
      className={cn(
        "relative flex flex-col overflow-hidden rounded-[14px] border border-hairline bg-surface p-5",
        className,
      )}
    >
      {inView && !reduce && (
        <BorderBeam
          colorFrom="#C6F432"
          colorTo="rgba(198, 244, 50, 0.05)"
          duration={16}
          size={72}
          borderWidth={1}
        />
      )}
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-2">Net worth</p>
      <p className="mt-2 font-mono text-[28px] text-ink">
        {netWorthPaise < 0 ? "−" : null}
        <span className="text-ink-2">₹</span>
        <NumberTicker
          value={Math.abs(Math.round(paiseToRupee(netWorthPaise)))}
          className="font-mono text-[28px] text-ink"
        />
      </p>
      {delta != null && (
        <p className={cn("mt-1 font-mono text-[12px]", delta >= 0 ? "text-lime" : "text-chili")}>
          {delta >= 0 ? "+" : "−"}
          {formatINR(Math.abs(delta))} vs last month
        </p>
      )}
      {series.length >= 2 ? (
        <div className="mt-3 min-h-16 flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series} margin={{ top: 10, right: 16, bottom: 10, left: 16 }}>
              <YAxis hide domain={["dataMin", "dataMax"]} padding={{ top: 6, bottom: 6 }} />
              <Line
                type="linear"
                dataKey="value"
                stroke="#C6F432"
                strokeWidth={2}
                strokeLinecap="round"
                dot={false}
                activeDot={false}
                isAnimationActive={!reduce}
                animationDuration={600}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="mt-3 font-mono text-[11px] text-ink-2">Trend starts after two months.</p>
      )}
    </section>
  );
}

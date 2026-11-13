"use client";

import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { useInView, useReducedMotion } from "motion/react";
import { BorderBeam } from "@/components/ui/border-beam";
import { db } from "@/lib/db";
import { formatINR } from "@/lib/money";
import { cn } from "@/lib/design/cn";

export function NetWorthCard({ netWorthPaise }: { netWorthPaise: number }) {
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
    <section ref={ref} className="relative overflow-hidden rounded-[14px] border border-hairline bg-surface p-5">
      {inView && !reduce && (
        <BorderBeam colorFrom="#C6F432" colorTo="transparent" duration={8} size={80} />
      )}
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-2">Net worth</p>
      <p className="mt-2 font-mono text-[28px] text-ink">{formatINR(netWorthPaise)}</p>
      {delta != null && (
        <p className={cn("mt-1 font-mono text-[12px]", delta >= 0 ? "text-lime" : "text-chili")}>
          {delta >= 0 ? "+" : "−"}
          {formatINR(Math.abs(delta))} vs last month
        </p>
      )}
      {series.length >= 2 ? (
        <div className="mt-3 h-16">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series}>
              <defs>
                <linearGradient id="nw-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#C6F432" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="#C6F432" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke="#C6F432"
                strokeWidth={2}
                fill="url(#nw-fill)"
                isAnimationActive={!reduce}
                animationDuration={600}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="mt-3 font-mono text-[11px] text-ink-2">Trend starts after two months.</p>
      )}
    </section>
  );
}

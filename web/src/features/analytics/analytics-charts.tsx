"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { ChartCard, ChartTooltip, CHART_COLORS } from "@/components/ui/chart";
import { toReceiptCategoryColor } from "@/lib/categories-default";
import { useMobileLayout } from "@/hooks/use-mobile-layout";

type BreakdownItem = { name: string; color: string; amount: number };

export function AnalyticsCharts({
  expenseBreakdown,
}: {
  expenseBreakdown: BreakdownItem[];
}) {
  const mobile = useMobileLayout();
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ChartCard
        title="Spending by category"
        description="Top categories this cycle"
        empty={expenseBreakdown.length === 0}
        emptyDescription="Add expenses to see your spending breakdown."
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={expenseBreakdown.slice(0, 8)} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: CHART_COLORS.axis, fontFamily: "var(--font-mono)" }}
              axisLine={{ stroke: "var(--hairline-strong)" }}
              tickLine={false}
            />
            {!mobile && (
            <YAxis
              tickFormatter={(v) => `₹${Math.round(v / 100)}`}
              tick={{ fontSize: 11, fill: CHART_COLORS.axis, fontFamily: "var(--font-mono)" }}
              axisLine={false}
              tickLine={false}
              width={48}
            />
            )}
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "transparent" }} />
            <Bar
              dataKey="amount"
              fill={CHART_COLORS.primary}
              radius={[6, 6, 0, 0]}
              maxBarSize={40}
              animationDuration={600}
              animationEasing="ease-out"
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Expense distribution" description="Where your money goes" empty={expenseBreakdown.length === 0} emptyDescription="Add expenses to see your spending breakdown.">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={expenseBreakdown}
              dataKey="amount"
              nameKey="name"
              innerRadius="58%"
              outerRadius="82%"
              paddingAngle={2}
              stroke="transparent"
            >
              {expenseBreakdown.map((e) => (
                <Cell key={e.name} fill={toReceiptCategoryColor(e.color, e.name)} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

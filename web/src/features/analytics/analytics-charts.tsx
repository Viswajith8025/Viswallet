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
  CartesianGrid,
} from "recharts";
import { ChartCard, ChartTooltip, CHART_COLORS } from "@/components/ui/chart";

type BreakdownItem = { name: string; color: string; amount: number };

export function AnalyticsCharts({
  expenseBreakdown,
}: {
  expenseBreakdown: BreakdownItem[];
}) {
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
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: CHART_COLORS.axis }} axisLine={false} tickLine={false} />
            <YAxis
              tickFormatter={(v) => `₹${Math.round(v / 100)}`}
              tick={{ fontSize: 11, fill: CHART_COLORS.axis }}
              axisLine={false}
              tickLine={false}
              width={48}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: CHART_COLORS.cursor, opacity: 0.4 }} />
            <Bar dataKey="amount" fill={CHART_COLORS.primary} radius={[6, 6, 0, 0]} maxBarSize={40} />
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
                <Cell key={e.name} fill={e.color} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

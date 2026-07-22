"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Snowflake, TrendingDown } from "lucide-react";
import { PageHeader, PageContainer, StatCard } from "@/components/ui/page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { db } from "@/lib/db";
import { collectDebts, simulatePayoff } from "@/lib/engines/premium/debt-planner";
import { formatINR, parseRupeeInput } from "@/lib/money";

export default function DebtPlannerPage() {
  const [strategy, setStrategy] = useState<"snowball" | "avalanche">("avalanche");
  const [extraPaise, setExtraPaise] = useState(0);

  const { data } = useQuery({
    queryKey: ["debt-planner"],
    queryFn: async () => {
      const [emis, loans] = await Promise.all([db.emis.toArray(), db.loans.toArray()]);
      return collectDebts(emis, loans);
    },
  });

  const debts = data ?? [];
  const totalDebt = debts.reduce((s, d) => s + d.balancePaise, 0);
  const plan = simulatePayoff(debts, extraPaise, strategy);

  return (
    <PageContainer className="max-w-5xl">
      <PageHeader
        eyebrow="Planning"
        title="Debt Payoff Planner"
        description="Compare snowball vs avalanche strategies with extra payment scenarios."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Total debt" value={formatINR(totalDebt)} tone="negative" />
        <StatCard label="Payoff time" value={plan.months > 600 ? "—" : `${plan.months} mo`} />
        <StatCard label="Est. interest" value={formatINR(plan.totalInterestPaise)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Strategy & extra payments</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3 pt-0">
          <Button
            variant={strategy === "snowball" ? "primary" : "outline"}
            onClick={() => setStrategy("snowball")}
            className="gap-2"
          >
            <Snowflake size={16} />
            Snowball
          </Button>
          <Button
            variant={strategy === "avalanche" ? "primary" : "outline"}
            onClick={() => setStrategy("avalanche")}
            className="gap-2"
          >
            <TrendingDown size={16} />
            Avalanche
          </Button>
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Extra/month (₹)</label>
            <Input
              type="number"
              className="w-28"
              value={extraPaise / 100}
              onChange={(e) => setExtraPaise(parseRupeeInput(e.target.value))}
            />
          </div>
        </CardContent>
      </Card>

      {debts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No active debts. Add EMIs or borrowed loans to build a payoff plan.
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Debts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              {debts.map((d) => (
                <div key={d.id} className="flex justify-between rounded-xl border border-border/60 px-4 py-3 text-sm">
                  <div>
                    <p className="font-medium">{d.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {d.type.toUpperCase()} · {d.interestRate}% APR · {formatINR(d.monthlyPaymentPaise)}/mo
                    </p>
                  </div>
                  <span className="font-semibold tabular-nums">{formatINR(d.balancePaise)}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {plan.schedule.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Payoff schedule (first 24 months)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 pt-0">
                {plan.schedule.map((s) => (
                  <div key={s.month} className="flex justify-between text-sm">
                    <span>Month {s.month}</span>
                    <span className="tabular-nums text-muted-foreground">
                      Remaining {formatINR(s.remainingPaise)}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </PageContainer>
  );
}

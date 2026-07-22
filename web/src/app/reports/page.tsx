"use client";

import { FileText, Download, Printer } from "lucide-react";
import { PageHeader, PageContainer, StatCard } from "@/components/ui/page";
import { FinanceGate } from "@/components/layout/finance-gate";
import { GlobalFilterBar } from "@/components/filters/global-filter-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { buildFinancialReport, printReport, downloadReportPdf } from "@/lib/export/reports";
import { formatINR } from "@/lib/money";
import { formatCycleLabel } from "@/lib/salary-cycle";

export default function ReportsPage() {
  return (
    <FinanceGate>
      {(data) => {
        const monthly = buildFinancialReport(data, "monthly");
        const yearly = buildFinancialReport(data, "yearly");

        return (
          <PageContainer className="max-w-5xl">
            <PageHeader
              eyebrow="Reports"
              title="Financial Reports"
              description="Monthly and yearly summaries — export as PDF via print."
            />
            <GlobalFilterBar />

            <div className="grid gap-4 md:grid-cols-3">
              <StatCard label="Income" value={formatINR(monthly.summary.income)} tone="positive" />
              <StatCard label="Expenses" value={formatINR(monthly.summary.expenses)} tone="negative" />
              <StatCard label="Health score" value={`${monthly.summary.healthScore}/100`} tone="primary" />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <FileText size={18} />
                      Monthly report
                    </CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">{formatCycleLabel(data.monthKey)}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => printReport(monthly)}>
                      <Printer size={14} className="mr-1.5" />
                      Print
                    </Button>
                    <Button size="sm" onClick={() => downloadReportPdf(monthly)}>
                      <Download size={14} className="mr-1.5" />
                      PDF
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 pt-0 text-sm">
                  {monthly.categories.slice(0, 5).map((c) => (
                    <div key={c.name} className="flex justify-between">
                      <span>{c.name}</span>
                      <span className="tabular-nums font-medium">{formatINR(c.amount)}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <FileText size={18} />
                      Yearly snapshot
                    </CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">Current cycle overview</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => printReport(yearly)}>
                    <Download size={14} className="mr-1.5" />
                    Export
                  </Button>
                </CardHeader>
                <CardContent className="grid gap-2 pt-0 text-sm sm:grid-cols-2">
                  <p>Net worth: <strong>{formatINR(yearly.summary.netWorth)}</strong></p>
                  <p>Savings rate: <strong>{yearly.summary.savingsRate}%</strong></p>
                  <p>Subscriptions: <strong>{formatINR(yearly.obligations.subscriptions)}/mo</strong></p>
                  <p>EMIs: <strong>{formatINR(yearly.obligations.emis)}/mo</strong></p>
                </CardContent>
              </Card>
            </div>
          </PageContainer>
        );
      }}
    </FinanceGate>
  );
}

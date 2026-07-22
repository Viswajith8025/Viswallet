import { format } from "date-fns";
import type { FinanceSnapshot } from "@/lib/engines/finance-snapshot";
import { sumByCategory } from "@/lib/engines/finance-snapshot";
import { formatINR } from "@/lib/money";
import { formatCycleLabel } from "@/lib/salary-cycle";

export type ReportPeriod = "monthly" | "yearly";

export type FinancialReport = {
  title: string;
  period: ReportPeriod;
  generatedAt: Date;
  cycleLabel: string;
  summary: {
    income: number;
    expenses: number;
    remaining: number;
    savingsRate: number;
    netWorth: number;
    healthScore: number;
  };
  categories: { name: string; amount: number; pct: number }[];
  obligations: {
    subscriptions: number;
    bills: number;
    emis: number;
  };
};

export function buildFinancialReport(
  data: FinanceSnapshot,
  period: ReportPeriod,
): FinancialReport {
  const breakdown = sumByCategory(data.transactions, data.categories, "expense");
  const total = data.expensePaise || 1;
  const savingsRate =
    data.incomePaise > 0
      ? Math.round(((data.incomePaise - data.expensePaise) / data.incomePaise) * 100)
      : 0;

  return {
    title: period === "monthly" ? "Monthly Financial Report" : "Yearly Financial Report",
    period,
    generatedAt: new Date(),
    cycleLabel: formatCycleLabel(data.monthKey),
    summary: {
      income: data.incomePaise,
      expenses: data.expensePaise,
      remaining: data.remainingPaise,
      savingsRate,
      netWorth: data.netWorthPaise,
      healthScore: data.healthScore,
    },
    categories: breakdown.map((c) => ({
      name: c.name,
      amount: c.amount,
      pct: Math.round((c.amount / total) * 100),
    })),
    obligations: {
      subscriptions: data.subscriptionMonthlyPaise,
      bills: data.billsDuePaise,
      emis: data.emiMonthlyPaise,
    },
  };
}

export function reportToPrintHtml(report: FinancialReport): string {
  const rows = report.categories
    .map(
      (c) =>
        `<tr><td>${c.name}</td><td style="text-align:right">${formatINR(c.amount)}</td><td style="text-align:right">${c.pct}%</td></tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${report.title}</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 40px; color: #0a0f1a; }
    h1 { font-size: 24px; margin-bottom: 4px; }
    .meta { color: #64748b; font-size: 13px; margin-bottom: 32px; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 32px; }
    .card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; }
    .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; }
    .value { font-size: 20px; font-weight: 600; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 10px 8px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
    th { text-align: left; font-size: 11px; text-transform: uppercase; color: #64748b; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <h1>${report.title}</h1>
  <p class="meta">${report.cycleLabel} · Generated ${format(report.generatedAt, "PPP p")}</p>
  <div class="grid">
    <div class="card"><div class="label">Income</div><div class="value">${formatINR(report.summary.income)}</div></div>
    <div class="card"><div class="label">Expenses</div><div class="value">${formatINR(report.summary.expenses)}</div></div>
    <div class="card"><div class="label">Remaining</div><div class="value">${formatINR(report.summary.remaining)}</div></div>
    <div class="card"><div class="label">Savings rate</div><div class="value">${report.summary.savingsRate}%</div></div>
    <div class="card"><div class="label">Net worth</div><div class="value">${formatINR(report.summary.netWorth)}</div></div>
    <div class="card"><div class="label">Health score</div><div class="value">${report.summary.healthScore}/100</div></div>
  </div>
  <h2>Spending by category</h2>
  <table>
    <thead><tr><th>Category</th><th style="text-align:right">Amount</th><th style="text-align:right">Share</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <h2 style="margin-top:32px">Fixed obligations</h2>
  <table>
    <tr><td>Subscriptions (monthly)</td><td style="text-align:right">${formatINR(report.obligations.subscriptions)}</td></tr>
    <tr><td>Bills due</td><td style="text-align:right">${formatINR(report.obligations.bills)}</td></tr>
    <tr><td>EMIs (monthly)</td><td style="text-align:right">${formatINR(report.obligations.emis)}</td></tr>
  </table>
</body>
</html>`;
}

export function printReport(report: FinancialReport): void {
  const html = reportToPrintHtml(report);
  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 300);
}

export function downloadReportPdf(report: FinancialReport): void {
  printReport(report);
}

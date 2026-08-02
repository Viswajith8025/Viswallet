import { NextResponse } from "next/server";
import { z } from "zod";
import { groqChat } from "@/lib/ai/groq-server";
import { enforceAiRateLimit } from "@/lib/api/ai-rate-limit";

const bodySchema = z.object({
  monthLabel: z.string().max(40),
  salaryPaise: z.number().int().min(0),
  expensePaise: z.number().int().min(0),
  remainingPaise: z.number().int(),
  daysLeft: z.number().int().min(0),
  safeSpendDaily: z.number().int().min(0).optional(),
  borrowedBalance: z.number().int().min(0).optional(),
  billsDuePaise: z.number().int().min(0).optional(),
  emiMonthlyPaise: z.number().int().min(0).optional(),
  healthScore: z.number().int().min(0).max(100).optional(),
  topCategories: z
    .array(z.object({ name: z.string().max(80), amountPaise: z.number().int().min(0) }))
    .max(8),
});

function formatRupees(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export async function POST(request: Request) {
  const limited = enforceAiRateLimit(request);
  if (limited) return limited;

  try {
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const data = parsed.data;
    const top = data.topCategories
      .map((c) => `${c.name}: ${formatRupees(c.amountPaise)}`)
      .join("; ");

    const contextLines = [
      `Cycle: ${data.monthLabel}`,
      `Salary/income base: ${formatRupees(data.salaryPaise)}`,
      `Spent so far: ${formatRupees(data.expensePaise)}`,
      `Remaining: ${formatRupees(data.remainingPaise)}`,
      `Days left in cycle: ${data.daysLeft}`,
      data.safeSpendDaily != null ? `Safe to spend per day: ${formatRupees(data.safeSpendDaily)}` : null,
      data.healthScore != null ? `Health score: ${data.healthScore}/100` : null,
      data.borrowedBalance != null && data.borrowedBalance > 0
        ? `Borrowed (owe others): ${formatRupees(data.borrowedBalance)}`
        : null,
      data.billsDuePaise != null && data.billsDuePaise > 0
        ? `Unpaid bills: ${formatRupees(data.billsDuePaise)}`
        : null,
      data.emiMonthlyPaise != null && data.emiMonthlyPaise > 0
        ? `EMI this month: ${formatRupees(data.emiMonthlyPaise)}`
        : null,
      `Top spending: ${top || "none yet"}`,
    ]
      .filter(Boolean)
      .join("\n");

    const raw = await groqChat(
      [
        {
          role: "system",
          content:
            "You are a sharp Indian personal finance coach (Viswallet app). Use INR rupees. Be specific to the numbers given — mention categories, debt, or bills when relevant. No generic advice like 'track spending'. Respond JSON only: {\"summary\":\"2-3 short sentences\",\"tips\":[\"actionable tip\"]}. Max 2 tips.",
        },
        {
          role: "user",
          content: contextLines,
        },
      ],
      { json: true, maxTokens: 450 },
    );

    const json = JSON.parse(raw) as { summary?: string; tips?: string[] };
    const summary = json.summary?.trim() || "Keep logging — your coach gets smarter as the cycle fills in.";
    const tips = (json.tips ?? []).filter((t) => typeof t === "string" && t.trim()).slice(0, 2);

    return NextResponse.json({ summary, tips });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI insights failed.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}

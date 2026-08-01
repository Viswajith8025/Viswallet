import { NextResponse } from "next/server";
import { z } from "zod";
import { groqChat } from "@/lib/ai/groq-server";

const bodySchema = z.object({
  monthLabel: z.string().max(40),
  salaryPaise: z.number().int().min(0),
  expensePaise: z.number().int().min(0),
  remainingPaise: z.number().int(),
  daysLeft: z.number().int().min(0),
  topCategories: z
    .array(z.object({ name: z.string().max(80), amountPaise: z.number().int().min(0) }))
    .max(8),
});

function formatRupees(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export async function POST(request: Request) {
  try {
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const data = parsed.data;
    const top = data.topCategories
      .map((c) => `${c.name}: ${formatRupees(c.amountPaise)}`)
      .join("; ");

    const raw = await groqChat(
      [
        {
          role: "system",
          content:
            "You are a concise Indian personal finance coach. Use rupees. Respond JSON only: {\"summary\":\"2-3 sentences\",\"tips\":[\"tip1\",\"tip2\"]}. Max 3 tips. Be practical, not generic.",
        },
        {
          role: "user",
          content: `Cycle: ${data.monthLabel}\nSalary: ${formatRupees(data.salaryPaise)}\nSpent: ${formatRupees(data.expensePaise)}\nRemaining: ${formatRupees(data.remainingPaise)}\nDays left: ${data.daysLeft}\nTop categories: ${top || "none"}`,
        },
      ],
      { json: true, maxTokens: 400 },
    );

    const json = JSON.parse(raw) as { summary?: string; tips?: string[] };
    const summary = json.summary?.trim() || "Keep tracking — patterns emerge after a few weeks of data.";
    const tips = (json.tips ?? []).filter((t) => typeof t === "string" && t.trim()).slice(0, 3);

    return NextResponse.json({ summary, tips });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI insights failed.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}

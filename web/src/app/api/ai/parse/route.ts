import { NextResponse } from "next/server";
import { z } from "zod";
import { groqChat } from "@/lib/ai/groq-server";

const bodySchema = z.object({
  text: z.string().min(1).max(300),
  defaultKind: z.enum(["expense", "income"]),
  categories: z
    .array(z.object({ slug: z.string().max(64), name: z.string().max(80) }))
    .min(1)
    .max(50),
});

export async function POST(request: Request) {
  try {
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const { text, defaultKind, categories } = parsed.data;
    const slugList = categories.map((c) => `${c.slug} (${c.name})`).join(", ");

    const raw = await groqChat(
      [
        {
          role: "system",
          content: `Parse Indian personal finance quick-add text. Amounts are INR rupees (not paise). Respond JSON only: {"title":"string","amountPaise":number,"kind":"expense"|"income","categorySlug":"slug"}. amountPaise must be rupees * 100.`,
        },
        {
          role: "user",
          content: `Text: ${text}\nDefault kind if unclear: ${defaultKind}\nCategories: ${slugList}`,
        },
      ],
      { json: true, maxTokens: 256 },
    );

    const json = JSON.parse(raw) as {
      title?: string;
      amountPaise?: number;
      kind?: string;
      categorySlug?: string;
    };

    const categorySlug =
      categories.find((c) => c.slug === json.categorySlug?.trim().toLowerCase())?.slug ?? "misc";
    const kind = json.kind === "income" ? "income" : json.kind === "expense" ? "expense" : defaultKind;
    const amountPaise = Math.max(0, Math.round(Number(json.amountPaise) || 0));
    const title = (json.title?.trim() || text.trim()).slice(0, 120);

    if (!title || amountPaise <= 0) {
      return NextResponse.json({ error: "Could not parse amount or title." }, { status: 422 });
    }

    return NextResponse.json({ title, amountPaise, kind, categorySlug });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI parse failed.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { groqChat } from "@/lib/ai/groq-server";
import { enforceAiRateLimit } from "@/lib/api/ai-rate-limit";
import { enforceAiAccess, sanitizeAiError } from "@/lib/api/ai-guard";

const bodySchema = z.object({
  title: z.string().min(1).max(200),
  kind: z.enum(["expense", "income"]),
  categories: z
    .array(z.object({ slug: z.string().max(64), name: z.string().max(80) }))
    .min(1)
    .max(50),
});

export async function POST(request: Request) {
  const limited = enforceAiRateLimit(request);
  if (limited) return limited;

  const denied = await enforceAiAccess(request);
  if (denied) return denied;

  try {
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const { title, kind, categories } = parsed.data;
    const slugList = categories.map((c) => c.slug).join(", ");

    const raw = await groqChat(
      [
        {
          role: "system",
          content: `You categorize Indian personal finance transactions. Pick exactly one category slug from the allowed list. Respond JSON only: {"categorySlug":"slug"}`,
        },
        {
          role: "user",
          content: `Kind: ${kind}\nTitle: ${title}\nAllowed slugs: ${slugList}`,
        },
      ],
      { json: true, maxTokens: 64 },
    );

    const json = JSON.parse(raw) as { categorySlug?: string };
    const slug = json.categorySlug?.trim().toLowerCase();
    const valid = categories.find((c) => c.slug === slug);
    if (!valid) {
      return NextResponse.json({ categorySlug: "misc" });
    }

    return NextResponse.json({ categorySlug: valid.slug });
  } catch {
    return NextResponse.json({ error: sanitizeAiError() }, { status: 503 });
  }
}

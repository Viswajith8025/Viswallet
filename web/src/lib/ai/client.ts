export type AiStatus = {
  available: boolean;
  groq: boolean;
  supabase: boolean;
  cloudVault: boolean;
};

export type AiParseResult = {
  title: string;
  amountPaise: number;
  kind: "expense" | "income";
  categorySlug: string;
};

export type AiInsightsResult = {
  summary: string;
  tips: string[];
};

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? "AI request failed.");
  }
  return res.json() as Promise<T>;
}

export async function fetchAiStatus(): Promise<AiStatus> {
  const res = await fetch("/api/ai/status");
  if (!res.ok) {
    return { available: false, groq: false, supabase: false, cloudVault: false };
  }
  return res.json() as Promise<AiStatus>;
}

export async function parseTransactionWithAi(
  text: string,
  categories: Array<{ slug: string; name: string }>,
  defaultKind: "expense" | "income",
): Promise<AiParseResult> {
  return postJson<AiParseResult>("/api/ai/parse", { text, categories, defaultKind });
}

export async function suggestCategoryWithAi(
  title: string,
  kind: "expense" | "income",
  categories: Array<{ slug: string; name: string }>,
): Promise<{ categorySlug: string }> {
  return postJson<{ categorySlug: string }>("/api/ai/categorize", { title, kind, categories });
}

export async function fetchAiInsights(context: {
  monthLabel: string;
  salaryPaise: number;
  expensePaise: number;
  remainingPaise: number;
  daysLeft: number;
  topCategories: Array<{ name: string; amountPaise: number }>;
}): Promise<AiInsightsResult> {
  return postJson<AiInsightsResult>("/api/ai/insights", context);
}

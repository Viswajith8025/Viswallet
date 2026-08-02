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

export type AiInsightsContext = {
  monthLabel: string;
  salaryPaise: number;
  expensePaise: number;
  remainingPaise: number;
  daysLeft: number;
  safeSpendDaily?: number;
  borrowedBalance?: number;
  billsDuePaise?: number;
  emiMonthlyPaise?: number;
  healthScore?: number;
  topCategories: Array<{ name: string; amountPaise: number }>;
};

async function aiAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  try {
    const { getAuthSession } = await import("@/lib/supabase/auth");
    const session = await getAuthSession();
    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
    }
  } catch {
    // Offline or auth unavailable — server may still allow same-origin requests.
  }
  return headers;
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: await aiAuthHeaders(),
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

export async function fetchAiInsights(context: AiInsightsContext): Promise<AiInsightsResult> {
  return postJson<AiInsightsResult>("/api/ai/insights", context);
}

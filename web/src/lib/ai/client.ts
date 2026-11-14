export type AiStatus = {
  enabled: boolean;
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

const disabledStatus: AiStatus = {
  enabled: false,
  available: false,
  groq: false,
  supabase: false,
  cloudVault: false,
};

let sessionStatus: Promise<AiStatus> | null = null;

/** One status check per page load. Callers must not hit Groq routes when this is false. */
export function loadAiSession(): Promise<AiStatus> {
  if (!sessionStatus) {
    sessionStatus = fetch("/api/ai/status")
      .then(async (res) => {
        if (!res.ok) return disabledStatus;
        const body = (await res.json()) as Partial<AiStatus>;
        const enabled = body.enabled === true;
        return {
          enabled,
          available: enabled,
          groq: enabled,
          supabase: body.supabase === true,
          cloudVault: body.cloudVault === true,
        };
      })
      .catch(() => disabledStatus);
  }
  return sessionStatus;
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const session = await loadAiSession();
  if (!session.enabled) {
    throw new Error("AI features are off.");
  }
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

export function shouldShowAiEntry(
  status: { enabled?: boolean; groq?: boolean } | null,
): boolean {
  if (!status) return false;
  if (typeof status.enabled === "boolean") return status.enabled;
  return status.groq === true;
}

export async function fetchAiStatus(): Promise<AiStatus> {
  return loadAiSession();
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
  const payload = categories
    .slice(0, 100)
    .map((category) => ({
      slug: category.slug.slice(0, 64),
      name: category.name.slice(0, 80),
    }))
    .filter((category) => category.slug.length > 0 && category.name.length > 0);
  if (payload.length === 0) return { categorySlug: "misc" };
  return postJson<{ categorySlug: string }>("/api/ai/categorize", { title, kind, categories: payload });
}

export async function fetchAiInsights(context: AiInsightsContext): Promise<AiInsightsResult> {
  return postJson<AiInsightsResult>("/api/ai/insights", context);
}

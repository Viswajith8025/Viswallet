import { getGroqApiKey, isProduction } from "@/lib/security/env";

const GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "llama-3.1-8b-instant";

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export function isGroqConfigured(): boolean {
  try {
    return getGroqApiKey() !== null;
  } catch {
    return false;
  }
}

export async function groqChat(
  messages: ChatMessage[],
  options?: { json?: boolean; maxTokens?: number },
): Promise<string> {
  const apiKey = getGroqApiKey();
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured.");
  }

  const response = await fetch(GROQ_CHAT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      messages,
      temperature: 0.2,
      max_tokens: options?.maxTokens ?? 512,
      response_format: options?.json ? { type: "json_object" } : undefined,
    }),
  });

  if (!response.ok) {
    if (isProduction) {
      throw new Error("Groq request failed.");
    }
    const detail = await response.text().catch(() => "");
    throw new Error(`Groq request failed (${response.status}): ${detail.slice(0, 200)}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("Empty Groq response.");
  return content;
}

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isGroqConfigured } from "@/lib/ai/groq-server";
import { getSupabaseConfig, isProduction } from "@/lib/security/env";

const AI_UNAVAILABLE = "AI features are temporarily unavailable. Try again later.";

/** Generic client-safe AI error — never leak Groq or internal details. */
export function sanitizeAiError(): string {
  return AI_UNAVAILABLE;
}

function isSameOriginRequest(request: Request): boolean {
  const secFetchSite = request.headers.get("sec-fetch-site");
  if (secFetchSite && secFetchSite !== "same-origin" && secFetchSite !== "none") {
    return false;
  }

  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return true;

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

async function verifySupabaseSession(request: Request): Promise<boolean> {
  const cfg = getSupabaseConfig();
  if (!cfg) return true;

  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
  if (!token) return false;

  const sb = createClient(cfg.url, cfg.anonKey);
  const { data, error } = await sb.auth.getUser(token);
  return !error && Boolean(data.user);
}

/** Blocks unauthenticated cross-origin abuse of Groq-backed routes. */
export async function enforceAiAccess(request: Request): Promise<NextResponse | null> {
  if (!isGroqConfigured()) {
    return NextResponse.json({ error: AI_UNAVAILABLE }, { status: 503 });
  }

  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const cfg = getSupabaseConfig();
  if (cfg) {
    const authed = await verifySupabaseSession(request);
    if (!authed) {
      return NextResponse.json({ error: "Sign in to use AI features." }, { status: 401 });
    }
  } else if (isProduction) {
    // Without cloud auth, only allow same-origin browser requests (sec-fetch already checked).
    const secFetchMode = request.headers.get("sec-fetch-mode");
    if (secFetchMode && secFetchMode !== "cors" && secFetchMode !== "same-origin" && secFetchMode !== "navigate") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }
  }

  return null;
}

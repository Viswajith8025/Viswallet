import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/security/rate-limit";

const AI_LIMIT = 40;
const AI_WINDOW_MS = 60_000;

function rateLimitClientKey(request: Request): string {
  const host = request.headers.get("host") ?? "unknown";
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (process.env.NODE_ENV === "production" && realIp) {
    return `ai:${host}:${realIp}`;
  }
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? realIp ?? "anonymous";
  return `ai:${host}:${ip}`;
}

export function enforceAiRateLimit(request: Request): NextResponse | null {
  const { allowed, retryAfterMs } = checkRateLimit(rateLimitClientKey(request), AI_LIMIT, AI_WINDOW_MS);

  if (!allowed) {
    return NextResponse.json(
      { error: "Too many AI requests. Please wait a moment and try again." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.max(1, Math.ceil(retryAfterMs / 1000))) },
      },
    );
  }

  return null;
}

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function extraConnectOrigins(): string {
  const origins = new Set<string>();
  for (const raw of [
    process.env.NEXT_PUBLIC_ERROR_REPORT_URL,
    process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT,
  ]) {
    if (!raw?.trim()) continue;
    try {
      origins.add(new URL(raw.trim()).origin);
    } catch {
      // ignore invalid URLs
    }
  }
  return origins.size ? ` ${[...origins].join(" ")}` : "";
}

function buildCsp(): string {
  const scriptSrc =
    process.env.NODE_ENV === "production"
      ? "script-src 'self' 'unsafe-inline'"
      : "script-src 'self' 'unsafe-inline' 'unsafe-eval'";

  return [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob:",
    "font-src 'self' data: https://fonts.gstatic.com",
    `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.groq.com${extraConnectOrigins()}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

export function proxy(request: NextRequest) {
  const response = NextResponse.next();

  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-DNS-Prefetch-Control", "off");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  );
  response.headers.set("Content-Security-Policy", buildCsp());
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin");

  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  }

  const path = request.nextUrl.pathname;
  if (/^\/(\.env|wp-admin|wp-login|admin|api\/debug)/.test(path)) {
    return new NextResponse(null, { status: 404 });
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|icon-192|icon-512|sw\\.js|manifest\\.json).*)"],
};

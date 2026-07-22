import { isProduction } from "@/lib/security/env";

export type ErrorReport = {
  message: string;
  stack?: string;
  digest?: string;
  context?: string;
  url?: string;
  userAgent?: string;
  appVersion: string;
  timestamp: string;
};

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "1.0.0";

/** Privacy-safe error reporting. No financial data is ever included. */
export function reportError(error: Error & { digest?: string }, context?: string): void {
  const payload: ErrorReport = {
    message: error.message,
    stack: error.stack,
    digest: error.digest,
    context,
    url: typeof window !== "undefined" ? window.location.pathname : undefined,
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    appVersion: APP_VERSION,
    timestamp: new Date().toISOString(),
  };

  if (!isProduction) {
    console.error("[Viswallet]", context ?? "error", payload);
    return;
  }

  const endpoint = process.env.NEXT_PUBLIC_ERROR_REPORT_URL?.trim();
  if (!endpoint) return;

  const body = JSON.stringify(payload);
  try {
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, new Blob([body], { type: "application/json" }));
    } else {
      void fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      });
    }
  } catch {
    // Swallow — monitoring must never break the app
  }
}

/** Optional privacy-friendly analytics. Disabled by default; no PII or amounts. */
export function trackEvent(name: string, properties?: Record<string, string>): void {
  if (process.env.NEXT_PUBLIC_ANALYTICS_ENABLED !== "true") return;
  if (!isProduction) {
    console.debug("[analytics]", name, properties);
    return;
  }
  const endpoint = process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT?.trim();
  if (!endpoint) return;
  const body = JSON.stringify({ name, properties, timestamp: new Date().toISOString(), appVersion: APP_VERSION });
  try {
    navigator.sendBeacon?.(endpoint, new Blob([body], { type: "application/json" }));
  } catch {
    // noop
  }
}

export function trackPageView(path: string): void {
  trackEvent("page_view", { path });
}

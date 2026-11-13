"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ErrorBoundary } from "@/components/error-boundary";
import { DbProvider } from "@/components/providers/db-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { PremiumBootstrap } from "@/components/providers/premium-bootstrap";
import { kickstartDb } from "@/lib/db/boot";
import { ensureDbSeeded, getSettings, peekBootCache } from "@/lib/db";
import { clearAccentOverrides } from "@/lib/theme/accent";
import { applyThemeMode } from "@/lib/theme/resolve";
import { createQueryClient } from "@/lib/react-query/create-query-client";

function applyBootTheme() {
  clearAccentOverrides();
  const boot = peekBootCache();
  if (!boot) return;
  applyThemeMode(boot.themeMode);
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(createQueryClient);

  useEffect(() => {
    kickstartDb();
    let mq: MediaQueryList | null = null;
    let themeMode: "system" | "light" | "dark" = peekBootCache()?.themeMode ?? "dark";

    const onThemeChange = () => {
      if (themeMode === "system") applyThemeMode("system");
    };

    applyBootTheme();

    ensureDbSeeded()
      .then(() => getSettings())
      .then((settings) => {
        themeMode = settings.themeMode;
        applyThemeMode(themeMode);
        clearAccentOverrides();
        mq = window.matchMedia("(prefers-color-scheme: dark)");
        mq.addEventListener("change", onThemeChange);
      });

    return () => {
      mq?.removeEventListener("change", onThemeChange);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <DbProvider>
          <PremiumBootstrap />
          <ErrorBoundary>{children}</ErrorBoundary>
        </DbProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

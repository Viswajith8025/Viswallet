"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ErrorBoundary } from "@/components/error-boundary";
import { DbProvider } from "@/components/providers/db-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { PremiumBootstrap } from "@/components/providers/premium-bootstrap";
import { kickstartDb } from "@/lib/db/boot";
import { ensureDbSeeded, getSettings, updateSettings } from "@/lib/db";
import { clearAccentOverrides } from "@/lib/theme/accent";
import { readExplicitTheme, readThemeMode, writeThemeMode } from "@/lib/theme/preference";
import { applyThemeMode } from "@/lib/theme/resolve";
import { createQueryClient } from "@/lib/react-query/create-query-client";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(createQueryClient);

  useEffect(() => {
    kickstartDb();
    clearAccentOverrides();
    if (readExplicitTheme()) applyThemeMode(readThemeMode());
    else writeThemeMode(readThemeMode());

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onThemeChange = () => {
      if (readThemeMode() === "system") applyThemeMode("system");
    };
    mq.addEventListener("change", onThemeChange);

    ensureDbSeeded()
      .then(() => getSettings())
      .then((settings) => {
        const chosen = readThemeMode();
        if (settings.themeMode !== chosen) {
          void updateSettings({ themeMode: chosen });
        }
      });

    return () => {
      mq.removeEventListener("change", onThemeChange);
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

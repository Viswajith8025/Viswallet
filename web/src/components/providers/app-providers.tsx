"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { SplashScreen } from "@/components/ui/splash-screen";
import { ErrorBoundary } from "@/components/error-boundary";
import { DbProvider } from "@/components/providers/db-provider";
import { PremiumBootstrap } from "@/components/providers/premium-bootstrap";
import { ensureDbSeeded, getSettings } from "@/lib/db";
import { applyAccentColor } from "@/lib/theme/accent";
import type { AccentColor } from "@/lib/db/types";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
      },
    },
  });
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [queryClient] = useState(makeQueryClient);

  useEffect(() => {
    ensureDbSeeded().then(async () => {
      const settings = await getSettings();
      if (settings.themeMode !== "system") {
        document.documentElement.setAttribute("data-theme", settings.themeMode);
      }
      applyAccentColor((settings.accentColor ?? "violet") as AccentColor);
      setReady(true);
    });
  }, []);

  if (!ready) {
    return <SplashScreen />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <DbProvider>
        <PremiumBootstrap />
        <ErrorBoundary>{children}</ErrorBoundary>
      </DbProvider>
    </QueryClientProvider>
  );
}

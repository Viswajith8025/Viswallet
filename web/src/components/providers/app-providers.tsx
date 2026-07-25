"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { SplashScreen } from "@/components/ui/splash-screen";
import { ErrorBoundary } from "@/components/error-boundary";
import { DbProvider } from "@/components/providers/db-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { PremiumBootstrap } from "@/components/providers/premium-bootstrap";
import { ensureDbSeeded, getSettings } from "@/lib/db";
import { applyAccentColor } from "@/lib/theme/accent";
import { applyThemeMode } from "@/lib/theme/resolve";
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
    let mq: MediaQueryList | null = null;
    let accent: AccentColor = "violet";

    let themeMode: "system" | "light" | "dark" = "system";

    const onThemeChange = () => {
      applyThemeMode(themeMode);
      applyAccentColor(accent);
    };

    ensureDbSeeded().then(async () => {
      const settings = await getSettings();
      accent = (settings.accentColor ?? "violet") as AccentColor;
      themeMode = settings.themeMode;
      applyThemeMode(themeMode);
      applyAccentColor(accent);
      mq = window.matchMedia("(prefers-color-scheme: dark)");
      mq.addEventListener("change", onThemeChange);
      setReady(true);
    });

    return () => {
      mq?.removeEventListener("change", onThemeChange);
    };
  }, []);

  if (!ready) {
    return <SplashScreen />;
  }

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

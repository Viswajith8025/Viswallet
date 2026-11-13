"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSettings, peekBootCache } from "@/lib/db";
import { useAuth } from "@/components/providers/auth-provider";
import { BrandLoader } from "@/components/brand/brand-loader";
import { shouldAutoCloudSync } from "@/lib/supabase/cloud-sync";
import { copy } from "@/lib/ux/copy";

const ALWAYS_PUBLIC_ROUTES = ["/auth", "/privacy", "/terms", "/licenses", "/about"];
const ONBOARDING_ROUTE = "/onboarding";
const SETTINGS_READY_TIMEOUT_MS = 6000;

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { configured, user, loading: authLoading, cloudSyncReady, cloudDown } = useAuth();
  const authRequired = configured && !cloudDown;
  const isOnboarding = pathname === ONBOARDING_ROUTE;
  const isPublic =
    ALWAYS_PUBLIC_ROUTES.includes(pathname) ||
    (!configured && isOnboarding);
  // Boot cache lives in localStorage, so the first render must match the server.
  const [appReady, setAppReady] = useState(isPublic);

  useEffect(() => {
    if (isPublic) return;

    if (authRequired && authLoading) return;

    if (authRequired && user && shouldAutoCloudSync() && !cloudSyncReady) return;

    if (authRequired && !user) {
      router.replace("/auth");
      return;
    }

    let cancelled = false;
    const settingsTimeout = window.setTimeout(() => {
      if (cancelled) return;
      const boot = peekBootCache();
      if (boot?.onboardingComplete && !isOnboarding) {
        setAppReady(true);
      }
    }, SETTINGS_READY_TIMEOUT_MS);

    getSettings()
      .then((s) => {
        if (cancelled) return;
        if (!s.onboardingComplete) {
          if (isOnboarding) setAppReady(true);
          else router.replace(ONBOARDING_ROUTE);
          return;
        }
        if (isOnboarding) {
          router.replace("/");
          return;
        }
        setAppReady(true);
      })
      .catch(() => {
        if (cancelled) return;
        if (isOnboarding) {
          setAppReady(true);
        } else {
          router.replace(ONBOARDING_ROUTE);
        }
      })
      .finally(() => {
        window.clearTimeout(settingsTimeout);
      });

    return () => {
      cancelled = true;
      window.clearTimeout(settingsTimeout);
    };
  }, [pathname, router, isPublic, configured, authRequired, user, authLoading, cloudSyncReady, isOnboarding]);

  if (isPublic) return <>{children}</>;
  const restoringCloud = authRequired && user && shouldAutoCloudSync() && !cloudSyncReady;
  if (!appReady || (authRequired && (authLoading || !user)) || restoringCloud) {
    return (
      <BrandLoader
        fullScreen
        label={restoringCloud ? copy.loading.finances : undefined}
      />
    );
  }

  return <>{children}</>;
}

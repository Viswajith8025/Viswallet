"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSettings, peekBootCache } from "@/lib/db";
import { useAuth } from "@/components/providers/auth-provider";
import { BrandLoader } from "@/components/brand/brand-loader";

const ALWAYS_PUBLIC_ROUTES = ["/auth", "/privacy", "/terms", "/licenses", "/about"];
const ONBOARDING_ROUTE = "/onboarding";
const SETTINGS_READY_TIMEOUT_MS = 6000;

function canRenderImmediately(pathname: string, configured: boolean): boolean {
  if (ALWAYS_PUBLIC_ROUTES.includes(pathname)) return true;
  if (!configured && pathname === ONBOARDING_ROUTE) return true;
  return Boolean(peekBootCache()?.onboardingComplete);
}

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { configured, user, loading: authLoading } = useAuth();
  const isOnboarding = pathname === ONBOARDING_ROUTE;
  const isPublic =
    ALWAYS_PUBLIC_ROUTES.includes(pathname) ||
    (!configured && isOnboarding);
  const initiallyReady = isPublic || canRenderImmediately(pathname, configured);
  const [appReady, setAppReady] = useState(initiallyReady);

  useEffect(() => {
    if (isPublic) return;

    if (configured && authLoading) return;

    if (configured && !user) {
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
  }, [pathname, router, isPublic, configured, user, authLoading, isOnboarding]);

  if (isPublic) return <>{children}</>;
  if (!appReady || (configured && (authLoading || !user))) {
    return <BrandLoader fullScreen />;
  }

  return <>{children}</>;
}

"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSettings, peekBootCache } from "@/lib/db";
import { useAuth } from "@/components/providers/auth-provider";
import { PageSkeleton } from "@/components/ui/skeleton";

const ALWAYS_PUBLIC_ROUTES = ["/auth", "/privacy", "/terms", "/licenses"];
const ONBOARDING_ROUTE = "/onboarding";

function canRenderImmediately(pathname: string, configured: boolean): boolean {
  if (ALWAYS_PUBLIC_ROUTES.includes(pathname)) return true;
  if (!configured && pathname === ONBOARDING_ROUTE) return true;
  return Boolean(peekBootCache()?.onboardingComplete);
}

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { configured, user, loading: authLoading, syncing } = useAuth();
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

    // Wait for cloud restore before deciding onboarding vs dashboard.
    if (configured && syncing) return;

    let cancelled = false;
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
      });

    return () => {
      cancelled = true;
    };
  }, [pathname, router, isPublic, configured, user, authLoading, syncing, isOnboarding]);

  if (isPublic) return <>{children}</>;
  if (!appReady || (configured && (authLoading || !user || syncing))) {
    return <PageSkeleton />;
  }

  return <>{children}</>;
}

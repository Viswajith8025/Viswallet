"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSettings } from "@/lib/db";
import { useAuth } from "@/components/providers/auth-provider";
import { PageSkeleton } from "@/components/ui/skeleton";

const ALWAYS_PUBLIC_ROUTES = ["/auth", "/privacy", "/terms", "/licenses"];

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { configured, user, loading: authLoading } = useAuth();
  const isPublic =
    ALWAYS_PUBLIC_ROUTES.includes(pathname) ||
    (!configured && pathname === "/onboarding");
  const [readyForPath, setReadyForPath] = useState<string | null>(isPublic ? pathname : null);

  useEffect(() => {
    if (isPublic) return;
    if (configured && authLoading) return;

    if (configured && !user) {
      router.replace("/auth");
      return;
    }

    let cancelled = false;
    getSettings()
      .then((s) => {
        if (cancelled) return;
        if (!s.onboardingComplete) {
          router.replace("/onboarding");
          return;
        }
        setReadyForPath(pathname);
      })
      .catch(() => {
        if (!cancelled) router.replace("/onboarding");
      });

    return () => {
      cancelled = true;
    };
  }, [pathname, router, isPublic, configured, user, authLoading]);

  if (isPublic) return <>{children}</>;
  if (configured && (authLoading || !user)) return <PageSkeleton />;
  if (readyForPath !== pathname) return <PageSkeleton />;

  return <>{children}</>;
}

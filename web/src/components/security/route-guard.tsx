"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSettings } from "@/lib/db";
import { PageSkeleton } from "@/components/ui/skeleton";

const PUBLIC_ROUTES = ["/onboarding"];

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isPublic = PUBLIC_ROUTES.includes(pathname);
  const [status, setStatus] = useState<"loading" | "allowed" | "redirecting">(
    isPublic ? "allowed" : "loading",
  );

  useEffect(() => {
    if (isPublic) return;

    let cancelled = false;
    getSettings()
      .then((s) => {
        if (cancelled) return;
        if (!s.onboardingComplete) {
          setStatus("redirecting");
          router.replace("/onboarding");
        } else {
          setStatus("allowed");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStatus("redirecting");
          router.replace("/onboarding");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [pathname, router, isPublic]);

  if (status !== "allowed") return <PageSkeleton />;
  return <>{children}</>;
}

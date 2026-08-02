"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { copy } from "@/lib/ux/copy";
import { BRAND_NAME } from "@/lib/brand/constants";
import { reportError } from "@/lib/monitoring/report";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportError(error, "root-global-error");
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans antialiased">
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
          <BrandLockup markSize={56} layout="vertical" showTagline />
          <div className="space-y-2">
            <h1 className="text-xl font-semibold tracking-tight">{copy.globalError.title(BRAND_NAME)}</h1>
            <p className="max-w-md text-sm text-muted-foreground">
              {copy.globalError.description}
            </p>
          </div>
          <div className="flex gap-3">
            <Button onClick={reset}>{copy.gates.globalError.retry}</Button>
            <Button variant="outline" onClick={() => (window.location.href = "/")}>
              {copy.gates.globalError.home}
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}

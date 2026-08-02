"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { copy } from "@/lib/ux/copy";
import { reportError } from "@/lib/monitoring/report";

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportError(error, "global-error");
  }, [error]);
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-destructive-muted text-destructive">
        <span className="text-2xl font-bold">!</span>
      </div>
      <div className="space-y-2">
        <h1 className="text-xl font-semibold tracking-tight">{copy.gates.globalError.title}</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          {copy.gates.globalError.description}
        </p>
      </div>
      <div className="flex gap-3">
        <Button onClick={reset}>{copy.gates.globalError.retry}</Button>
        <Button variant="outline" onClick={() => (window.location.href = "/")}>
          {copy.gates.globalError.home}
        </Button>
      </div>
    </div>
  );
}

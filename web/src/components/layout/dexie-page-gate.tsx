"use client";

import { Button } from "@/components/ui/button";
import { ErrorState, LoadingState } from "@/components/ui/page";

export function DexiePageGate({
  isPending,
  isError,
  onRetry,
  label = "Loading…",
  children,
}: {
  isPending: boolean;
  isError: boolean;
  onRetry?: () => void;
  label?: string;
  children: React.ReactNode;
}) {
  if (isPending) return <LoadingState label={label} />;
  if (isError) {
    return (
      <ErrorState
        description="We couldn't load your data. Check your connection and try again."
        action={
          onRetry ? (
            <Button variant="outline" onClick={() => onRetry()}>
              Retry
            </Button>
          ) : undefined
        }
      />
    );
  }
  return <>{children}</>;
}

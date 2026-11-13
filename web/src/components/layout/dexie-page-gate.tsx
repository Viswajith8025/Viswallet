"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/page";
import { PageEnter } from "@/components/ui/motion";
import { PageSkeleton, DelayedSkeleton } from "@/components/ui/skeleton";
import { copy } from "@/lib/ux/copy";

export function DexiePageGate({
  isPending,
  isError,
  onRetry,
  label,
  children,
}: {
  isPending: boolean;
  isError: boolean;
  onRetry?: () => void;
  label?: string;
  children: React.ReactNode;
}) {
  if (isPending) {
    return (
      <DelayedSkeleton>
        <div>
          {label && <span className="sr-only">{label}</span>}
          <PageSkeleton />
        </div>
      </DelayedSkeleton>
    );
  }
  if (isError) {
    return (
      <ErrorState
        title={copy.gates.dataError.title}
        description={copy.gates.dataError.description}
        action={
          onRetry ? (
            <Button variant="outline" onClick={() => onRetry()}>
              {copy.gates.dataError.retry}
            </Button>
          ) : undefined
        }
      />
    );
  }
  return <PageEnter>{children}</PageEnter>;
}

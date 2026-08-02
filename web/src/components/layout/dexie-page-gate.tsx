"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/page";
import { PageEnter } from "@/components/ui/motion";
import { BrandLoader } from "@/components/brand/brand-loader";

export function DexiePageGate({
  isPending,
  isError,
  onRetry,
  children,
}: {
  isPending: boolean;
  isError: boolean;
  onRetry?: () => void;
  label?: string;
  children: React.ReactNode;
}) {
  if (isPending) return <BrandLoader />;
  if (isError) {
    return (
      <ErrorState
        description="We couldn't load your data. Try again."
        action={
          onRetry ? (
            <Button variant="outline" onClick={() => onRetry()}>
              Try again
            </Button>
          ) : undefined
        }
      />
    );
  }
  return <PageEnter>{children}</PageEnter>;
}

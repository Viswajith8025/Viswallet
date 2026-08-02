"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/page";
import { PageEnter } from "@/components/ui/motion";
import { BrandLoader } from "@/components/brand/brand-loader";
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
  if (isPending) return <BrandLoader label={label} />;
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

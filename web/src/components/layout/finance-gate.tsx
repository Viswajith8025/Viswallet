"use client";

import type { FinanceSnapshot } from "@/lib/engines/finance-snapshot";
import { useFinanceSnapshot } from "@/lib/queries/use-finance";
import { DashboardSkeleton, PageSkeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/page";
import { PageEnter } from "@/components/ui/motion";
import { Button } from "@/components/ui/button";

export function FinanceGate({
  children,
  skeleton = "page",
}: {
  children: (data: FinanceSnapshot) => React.ReactNode;
  skeleton?: "dashboard" | "page";
}) {
  const { data, isLoading, isError, refetch } = useFinanceSnapshot();

  if (isLoading) {
    return skeleton === "dashboard" ? <DashboardSkeleton /> : <PageSkeleton />;
  }

  if (isError || !data) {
    return (
      <ErrorState
        title="Couldn't load your finances"
        description="Your data is stored locally. Try refreshing the page."
        action={
          <Button variant="outline" onClick={() => refetch()}>
            Try again
          </Button>
        }
      />
    );
  }

  return <PageEnter>{children(data)}</PageEnter>;
}

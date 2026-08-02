"use client";

import type { FinanceSnapshot } from "@/lib/engines/finance-snapshot";
import { useFinanceSnapshot } from "@/lib/queries/use-finance";
import { BrandLoader } from "@/components/brand/brand-loader";
import { DashboardSkeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/page";
import { PageEnter } from "@/components/ui/motion";
import { Button } from "@/components/ui/button";
import { copy } from "@/lib/ux/copy";
import { reportError } from "@/lib/monitoring/report";

export function FinanceGate({
  children,
  skeleton = "page",
}: {
  children: (data: FinanceSnapshot) => React.ReactNode;
  skeleton?: "dashboard" | "page";
}) {
  const { data, isLoading, isError, refetch } = useFinanceSnapshot();

  if (isLoading) {
    return skeleton === "dashboard" ? <DashboardSkeleton /> : <BrandLoader />;
  }

  if (isError || !data) {
    return (
      <ErrorState
        title={copy.gates.financesError.title}
        description={copy.gates.financesError.description}
        action={
          <Button variant="outline" onClick={() => refetch()}>
            {copy.gates.financesError.retry}
          </Button>
        }
      />
    );
  }

  return <PageEnter>{children(data)}</PageEnter>;
}

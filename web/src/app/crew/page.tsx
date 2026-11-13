"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { LentExperience } from "@/components/lent/lent-experience";
import { BorrowedExperience } from "@/components/borrowed/borrowed-experience";
import { EmptyState } from "@/components/ui/page";

function CrewBody() {
  const tab = useSearchParams().get("tab");
  if (tab === "lent") return <LentExperience />;
  if (tab === "borrowed") return <BorrowedExperience />;
  return (
    <EmptyState
      illustration="coin"
      title="Split with crew"
      description="A shared tab for who ordered what, and who has settled."
      action={null}
    />
  );
}

export default function CrewPage() {
  return (
    <Suspense fallback={null}>
      <CrewBody />
    </Suspense>
  );
}

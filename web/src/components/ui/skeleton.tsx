"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/design/cn";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("skeleton", className)} {...props} />;
}

export function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <Skeleton className="h-36 w-full rounded-[14px]" />
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton key={index} className="h-14 w-full rounded-[14px]" />
      ))}
      <Skeleton className="h-48 w-full rounded-[14px]" />
    </div>
  );
}

export function PageSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="mx-auto max-w-5xl space-y-3">
      <Skeleton className="h-8 w-40" />
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-14 w-full rounded-[14px]" />
      ))}
    </div>
  );
}

/** Wait 150ms so a fast load never flashes a skeleton. */
export function DelayedSkeleton({ children }: { children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setShow(true), 150);
    return () => clearTimeout(timer);
  }, []);
  if (!show) return null;
  return children;
}

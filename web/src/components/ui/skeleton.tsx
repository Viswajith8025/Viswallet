"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/design/cn";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("skeleton", className)} {...props} />;
}

function StaggerSkeleton({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.08 } },
      }}
    >
      {children}
    </motion.div>
  );
}

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 8 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
      }}
    >
      <Skeleton className={className} />
    </motion.div>
  );
}

export function DashboardSkeleton() {
  return (
    <StaggerSkeleton className="mx-auto max-w-7xl space-y-8">
      <div className="space-y-3">
        <SkeletonBlock className="h-4 w-24" />
        <SkeletonBlock className="h-9 w-64" />
        <SkeletonBlock className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid gap-4 lg:grid-cols-4">
        <SkeletonBlock className="h-36 lg:col-span-2 rounded-2xl" />
        <SkeletonBlock className="h-36 rounded-2xl" />
        <SkeletonBlock className="h-36 rounded-2xl" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <SkeletonBlock className="h-80 xl:col-span-2 rounded-2xl" />
        <SkeletonBlock className="h-80 rounded-2xl" />
      </div>
    </StaggerSkeleton>
  );
}

export function PageSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <StaggerSkeleton className="mx-auto max-w-5xl space-y-6">
      <div className="space-y-2">
        <SkeletonBlock className="h-4 w-20" />
        <SkeletonBlock className="h-8 w-48" />
      </div>
      <SkeletonBlock className="h-12 w-full max-w-md rounded-xl" />
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonBlock key={i} className="h-16 w-full rounded-xl" />
      ))}
    </StaggerSkeleton>
  );
}

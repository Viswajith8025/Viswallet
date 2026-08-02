"use client";

import { motion } from "framer-motion";
import { AlertCircle, Inbox } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/design/cn";
import { Icon } from "@/components/ui/icon";
import { EmptyIllustration } from "@/components/ui/empty-illustration";
import { FadeIn } from "@/components/ui/motion";
import { typography } from "@/lib/design/tokens";

export function PageContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("mx-auto max-w-5xl space-y-5 md:space-y-8", className)}>{children}</div>;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-3 border-b border-border/50 pb-4 sm:flex-row sm:items-end sm:justify-between sm:gap-4 sm:pb-6", className)}>
      <div className="min-w-0 space-y-0.5">
        {eyebrow && <p className={cn(typography.eyebrow, "hidden sm:block")}>{eyebrow}</p>}
        <h1 className={cn(typography.display, "text-xl sm:text-2xl text-foreground")}>{title}</h1>
        {description && <p className={cn(typography.body, "hidden max-w-xl text-muted-foreground sm:block")}>{description}</p>}
      </div>
      {actions && <div className="hidden shrink-0 flex-wrap gap-2 sm:flex">{actions}</div>}
    </div>
  );
}

const statTones = {
  default: "text-foreground",
  positive: "text-success",
  negative: "text-destructive",
  primary: "text-foreground",
  warning: "text-warning",
} as const;

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: keyof typeof statTones;
  icon?: React.ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-xl bg-surface-secondary/40 px-4 py-3.5 sm:px-5">
      <p className={cn(typography.caption, "text-muted-foreground")}>{label}</p>
      <p className={cn("mt-1 text-xl font-semibold tabular-nums tracking-tight sm:text-2xl", statTones[tone])}>
        {value}
      </p>
      {hint && <p className={cn(typography.caption, "mt-1 text-muted-foreground/75")}>{hint}</p>}
    </div>
  );
}

export function MetricStrip({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "surface-card grid gap-4 p-4 sm:grid-cols-2 sm:gap-5 sm:p-5 lg:grid-cols-4 lg:divide-x lg:divide-border/50 lg:gap-0",
        "[&>*]:lg:px-5 [&>*:first-child]:lg:pl-0 [&>*:last-child]:lg:pr-0",
        className,
      )}
    >
      {children}
    </div>
  );
}

type EmptyVariant = "wallet" | "transactions" | "goals" | "inbox";

export function EmptyState({
  title,
  description,
  action,
  icon: IconComponent = Inbox,
  illustration = "wallet",
  minimal = false,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: LucideIcon;
  illustration?: EmptyVariant;
  minimal?: boolean;
}) {
  if (minimal) {
    return (
      <FadeIn>
        <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
          <div className="mb-4 text-muted-foreground/40">
            {illustration ? (
              <EmptyIllustration variant={illustration} className="opacity-60" />
            ) : (
              <Icon icon={IconComponent} size="xl" className="opacity-50" />
            )}
          </div>
          <p className="text-sm text-muted-foreground">{title}</p>
          {description && (
            <p className={cn(typography.body, "mt-1 max-w-xs text-muted-foreground/80")}>{description}</p>
          )}
          {action && <div className="mt-6">{action}</div>}
        </div>
      </FadeIn>
    );
  }

  return (
    <FadeIn>
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface-secondary/80 px-6 py-20 text-center">
        {illustration ? (
          <EmptyIllustration variant={illustration} className="mb-5" />
        ) : (
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl border border-border-light bg-primary-muted/50 text-primary">
            <Icon icon={IconComponent} size="xl" className="opacity-70" />
          </div>
        )}
        <h3 className={typography.title}>{title}</h3>
        {description && (
          <p className={cn(typography.body, "mt-2 max-w-sm text-muted-foreground")}>{description}</p>
        )}
        {action && (
          <motion.div className="mt-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            {action}
          </motion.div>
        )}
      </div>
    </FadeIn>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description,
  action,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <FadeIn>
      <div className="flex flex-col items-center justify-center rounded-xl border border-destructive/20 bg-destructive-muted/50 px-6 py-16 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
          <Icon icon={AlertCircle} size="lg" />
        </div>
        <h3 className={typography.title}>{title}</h3>
        {description && <p className={cn(typography.body, "mt-2 max-w-md text-muted-foreground")}>{description}</p>}
        {action && <div className="mt-6">{action}</div>}
      </div>
    </FadeIn>
  );
}

export function SuccessBanner({ message }: { message: string }) {
  return (
    <motion.div
      className="flex items-center gap-3 rounded-xl border border-success/20 bg-success-muted px-4 py-3 text-sm text-success"
      initial={{ opacity: 0, y: -8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ type: "spring", stiffness: 380, damping: 26 }}
      role="status"
    >
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 20, delay: 0.05 }}
        className="flex h-6 w-6 items-center justify-center rounded-full bg-success/15"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
          <path d="M3 7 L6 10 L11 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </motion.span>
      <span>{message}</span>
    </motion.div>
  );
}

export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-2 w-2 rounded-full bg-primary"
            animate={{ opacity: [0.35, 1, 0.35], scale: [0.9, 1.1, 0.9] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.12 }}
          />
        ))}
      </div>
      <p className="text-sm text-muted-foreground animate-shimmer-pulse">{label}</p>
    </div>
  );
}

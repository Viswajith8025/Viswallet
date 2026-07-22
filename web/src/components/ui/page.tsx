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
  return <div className={cn("mx-auto max-w-7xl space-y-8", className)}>{children}</div>;
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
    <div className={cn("flex flex-wrap items-end justify-between gap-6", className)}>
      <div className="space-y-2">
        {eyebrow && <p className={cn(typography.eyebrow, "text-primary")}>{eyebrow}</p>}
        <h1 className={cn(typography.display, "text-foreground")}>{title}</h1>
        {description && <p className={cn(typography.body, "max-w-2xl text-muted-foreground")}>{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

const statTones = {
  default: "",
  positive: "text-success",
  negative: "text-destructive",
  primary: "text-primary",
  warning: "text-warning",
} as const;

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
  icon,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: keyof typeof statTones;
  icon?: React.ReactNode;
}) {
  return (
    <motion.div
      className="group surface-card p-5"
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
    >
      <div className="flex items-start justify-between gap-3">
        <p className={cn(typography.label, "text-muted-foreground")}>{label}</p>
        {icon && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/80 text-muted-foreground transition-colors duration-200 group-hover:bg-accent group-hover:text-primary">
            {icon}
          </div>
        )}
      </div>
      <p className={cn(typography.stat, "mt-3 tabular-nums", statTones[tone])}>{value}</p>
      {hint && <p className={cn(typography.caption, "mt-1.5 text-muted-foreground")}>{hint}</p>}
    </motion.div>
  );
}

type EmptyVariant = "wallet" | "transactions" | "goals" | "inbox";

export function EmptyState({
  title,
  description,
  action,
  icon: IconComponent = Inbox,
  illustration,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: LucideIcon;
  illustration?: EmptyVariant;
}) {
  return (
    <FadeIn>
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-gradient-to-b from-card/80 to-muted/30 px-6 py-20 text-center">
        {illustration ? (
          <EmptyIllustration variant={illustration} className="mb-5" />
        ) : (
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/80 text-muted-foreground">
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
      <div className="flex flex-col items-center justify-center rounded-2xl border border-destructive/20 bg-destructive-muted/50 px-6 py-16 text-center">
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

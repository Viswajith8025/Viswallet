"use client";

import { memo } from "react";
import { format } from "date-fns";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/money";
import type { Transaction } from "@/lib/db/types";
import { cn } from "@/lib/design/cn";
import { CategoryIconBadge } from "@/components/categories/category-icon-badge";
import { titlesEquivalent } from "@/lib/transactions/resolve-title";

export type TransactionRowProps = {
  transaction: Transaction;
  categoryName?: string;
  categoryColor?: string;
  categoryIconName?: string;
  showActions?: boolean;
  compact?: boolean;
  href?: string;
  onEdit?: (t: Transaction) => void;
  onDelete?: (id: number) => void;
};

export const TransactionRow = memo(function TransactionRow({
  transaction: t,
  categoryName,
  categoryColor,
  categoryIconName,
  showActions = false,
  compact = false,
  href,
  onEdit,
  onDelete,
}: TransactionRowProps) {
  const showCategoryLabel = categoryName && !titlesEquivalent(t.title, categoryName);
  const dateLabel = compact
    ? format(new Date(t.occurredAt), "dd MMM")
    : format(new Date(t.occurredAt), "dd MMM yyyy");
  const metaParts = [
    ...(showCategoryLabel ? [categoryName] : []),
    dateLabel,
    ...(compact ? [] : [t.paymentMethod]),
  ];

  const content = (
    <>
      <div className="flex min-w-0 items-center gap-3">
        <CategoryIconBadge
          size={compact ? "sm" : "md"}
          category={{
            iconName: categoryIconName ?? "circle-dot",
            color: categoryColor ?? "var(--primary)",
            name: categoryName ?? "?",
          }}
        />
        <div className="min-w-0">
          <p className="truncate text-[15px] font-medium tracking-[-0.01em]">{t.title}</p>
          <p className="text-xs text-muted-foreground/90">{metaParts.join(" · ")}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <span
          className={cn(
            "tabular-nums font-semibold",
            compact ? "text-sm" : "text-sm",
            t.kind === "income" ? "text-success" : "text-foreground",
          )}
        >
          {t.kind === "income" ? "+" : "−"}
          {formatINR(t.amountPaise)}
        </span>
        {showActions && (
          <>
            <Button
              size="icon"
              variant="ghost"
              className="opacity-100 sm:opacity-0 sm:group-focus-within:opacity-100 sm:transition-opacity sm:group-hover:opacity-100"
              onClick={() => onEdit?.(t)}
              aria-label={`Edit ${t.title}`}
            >
              <Pencil size={14} />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="opacity-100 sm:opacity-0 sm:group-focus-within:opacity-100 sm:transition-opacity sm:group-hover:opacity-100"
              onClick={() => t.id && onDelete?.(t.id)}
              aria-label={`Delete ${t.title}`}
            >
              <Trash2 size={14} className="text-destructive" />
            </Button>
          </>
        )}
      </div>
    </>
  );

  const className = cn(
    "group flex items-center justify-between gap-4 py-3.5 transition-colors duration-[var(--duration-fast)]",
    href && "hover:bg-surface-hover/60 -mx-2 rounded-xl px-2",
    showActions && "px-4 py-4 sm:px-5",
  );

  if (href) {
    return (
      <li className={className}>
        <Link href={href} className="flex w-full items-center justify-between gap-4">
          {content}
        </Link>
      </li>
    );
  }

  return <li className={cn(className, showActions && "group")}>{content}</li>;
});

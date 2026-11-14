"use client";

import { format } from "date-fns";
import { motion, useMotionValue, useReducedMotion } from "motion/react";
import type { Transaction } from "@/lib/db/types";
import { formatINR } from "@/lib/money";
import { cn } from "@/lib/design/cn";

export function SwipeTransactionRow({
  transaction,
  categoryName,
  onEdit,
  onDelete,
}: {
  transaction: Transaction;
  categoryName?: string;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: number) => void;
}) {
  const reduce = useReducedMotion();
  const x = useMotionValue(0);

  return (
    <div className="relative overflow-hidden border-b border-hairline">
      <div className="absolute inset-y-0 right-0 flex">
        <button
          type="button"
          className="flex h-full w-16 items-center justify-center bg-cobalt text-[12px] font-medium text-[#0D0D0B]"
          onClick={() => onEdit(transaction)}
        >
          Edit
        </button>
        <button
          type="button"
          className="flex h-full w-16 items-center justify-center bg-chili text-[12px] font-medium text-white"
          onClick={() => transaction.id && onDelete(transaction.id)}
        >
          Delete
        </button>
      </div>
      <motion.div
        className="relative flex min-h-14 items-center gap-3 bg-surface px-4"
        style={{ x }}
        drag={reduce ? false : "x"}
        dragConstraints={{ left: -128, right: 0 }}
        dragElastic={0.05}
      >
        <div className="min-w-0 flex-1">
          <p className="truncate font-body text-[15px] font-medium text-ink">{transaction.title}</p>
          <p className="font-mono text-[11px] text-ink-2">
            {categoryName ? `${categoryName} · ` : ""}
            {format(new Date(transaction.occurredAt), "d MMM")}
          </p>
        </div>
        <p className={cn("font-mono text-sm", transaction.kind === "income" ? "text-lime" : "text-chili")}>
          {transaction.kind === "income" ? "+" : "−"}
          {formatINR(transaction.amountPaise)}
        </p>
      </motion.div>
    </div>
  );
}

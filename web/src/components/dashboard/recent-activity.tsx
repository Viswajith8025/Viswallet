"use client";

import { formatDistanceToNow } from "date-fns";
import { Receipt } from "lucide-react";
import { motion, useMotionValue, useReducedMotion } from "motion/react";
import Link from "next/link";
import { AnimatedList } from "@/components/ui/animated-list";
import { toReceiptCategoryColor } from "@/lib/categories-default";
import { softDeleteTransaction } from "@/lib/db/integrity";
import { categoryMap, type FinanceSnapshot } from "@/lib/engines/finance-snapshot";
import { formatINR } from "@/lib/money";
import { useInvalidateFinance } from "@/hooks";
import { cn } from "@/lib/design/cn";
import { showToast } from "@/lib/store/toast-store";
import { useUIStore } from "@/lib/store/ui-store";

function ActivityRow({
  title,
  color,
  amountPaise,
  kind,
  when,
  editHref,
  onDelete,
}: {
  title: string;
  color: string;
  amountPaise: number;
  kind: "expense" | "income";
  when: string;
  editHref: string;
  onDelete: () => void;
}) {
  const reduce = useReducedMotion();
  const x = useMotionValue(0);

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-y-0 right-0 flex">
        <Link
          href={editHref}
          className="flex h-full w-16 items-center justify-center bg-cobalt text-[12px] font-medium text-[#0D0D0B]"
        >
          Edit
        </Link>
        <button
          type="button"
          className="flex h-full w-16 items-center justify-center bg-chili text-[12px] font-medium text-white"
          onClick={onDelete}
        >
          Delete
        </button>
      </div>
      <motion.div
        className="relative flex items-center gap-3 bg-surface py-3"
        style={{ x }}
        drag={reduce ? false : "x"}
        dragConstraints={{ left: -128, right: 0 }}
        dragElastic={0.05}
      >
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]"
          style={{ background: `${color}24` }}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-body text-[15px] font-medium text-ink">{title}</p>
          <p className="font-mono text-[11px] text-ink-2">{when}</p>
        </div>
        <p className={cn("font-mono text-sm", kind === "income" ? "text-lime" : "text-chili")}>
          {kind === "income" ? "+" : "−"}
          {formatINR(amountPaise)}
        </p>
      </motion.div>
    </div>
  );
}

export function RecentActivity({ data }: { data: FinanceSnapshot }) {
  const invalidate = useInvalidateFinance();
  const cats = categoryMap(data.categories);
  const rows = data.transactions.slice(0, 6);

  async function remove(id: number, title: string) {
    await softDeleteTransaction(id);
    showToast(`Deleted ${title}`, { tone: "info" });
    await invalidate();
  }

  if (rows.length === 0) {
    return (
      <section>
        <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-2">Recent</h2>
        <div className="flex flex-col items-start gap-3 rounded-[14px] border border-hairline bg-surface px-4 py-6">
          <Receipt size={20} className="text-ink-2" aria-hidden />
          <p className="font-body text-sm text-ink">Nothing logged yet this cycle</p>
          <button
            type="button"
            className="inline-flex h-11 items-center rounded-full bg-lime px-4 font-medium text-[#0D0D0B]"
            onClick={() => useUIStore.getState().setQuickAddOpen(true, "expense")}
          >
            Add expense
          </button>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-2">Recent</h2>
        <Link href="/transactions" className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink">
          All
        </Link>
      </div>
      <AnimatedList delay={70} className="items-stretch gap-0">
        {rows.map((row) => {
          const cat = cats.get(row.categoryId);
          return (
            <ActivityRow
              key={row.id}
              title={row.title}
              color={toReceiptCategoryColor(cat?.color, cat?.name ?? row.title)}
              amountPaise={row.amountPaise}
              kind={row.kind}
              when={formatDistanceToNow(new Date(row.occurredAt), { addSuffix: true })}
              editHref={row.id ? `/transactions?edit=${row.id}` : "/transactions"}
              onDelete={() => {
                if (row.id) void remove(row.id, row.title);
              }}
            />
          );
        })}
      </AnimatedList>
    </section>
  );
}

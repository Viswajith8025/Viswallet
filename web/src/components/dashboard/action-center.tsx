"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { formatINR } from "@/lib/money";
import { loadActionItems, type ActionItem } from "@/lib/dashboard/load-action-items";
import { snoozeActionItem } from "@/lib/dashboard/action-snooze";
import { markBorrowedFullyPaid, markLentFullyReturned } from "@/lib/loans/record-loan-payment";
import { markBillPaid } from "@/lib/obligations/mark-bill-paid";
import { markEmiPaid } from "@/lib/obligations/mark-emi-paid";
import { markSubscriptionRenewed } from "@/lib/obligations/mark-subscription-renewed";
import { useInvalidateFinance, useDexieTable } from "@/hooks";
import { copy, toastCopy } from "@/lib/ux/copy";
import { showToast } from "@/lib/store/toast-store";

function ReceiptCard({
  item,
  busy,
  onSettle,
  onRemind,
}: {
  item: ActionItem;
  busy: boolean;
  onSettle: (item: ActionItem) => void;
  onRemind: (item: ActionItem) => void;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.li
      className="w-[240px] shrink-0 snap-start"
      drag={reduce ? false : "y"}
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.2}
      onDragEnd={(_, info) => {
        if (info.offset.y < -48) onRemind(item);
      }}
    >
      <article
        className="flex h-full flex-col justify-between rounded-[14px] border border-hairline bg-surface p-4"
        style={{
          maskImage:
            "linear-gradient(#000 0 calc(100% - 10px), transparent calc(100% - 10px)), radial-gradient(circle at 8px 100%, transparent 7px, #000 7.5px)",
          maskSize: "100% 100%, 16px 10px",
          maskRepeat: "no-repeat, repeat-x",
          maskPosition: "top, bottom",
          WebkitMaskImage:
            "linear-gradient(#000 0 calc(100% - 10px), transparent calc(100% - 10px)), radial-gradient(circle at 8px 100%, transparent 7px, #000 7.5px)",
          WebkitMaskSize: "100% 100%, 16px 10px",
          WebkitMaskRepeat: "no-repeat, repeat-x",
          WebkitMaskPosition: "top, bottom",
        }}
      >
        <div>
          <p className="font-body text-[15px] font-medium text-ink">{item.title}</p>
          {item.subtitle && <p className="mt-1 font-mono text-[11px] text-ink-2">{item.subtitle}</p>}
          <p className="mt-3 font-mono text-lg text-ink">{formatINR(item.amountPaise)}</p>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            className="h-11 flex-1 rounded-full border border-hairline font-mono text-[11px] uppercase tracking-[0.08em] text-ink"
            onClick={() => onRemind(item)}
          >
            Remind
          </button>
          <button
            type="button"
            className="h-11 flex-1 rounded-full bg-lime font-mono text-[11px] uppercase tracking-[0.08em] text-[#0D0D0B] disabled:opacity-50"
            disabled={busy}
            onClick={() => onSettle(item)}
          >
            Settled
          </button>
        </div>
      </article>
    </motion.li>
  );
}

export function ActionCenter() {
  const invalidate = useInvalidateFinance();
  const { data: items = [], isPending } = useDexieTable("action-items", loadActionItems);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(() => new Set());
  const visibleItems = useMemo(
    () => items.filter((item) => !hiddenIds.has(item.id)).slice(0, 8),
    [items, hiddenIds],
  );

  function handleRemind(item: ActionItem) {
    snoozeActionItem(item.id);
    setHiddenIds((prev) => new Set(prev).add(item.id));
    showToast(copy.toast.remindTomorrow, { tone: "info" });
  }

  async function handleSettle(item: ActionItem) {
    setBusyId(item.id);
    try {
      if (item.kind === "borrowed") {
        await markBorrowedFullyPaid(item.entityId);
        showToast(toastCopy.paid(item.amountPaise), { tone: "success" });
      } else if (item.kind === "lent") {
        await markLentFullyReturned(item.entityId);
        showToast(toastCopy.received(item.amountPaise), { tone: "success" });
      } else if (item.kind === "bill") {
        await markBillPaid(item.entityId);
        showToast(copy.toast.billPaidNamed(item.title), { tone: "success" });
      } else if (item.kind === "emi") {
        await markEmiPaid(item.entityId);
        showToast(copy.toast.emiPaidNamed(item.title), { tone: "success" });
      } else {
        await markSubscriptionRenewed(item.entityId);
        showToast(copy.toast.renewedNamed(item.title), { tone: "success" });
      }
      await invalidate();
    } catch (err) {
      showToast(err instanceof Error ? err.message : copy.toast.actionFailed, { tone: "error" });
    } finally {
      setBusyId(null);
    }
  }

  if (isPending || visibleItems.length === 0) return null;

  return (
    <section aria-label="Up next">
      <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-2">Up next</h2>
      <ul className="flex snap-x gap-3 overflow-x-auto pb-2">
        {visibleItems.map((item) => (
          <ReceiptCard
            key={item.id}
            item={item}
            busy={busyId === item.id}
            onSettle={handleSettle}
            onRemind={handleRemind}
          />
        ))}
      </ul>
    </section>
  );
}

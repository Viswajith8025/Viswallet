"use client";

import { useRef } from "react";
import { Plus } from "lucide-react";
import { useUIStore } from "@/lib/store/ui-store";
import { copy } from "@/lib/ux/copy";
import { shell } from "@/lib/design/tokens";
import { showToast } from "@/lib/store/toast-store";

export function MobileFab() {
  const setQuickAddOpen = useUIStore((s) => s.setQuickAddOpen);
  const quickAddOpen = useUIStore((s) => s.quickAddOpen);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressRef = useRef(false);
  const skipClickRef = useRef(false);

  if (quickAddOpen) return null;

  function clearHoldTimer() {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  }

  function handlePointerDown() {
    longPressRef.current = false;
    clearHoldTimer();
    holdTimerRef.current = setTimeout(() => {
      longPressRef.current = true;
    }, 450);
  }

  function handlePointerUp() {
    clearHoldTimer();
    if (longPressRef.current) {
      longPressRef.current = false;
      skipClickRef.current = true;
      setQuickAddOpen(true, "income");
      showToast(copy.toast.quickAddIncomeMode, { tone: "info" });
    }
  }

  function handleClick() {
    if (skipClickRef.current) {
      skipClickRef.current = false;
      return;
    }
    setQuickAddOpen(true, "expense");
  }

  return (
    <button
      type="button"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={() => {
        clearHoldTimer();
        longPressRef.current = false;
      }}
      onClick={handleClick}
      className="fixed right-4 z-30 flex h-12 w-12 min-h-11 min-w-11 items-center justify-center rounded-full bg-[var(--violet)] text-[var(--cream-elevated)] shadow-glow transition-[transform,box-shadow] duration-[var(--duration-normal)] ease-[var(--ease-out-expo)] active:scale-[0.96] dark:bg-[var(--cream)] dark:text-[var(--violet-deep)] lg:hidden"
      style={{ bottom: shell.fabBottom }}
      aria-label="Add expense. Hold for income."
    >
      <Plus size={24} strokeWidth={2.5} />
    </button>
  );
}

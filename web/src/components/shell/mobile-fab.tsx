"use client";

import { Plus } from "lucide-react";
import { useUIStore } from "@/lib/store/ui-store";
import { usePathname } from "next/navigation";

export function MobileFab() {
  const pathname = usePathname();
  const setQuickAddOpen = useUIStore((s) => s.setQuickAddOpen);
  const quickAddOpen = useUIStore((s) => s.quickAddOpen);

  if (quickAddOpen || pathname === "/transactions") return null;

  return (
    <button
      type="button"
      onClick={() => setQuickAddOpen(true, "expense")}
      className="fixed bottom-[calc(4.25rem+env(safe-area-inset-bottom)+0.5rem)] right-4 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-transform active:scale-95 lg:hidden"
      aria-label="Add expense or income"
    >
      <Plus size={24} strokeWidth={2.5} />
    </button>
  );
}

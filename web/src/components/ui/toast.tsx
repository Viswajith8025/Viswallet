"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Undo2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useToastStore } from "@/lib/store/toast-store";
import { toastVariants } from "@/lib/design/variants";
import { cn } from "@/lib/design/cn";

export function ToastHost() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div className="pointer-events-none fixed bottom-24 left-0 right-0 z-[110] flex flex-col items-center gap-2 px-4 md:bottom-6 md:items-end md:pr-6">
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 16, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className={cn(
              toastVariants.base,
              toastVariants.tone[t.tone ?? "default"],
            )}
            role="status"
          >
            <span className="flex-1">{t.message}</span>
            {t.action && (
              <Button
                size="sm"
                variant="ghost"
                className="h-8 shrink-0"
                onClick={async () => {
                  await t.action?.onClick();
                  dismiss(t.id);
                }}
              >
                {t.action.label}
              </Button>
            )}
            {t.undo && (
              <Button
                size="sm"
                variant="ghost"
                className="h-8 shrink-0 gap-1"
                onClick={async () => {
                  await t.undo?.();
                  dismiss(t.id);
                }}
              >
                <Icon icon={Undo2} size="xs" />
                Undo
              </Button>
            )}
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 shrink-0"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss"
            >
              <Icon icon={X} size="xs" />
            </Button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

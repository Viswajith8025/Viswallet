"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/design/cn";
import { dialogVariants } from "@/lib/design/variants";

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const panelTransition = { duration: 0.25, ease: [0.16, 1, 0.3, 1] as const };

function useBodyPortal() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

function useDialogEffects(open: boolean, onClose: () => void) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const panel = panelRef.current;
    if (panel) {
      const focusable = panel.querySelector<HTMLElement>(
        "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
      );
      focusable?.focus();
    }

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  return panelRef;
}

export function Dialog({
  open,
  onClose,
  children,
  className,
  labelledBy,
  size = "md",
  layer = "base",
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  labelledBy?: string;
  size?: "sm" | "md" | "lg";
  /** `overlay` stacks above other modals (e.g. category picker inside quick add). */
  layer?: "base" | "overlay";
}) {
  const mounted = useBodyPortal();
  const reducedMotion = useReducedMotion();
  const panelRef = useDialogEffects(open, onClose);
  const maxWidth = size === "sm" ? "max-w-md" : size === "lg" ? "max-w-2xl" : "max-w-lg";
  const zClass = layer === "overlay" ? "z-[110]" : "z-[100]";

  const node = (
    <AnimatePresence>
      {open && (
        <div className={cn("fixed inset-0 flex items-end justify-center p-4 sm:items-center sm:p-6", zClass)}>
          <motion.button
            type="button"
            aria-label="Close dialog"
            className={dialogVariants.overlay}
            variants={overlayVariants}
            initial={reducedMotion ? false : "hidden"}
            animate="visible"
            exit={reducedMotion ? undefined : "hidden"}
            transition={{ duration: reducedMotion ? 0 : 0.2 }}
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelledBy}
            className={cn(dialogVariants.panel, dialogVariants.panelCentered, maxWidth, className)}
            initial={reducedMotion ? false : { opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reducedMotion ? undefined : { opacity: 0, scale: 0.98, y: 4 }}
            transition={reducedMotion ? { duration: 0 } : panelTransition}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;
  return createPortal(node, document.body);
}

export function Sheet({
  open,
  onClose,
  children,
  className,
  labelledBy,
  fullScreen = false,
  layer = "base",
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  labelledBy?: string;
  fullScreen?: boolean;
  layer?: "base" | "overlay";
}) {
  const mounted = useBodyPortal();
  const reducedMotion = useReducedMotion();
  const panelRef = useDialogEffects(open, onClose);
  const zClass = layer === "overlay" ? "z-[110]" : "z-[100]";

  const node = (
    <AnimatePresence>
      {open && (
        <div className={cn("fixed inset-0 flex items-end justify-center", zClass)}>
          <motion.button
            type="button"
            aria-label="Close"
            className={dialogVariants.overlay}
            initial={reducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reducedMotion ? undefined : { opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelledBy}
            className={cn(
              dialogVariants.panel,
              dialogVariants.panelSheet,
              fullScreen ? "h-[100dvh] max-h-[100dvh] rounded-none" : "w-full",
              className,
            )}
            initial={reducedMotion ? false : { y: "100%" }}
            animate={{ y: 0 }}
            exit={reducedMotion ? undefined : { y: "100%" }}
            transition={reducedMotion ? { duration: 0 } : { type: "spring", damping: 28, stiffness: 320 }}
          >
            {!fullScreen && <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-border sm:hidden" />}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;
  return createPortal(node, document.body);
}

export function DialogBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn(dialogVariants.body, className)} {...props} />;
}

export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex justify-end gap-2 border-t border-border px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-4", className)}
      {...props}
    />
  );
}

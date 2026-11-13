"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useReducedMotion, useMotionValue, useDragControls, animate } from "motion/react";
import { cn } from "@/lib/design/cn";
import { dialogVariants } from "@/lib/design/variants";

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const panelTransition = { duration: 0.25, ease: [0.16, 1, 0.3, 1] as const };

function useIsMobileSheet() {
  return useSyncExternalStore(
    (onStoreChange) => {
      const query = window.matchMedia("(max-width: 1023px)");
      query.addEventListener("change", onStoreChange);
      return () => query.removeEventListener("change", onStoreChange);
    },
    () => window.matchMedia("(max-width: 1023px)").matches,
    () => false,
  );
}

function useKeyboardInset(active: boolean) {
  const [inset, setInset] = useState(0);
  const [height, setHeight] = useState<number | null>(null);

  useEffect(() => {
    if (!active) return;
    const viewport = window.visualViewport;
    if (!viewport) return;
    const update = () => {
      const overlap = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
      setInset(overlap);
      setHeight(viewport.height);
    };
    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
    };
  }, [active]);

  return { inset, height };
}

function useBodyPortal() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

function useDialogEffects(
  open: boolean,
  onClose: () => void,
  options?: { stealFocus?: boolean },
) {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);
  const stealFocus = options?.stealFocus ?? true;
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (!open) {
      wasOpenRef.current = false;
      return;
    }

    const justOpened = !wasOpenRef.current;
    wasOpenRef.current = true;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    if (justOpened && stealFocus) {
      const panel = panelRef.current;
      if (panel) {
        const focusable = panel.querySelector<HTMLElement>(
          "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
        );
        focusable?.focus();
      }
    }

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, stealFocus]);

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
  sheetOnMobile = true,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  labelledBy?: string;
  size?: "sm" | "md" | "lg";
  /** `overlay` stacks above other modals (e.g. category picker inside quick add). */
  layer?: "base" | "overlay";
  /** Forms drop to a sheet under lg. Confirmations stay centred. */
  sheetOnMobile?: boolean;
}) {
  const mobileSheet = useIsMobileSheet();
  if (sheetOnMobile && mobileSheet) {
    return (
      <Sheet open={open} onClose={onClose} className={className} labelledBy={labelledBy} layer={layer}>
        {children}
      </Sheet>
    );
  }
  return (
    <DesktopDialog
      open={open}
      onClose={onClose}
      className={className}
      labelledBy={labelledBy}
      size={size}
      layer={layer}
    >
      {children}
    </DesktopDialog>
  );
}

function DesktopDialog({
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
  layer?: "base" | "overlay";
}) {
  const mounted = useBodyPortal();
  const reducedMotion = useReducedMotion();
  const panelRef = useDialogEffects(open, onClose);
  const maxWidth = "max-w-[520px]";
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
            className={cn(dialogVariants.panel, dialogVariants.panelCentered, maxWidth, "rounded-[14px]", className)}
            data-size={size}
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
  stealFocus = true,
  layer = "base",
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  labelledBy?: string;
  fullScreen?: boolean;
  /** When false, focus is not moved on open (keeps mobile keyboard on inputs). */
  stealFocus?: boolean;
  layer?: "base" | "overlay";
}) {
  const mounted = useBodyPortal();
  const reducedMotion = useReducedMotion();
  const panelRef = useDialogEffects(open, onClose, { stealFocus });
  const zClass = layer === "overlay" ? "z-[110]" : "z-[100]";
  const y = useMotionValue(0);
  const dragControls = useDragControls();
  const { inset, height } = useKeyboardInset(open && !fullScreen);

  useEffect(() => {
    if (!open || fullScreen) return;
    y.set(window.innerHeight);
    const animation = animate(
      y,
      0,
      reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 38 },
    );
    return () => animation.stop();
  }, [open, fullScreen, reducedMotion, y]);

  function requestClose() {
    if (fullScreen || reducedMotion) {
      onClose();
      return;
    }
    void animate(y, window.innerHeight, { type: "spring", stiffness: 500, damping: 42 }).then(() => onClose());
  }

  function onDragEnd(_: PointerEvent, info: { offset: { y: number }; velocity: { y: number } }) {
    const travel = Math.round(window.innerHeight * 0.35);
    const current = y.get();
    if (info.velocity.y > 900 || current > travel + 72) {
      void animate(y, window.innerHeight, {
        type: "spring",
        stiffness: 500,
        damping: 42,
        velocity: info.velocity.y,
      }).then(() => onClose());
      return;
    }
    const target = current > travel / 2 ? travel : 0;
    void animate(y, target, {
      type: "spring",
      stiffness: 420,
      damping: 38,
      velocity: info.velocity.y,
    });
  }

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
            onClick={requestClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelledBy}
            drag={fullScreen ? false : "y"}
            dragControls={dragControls}
            dragListener={false}
            dragMomentum={false}
            dragConstraints={{ top: 0, bottom: 1600 }}
            dragElastic={{ top: 0.05, bottom: 0.12 }}
            style={
              fullScreen
                ? undefined
                : {
                    y,
                    height: height ? Math.min(height * 0.95, window.innerHeight * 0.95) : "95dvh",
                    paddingBottom: inset,
                  }
            }
            onDragEnd={fullScreen ? undefined : onDragEnd}
            className={cn(
              dialogVariants.panel,
              "rounded-t-[20px]",
              fullScreen
                ? "fixed inset-0 z-10 h-full max-h-none w-full overflow-hidden rounded-none border-0"
                : "flex w-full flex-col overflow-hidden",
              className,
            )}
            initial={reducedMotion || !fullScreen ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reducedMotion ? undefined : { opacity: 0 }}
            transition={reducedMotion ? { duration: 0 } : { duration: 0.16 }}
          >
            {!fullScreen && (
              <div
                className="flex shrink-0 cursor-grab touch-none justify-center py-3 active:cursor-grabbing"
                onPointerDown={(event) => dragControls.start(event)}
                aria-hidden
              >
                <div className="h-1 w-10 rounded-full bg-hairline-strong" />
              </div>
            )}
            {fullScreen ? (
              children
            ) : (
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
            )}
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
      className={cn(
        "sticky bottom-0 flex justify-end gap-2 border-t border-hairline bg-raised px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]",
        className,
      )}
      {...props}
    />
  );
}


"use client";

import { Download, Share, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { usePwaInstall } from "@/hooks/use-pwa-install";

export function InstallPrompt() {
  const pathname = usePathname();
  const { visible, canInstall, ios, installing, install, dismiss } = usePwaInstall();

  if (pathname === "/onboarding" || pathname === "/auth") return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="dialog"
          aria-labelledby="pwa-install-title"
          aria-describedby="pwa-install-desc"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-x-0 bottom-[calc(3.75rem+env(safe-area-inset-bottom))] z-[90] px-4 md:bottom-6 md:left-auto md:right-6 md:max-w-sm md:px-0"
        >
          <div className="surface-card border border-primary/15 p-4 shadow-glow">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <span className="text-sm font-semibold">V</span>
              </div>
              <div className="min-w-0 flex-1">
                <p id="pwa-install-title" className="text-sm font-semibold text-foreground">
                  Install Viswallet
                </p>
                <p id="pwa-install-desc" className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {ios
                    ? "Add Viswallet to your Home Screen for quick access."
                    : "Install for a faster, full-screen experience on your phone."}
                </p>
                {ios && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-primary">
                    <Share size={13} aria-hidden />
                    Tap Share → Add to Home Screen
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={dismiss}
                className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
                aria-label="Dismiss install prompt"
              >
                <X size={16} />
              </button>
            </div>
            <div className="mt-4 flex gap-2">
              {canInstall && (
                <Button
                  size="sm"
                  className="min-h-10 flex-1 gap-1.5"
                  disabled={installing}
                  onClick={() => void install()}
                >
                  <Download size={15} />
                  {installing ? "Installing…" : "Install app"}
                </Button>
              )}
              <Button
                size="sm"
                variant={canInstall ? "outline" : "primary"}
                className="min-h-10 flex-1"
                onClick={dismiss}
              >
                {canInstall ? "Not now" : "Got it"}
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

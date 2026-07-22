"use client";

import { useCallback, useEffect, useState } from "react";

const DISMISS_KEY = "viswallet_pwa_dismissed_at";
const DISMISS_DAYS = 7;

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  if (typeof window === "undefined") return false;
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function isDismissed(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const dismissedAt = Number(raw);
    if (Number.isNaN(dismissedAt)) return false;
    return Date.now() - dismissedAt < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [installing, setInstalling] = useState(false);
  const ios = isIos();
  const standalone = isStandalone();

  useEffect(() => {
    if (standalone || isDismissed()) return;

    function onBeforeInstall(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      window.setTimeout(() => setVisible(true), 2500);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    if (ios && !standalone) {
      window.setTimeout(() => setVisible(true), 4000);
    }

    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, [ios, standalone]);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
    setVisible(false);
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) return false;
    setInstalling(true);
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setVisible(false);
        return true;
      }
      return false;
    } finally {
      setInstalling(false);
      setDeferredPrompt(null);
    }
  }, [deferredPrompt]);

  return {
    visible: visible && !standalone,
    canInstall: Boolean(deferredPrompt),
    ios,
    installing,
    install,
    dismiss,
  };
}

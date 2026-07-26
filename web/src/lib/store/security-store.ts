"use client";

import { create } from "zustand";
import { isSessionValid, extendSession, clearSession } from "@/lib/security/session";
import { getSettings, readSettingsCache } from "@/lib/db";
import { lockApp } from "@/lib/security/pin";

interface SecurityState {
  unlocked: boolean;
  appLockEnabled: boolean;
  autoLockMinutes: number;
  initialized: boolean;
  init: () => Promise<void>;
  setUnlocked: (value: boolean) => void;
  touchActivity: () => void;
  lock: () => Promise<void>;
}

export const useSecurityStore = create<SecurityState>((set, get) => ({
  unlocked: false,
  appLockEnabled: false,
  autoLockMinutes: 15,
  initialized: false,

  init: async () => {
    const s = readSettingsCache() ?? (await getSettings());
    const enabled = s.appLockEnabled && Boolean(s.pinHash);
    const valid = !enabled || isSessionValid();
    set({
      appLockEnabled: enabled,
      autoLockMinutes: s.autoLockMinutes ?? 15,
      unlocked: valid,
      initialized: true,
    });
  },

  setUnlocked: (value) => set({ unlocked: value }),

  touchActivity: () => {
    const { appLockEnabled, autoLockMinutes, unlocked } = get();
    if (appLockEnabled && unlocked) {
      extendSession(autoLockMinutes);
    }
  },

  lock: async () => {
    await lockApp();
    set({ unlocked: false });
  },
}));

/** Activity listener — call once in app shell. */
export function setupActivityMonitor(): () => void {
  const events = ["mousedown", "keydown", "touchstart", "scroll"] as const;
  const handler = () => useSecurityStore.getState().touchActivity();
  events.forEach((e) => window.addEventListener(e, handler, { passive: true }));
  return () => events.forEach((e) => window.removeEventListener(e, handler));
}

/** Auto-lock when session expires. */
export function setupSessionWatcher(): () => void {
  const id = window.setInterval(() => {
    const { appLockEnabled, unlocked } = useSecurityStore.getState();
    if (appLockEnabled && unlocked && !isSessionValid()) {
      clearSession();
      useSecurityStore.setState({ unlocked: false });
    }
  }, 30_000);
  return () => clearInterval(id);
}

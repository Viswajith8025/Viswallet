"use client";

/**
 * Press scale for a control. Success vibration lives in `vibrateSuccess`
 * and runs only on Android when Haptics is on.
 */
export function usePressFeedback() {
  return {
    className:
      "touch-manipulation select-none transition-transform duration-[120ms] ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97]",
  } as const;
}

export { vibrateSuccess } from "@/lib/ux/feedback";

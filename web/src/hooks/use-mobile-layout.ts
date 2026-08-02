"use client";

import { useSyncExternalStore } from "react";

/** Tailwind `lg` — phones and tablets use mobile shell; desktop layout from 1024px+. */
export const MOBILE_LAYOUT_MAX_PX = 1023;

const QUERY = `(max-width: ${MOBILE_LAYOUT_MAX_PX}px)`;

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function getSnapshot() {
  return window.matchMedia(QUERY).matches;
}

function getServerSnapshot() {
  return true;
}

export function useMobileLayout() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

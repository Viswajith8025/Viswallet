import { ensureDbSeeded } from "./client";

let started = false;

/** Start IndexedDB seeding as early as possible — safe to call many times. */
export function kickstartDb(): void {
  if (started || typeof window === "undefined") return;
  started = true;
  void ensureDbSeeded();
}

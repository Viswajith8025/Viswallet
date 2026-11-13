/** Optional tactile feedback. Success is one short pulse, Android only, and only when Haptics is on. */

let hapticsOn = true;

export function setHapticsEnabled(on: boolean) {
  hapticsOn = on;
}

function canVibrate(): boolean {
  if (!hapticsOn) return false;
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return false;
  if (!/Android/i.test(navigator.userAgent)) return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  return true;
}

export function vibrateSuccess(): void {
  if (canVibrate()) navigator.vibrate(8);
}

/** Light tap — buttons, toggles */
export function tapFeedback(): void {
  vibrateSuccess();
}

/** Success — save, settle, goal hit */
export function successFeedback(): void {
  vibrateSuccess();
}

/** Error — validation fail, destructive confirm */
export function errorFeedback(): void {
  if (canVibrate()) navigator.vibrate(8);
}

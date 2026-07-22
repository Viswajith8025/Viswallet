/** Optional tactile feedback — respects reduced motion and missing APIs. */

function canVibrate(): boolean {
  if (typeof navigator === "undefined") return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  return typeof navigator.vibrate === "function";
}

/** Light tap — buttons, toggles */
export function tapFeedback(): void {
  if (canVibrate()) navigator.vibrate(8);
}

/** Success — save, complete */
export function successFeedback(): void {
  if (canVibrate()) navigator.vibrate([12, 40, 12]);
}

/** Error — validation fail, destructive confirm */
export function errorFeedback(): void {
  if (canVibrate()) navigator.vibrate([20, 30, 20, 30, 20]);
}

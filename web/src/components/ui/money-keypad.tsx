"use client";

import { cn } from "@/lib/design/cn";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "⌫"] as const;

export function applyKeypadKey(current: string, key: string): string {
  if (key === "⌫") return current.slice(0, -1);
  if (key === ".") {
    if (current.includes(".")) return current;
    return `${current || "0"}.`;
  }
  const [whole, frac] = current.split(".");
  if (frac != null && frac.length >= 2) return current;
  if (whole === "0" && frac == null) return key;
  return current + key;
}

export function MoneyKeypad({
  onKey,
}: {
  onKey: (key: string) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2" role="group" aria-label="Amount keypad">
      {KEYS.map((key) => (
        <button
          key={key}
          type="button"
          className={cn(
            "h-16 rounded-[14px] border border-hairline bg-surface font-mono text-xl text-ink",
            "motion-safe:transition-transform motion-safe:duration-100 motion-safe:active:scale-[0.94]",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime",
          )}
          aria-label={key === "⌫" ? "Delete digit" : key}
          onPointerDown={() => {
            if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
              navigator.vibrate(8);
            }
          }}
          onClick={() => onKey(key)}
        >
          {key}
        </button>
      ))}
    </div>
  );
}

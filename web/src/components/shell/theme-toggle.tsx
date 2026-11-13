"use client";

import { Moon, Sun } from "lucide-react";
import { useCallback, useSyncExternalStore } from "react";
import { updateSettings, peekBootCache } from "@/lib/db";
import { applyThemeMode, type ResolvedTheme, type ThemeMode } from "@/lib/theme/resolve";
import { cn } from "@/lib/design/cn";

const CYCLE: ThemeMode[] = ["dark", "light", "system"];
const listeners = new Set<() => void>();

function readMode(): ThemeMode {
  const attr = document.documentElement.getAttribute("data-theme-mode");
  if (attr === "dark" || attr === "light" || attr === "system") return attr;
  const boot = peekBootCache()?.themeMode;
  if (boot === "dark" || boot === "light" || boot === "system") return boot;
  return "dark";
}

function readResolved(): ResolvedTheme {
  const attr = document.documentElement.getAttribute("data-theme");
  return attr === "light" ? "light" : "dark";
}

function snapshot(): string {
  return `${readMode()}:${readResolved()}`;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const onMedia = () => {
    if (readMode() === "system") applyThemeMode("system");
    listener();
  };
  media.addEventListener("change", onMedia);
  return () => {
    listeners.delete(listener);
    media.removeEventListener("change", onMedia);
  };
}

function emit(): void {
  listeners.forEach((listener) => listener());
}

export function ThemeToggle() {
  const value = useSyncExternalStore(subscribe, snapshot, () => "dark:dark");
  const [mode, resolved] = value.split(":") as [ThemeMode, ResolvedTheme];

  const toggle = useCallback(async () => {
    const next = CYCLE[(CYCLE.indexOf(mode) + 1) % CYCLE.length] ?? "dark";
    applyThemeMode(next);
    emit();
    await updateSettings({ themeMode: next });
  }, [mode]);

  const next = CYCLE[(CYCLE.indexOf(mode) + 1) % CYCLE.length];
  const showingLight = resolved === "light";

  return (
    <button
      type="button"
      onClick={() => void toggle()}
      className="tap flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-ink-2 hover:text-ink"
      aria-label={`Theme is ${mode}. Switch to ${next}.`}
      title={`Theme: ${mode}`}
    >
      <span className="relative h-4 w-4">
        <Sun
          size={16}
          strokeWidth={1.75}
          className={cn(
            "absolute inset-0 transition-opacity duration-[160ms]",
            showingLight ? "opacity-100" : "opacity-0",
          )}
        />
        <Moon
          size={16}
          strokeWidth={1.75}
          className={cn(
            "absolute inset-0 transition-opacity duration-[160ms]",
            showingLight ? "opacity-0" : "opacity-100",
          )}
        />
      </span>
    </button>
  );
}

"use client";

import { Moon, Sun } from "lucide-react";
import { useCallback, useSyncExternalStore } from "react";
import { updateSettings } from "@/lib/db";
import { readThemeMode, subscribeTheme, writeThemeMode } from "@/lib/theme/preference";
import { applyThemeMode, type ResolvedTheme, type ThemeMode } from "@/lib/theme/resolve";
import { cn } from "@/lib/design/cn";

const CYCLE: ThemeMode[] = ["dark", "light", "system"];

function readResolved(): ResolvedTheme {
  const attr = document.documentElement.getAttribute("data-theme");
  return attr === "light" ? "light" : "dark";
}

function snapshot(): string {
  return `${readThemeMode()}:${readResolved()}`;
}

function subscribe(listener: () => void): () => void {
  const unsubscribe = subscribeTheme(listener);
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const onMedia = () => {
    if (readThemeMode() === "system") applyThemeMode("system");
    listener();
  };
  media.addEventListener("change", onMedia);
  return () => {
    unsubscribe();
    media.removeEventListener("change", onMedia);
  };
}

export function ThemeToggle() {
  const value = useSyncExternalStore(subscribe, snapshot, () => "dark:dark");
  const [mode, resolved] = value.split(":") as [ThemeMode, ResolvedTheme];

  const toggle = useCallback(async () => {
    const next = CYCLE[(CYCLE.indexOf(mode) + 1) % CYCLE.length] ?? "dark";
    writeThemeMode(next);
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

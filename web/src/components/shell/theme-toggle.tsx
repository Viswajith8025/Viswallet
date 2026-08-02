"use client";

import { Moon, Sun } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { updateSettings, peekBootCache } from "@/lib/db";
import { applyAccentColor } from "@/lib/theme/accent";
import { applyThemeMode, type ResolvedTheme } from "@/lib/theme/resolve";

function readResolvedTheme(): ResolvedTheme {
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === "dark" || attr === "light") return attr;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeToggle() {
  const [resolved, setResolved] = useState<ResolvedTheme>("light");

  useEffect(() => {
    setResolved(readResolvedTheme());
  }, []);

  const toggle = useCallback(async () => {
    const next: ResolvedTheme = resolved === "dark" ? "light" : "dark";
    applyThemeMode(next);
    setResolved(next);
    await updateSettings({ themeMode: next });
    const accent = peekBootCache()?.accentColor ?? "violet";
    applyAccentColor(accent);
  }, [resolved]);

  const isDark = resolved === "dark";

  return (
    <button
      type="button"
      onClick={() => void toggle()}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      {isDark ? <Sun size={16} strokeWidth={1.75} /> : <Moon size={16} strokeWidth={1.75} />}
    </button>
  );
}

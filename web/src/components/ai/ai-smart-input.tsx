"use client";

import { useState } from "react";
import { Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/design/cn";
import { parseTransactionWithAi, type AiParseResult } from "@/lib/ai/client";
import { copy } from "@/lib/ux/copy";
import { showToast } from "@/lib/store/toast-store";

type CategoryOption = { slug: string; name: string };

export function AiSmartInput({
  kind,
  categories,
  onParsed,
  className,
  compact,
}: {
  kind: "expense" | "income";
  categories: CategoryOption[];
  onParsed: (result: AiParseResult) => void;
  className?: string;
  compact?: boolean;
}) {
  const [line, setLine] = useState("");
  const [parsing, setParsing] = useState(false);

  async function runParse() {
    const text = line.trim();
    if (!text || parsing) return;
    setParsing(true);
    try {
      const result = await parseTransactionWithAi(text, categories, kind);
      onParsed(result);
      setLine("");
      showToast(copy.toast.aiParsed(result.title), { tone: "success" });
    } catch (err) {
      showToast(err instanceof Error ? err.message : copy.errors.understandAi, { tone: "error" });
    } finally {
      setParsing(false);
    }
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-primary/20 bg-primary/[0.04] p-3",
        className,
      )}
    >
      <div className="flex items-center gap-2 text-xs font-medium text-primary">
        <Sparkles size={14} className="shrink-0" />
        <span>{compact ? "Say it naturally" : "AI quick add"}</span>
      </div>
      <div className="mt-2 flex gap-2">
        <input
          type="text"
          value={line}
          onChange={(e) => setLine(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void runParse();
            }
          }}
          placeholder="450 lunch on Swiggy, 2k rent, salary 50k…"
          className={cn(
            "min-w-0 flex-1 rounded-lg border border-border/60 bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/50 focus:border-primary/40",
            compact && "py-2.5",
          )}
          aria-label="Describe transaction in plain words"
        />
        <Button
          type="button"
          variant="outline"
          size={compact ? "sm" : "md"}
          disabled={parsing || !line.trim()}
          onClick={() => void runParse()}
          aria-label="Parse with AI"
        >
          <Wand2 size={15} className={parsing ? "animate-spin" : ""} />
        </Button>
      </div>
      <p className="mt-1.5 text-[11px] text-muted-foreground">
        Type amount + what it was — we pick category and fill the form.
      </p>
    </div>
  );
}

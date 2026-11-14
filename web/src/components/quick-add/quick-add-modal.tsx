"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { format, isSameDay } from "date-fns";
import { SuccessMark } from "@/components/ui/success-mark";
import { successFeedback } from "@/lib/ux/feedback";
import { useUIStore } from "@/lib/store/ui-store";
import { CategoryCollapsiblePicker } from "@/components/categories/category-collapsible-picker";
import { Dialog, Sheet } from "@/components/ui/dialog";
import { MoneyKeypad, applyKeypadKey } from "@/components/ui/money-keypad";
import { DuplicateTransactionError } from "@/lib/db/errors";
import { softDeleteTransaction } from "@/lib/db/integrity";
import { parseRupeeInput, formatINR } from "@/lib/money";
import { useCategories, useFinanceSnapshot } from "@/lib/queries/use-finance";
import { getLastPaymentMethod, pickDefaultCategoryId } from "@/lib/ux/defaults";
import { filterQuickAddCategories } from "@/lib/categories/manage-category";
import { saveQuickTransaction } from "@/lib/transactions/save-quick-transaction";
import { useInvalidateFinance } from "@/hooks/use-invalidate-finance";
import { useMobileLayout } from "@/hooks/use-mobile-layout";
import { copy } from "@/lib/ux/copy";
import { showToast } from "@/lib/store/toast-store";
import { useAiFeatures } from "@/hooks/use-ai-features";
import { parseTransactionWithAi } from "@/lib/ai/client";
import { parseSms } from "@/lib/import/parse-sms";
import { cn } from "@/lib/design/cn";

type SheetKind = "expense" | "income" | "split";
const PAY_CHIPS = ["UPI", "Card", "Cash", "Wallet"] as const;

function KindPill({
  kind,
  onChange,
}: {
  kind: SheetKind;
  onChange: (kind: SheetKind) => void;
}) {
  const options: { id: SheetKind; label: string; active: string }[] = [
    { id: "expense", label: "Spent", active: "bg-chili text-white" },
    { id: "income", label: "Earned", active: "bg-lime text-[#0D0D0B]" },
    { id: "split", label: "Split", active: "bg-cobalt text-[#0D0D0B]" },
  ];
  return (
    <div className="grid grid-cols-3 gap-1 rounded-full border border-hairline p-1" role="tablist" aria-label="Kind">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          role="tab"
          aria-selected={kind === option.id}
          className={cn(
            "h-11 rounded-full font-mono text-[11px] uppercase tracking-[0.1em]",
            kind === option.id ? option.active : "text-ink-2",
          )}
          onClick={() => onChange(option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function QuickAddModal() {
  const open = useUIStore((s) => s.quickAddOpen);
  const storedKind = useUIStore((s) => s.quickAddKind);
  const setOpen = useUIStore((s) => s.setQuickAddOpen);
  const invalidate = useInvalidateFinance();
  const isMobileLayout = useMobileLayout();
  const categories = useCategories();
  const snapshot = useFinanceSnapshot();
  const expenseCats = useMemo(() => categories.filter((c) => c.countsTowardSpending), [categories]);
  const incomeCats = useMemo(
    () => categories.filter((c) => !c.countsTowardSpending || c.slug === "savings"),
    [categories],
  );

  const [sheetKind, setSheetKind] = useState<SheetKind>("expense");
  const kind = sheetKind === "income" ? "income" : "expense";
  const pool = kind === "income" ? incomeCats : expenseCats;
  const visiblePool = useMemo(() => filterQuickAddCategories(pool), [pool]);

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [occurredOn, setOccurredOn] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [showDate, setShowDate] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [dupError, setDupError] = useState(false);
  const [parsing, setParsing] = useState(false);
  const { active: aiActive } = useAiFeatures();
  const wasOpen = useRef(false);

  const popular = useMemo(() => {
    const counts = new Map<number, number>();
    for (const row of snapshot.data?.transactions ?? []) {
      counts.set(row.categoryId, (counts.get(row.categoryId) ?? 0) + 1);
    }
    return [...pool]
      .sort((a, b) => (counts.get(b.id ?? -1) ?? 0) - (counts.get(a.id ?? -1) ?? 0))
      .slice(0, 8);
  }, [pool, snapshot.data?.transactions]);

  const categoryOptions = useMemo(
    () => pool.map((c) => ({ slug: c.slug, name: c.name })),
    [pool],
  );

  const resolvedCategoryId = categoryId || String(visiblePool[0]?.id ?? pool[0]?.id ?? "");
  const preview = parseRupeeInput(amount);
  const dateLabel = isSameDay(new Date(occurredOn), new Date()) ? "Today" : format(new Date(occurredOn), "d MMM");

  function applyParsed(next: { title: string; amountPaise: number; kind: "expense" | "income"; categorySlug?: string }) {
    setTitle(next.title);
    setAmount(String(next.amountPaise / 100));
    const nextKind = next.kind === "income" ? "income" : "expense";
    setSheetKind(nextKind);
    useUIStore.setState({ quickAddKind: nextKind });
    const matchPool = nextKind === "income" ? incomeCats : expenseCats;
    const match = next.categorySlug ? matchPool.find((c) => c.slug === next.categorySlug) : undefined;
    if (match?.id != null) setCategoryId(String(match.id));
  }

  useEffect(() => {
    if (open && !wasOpen.current) {
      const opening = storedKind === "income" ? "income" : "expense";
      setSheetKind(opening);
      const nextPool = opening === "income" ? incomeCats : expenseCats;
      const visible = filterQuickAddCategories(nextPool);
      const def = pickDefaultCategoryId(opening, visible.length ? visible : nextPool);
      setTitle("");
      setAmount("");
      setCategoryId(def ? String(def) : "");
      setDupError(false);
      setSuccess(false);
      setShowAllCategories(false);
      setShowDate(false);
      setOccurredOn(format(new Date(), "yyyy-MM-dd"));
      setPaymentMethod(getLastPaymentMethod());
      void navigator.clipboard?.readText?.().then((text) => {
        const parsed = parseSms(text);
        if (!parsed) return;
        applyParsed({ title: parsed.merchant, amountPaise: parsed.amountPaise, kind: parsed.kind });
      }).catch(() => undefined);
    }
    wasOpen.current = open;
    // Reset once per open. Clipboard parse is best-effort.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function handleKindChange(next: SheetKind) {
    setSheetKind(next);
    if (next === "split") return;
    useUIStore.setState({ quickAddKind: next });
    const nextPool = next === "income" ? incomeCats : expenseCats;
    const visible = filterQuickAddCategories(nextPool);
    const def = pickDefaultCategoryId(next, visible.length ? visible : nextPool);
    setCategoryId(def ? String(def) : "");
  }

  const handleClose = useCallback(() => {
    setSuccess(false);
    setOpen(false);
  }, [setOpen]);

  async function submit(allowDuplicate = false) {
    if (sheetKind === "split" || preview <= 0) return;
    setSaving(true);
    setDupError(false);
    try {
      const id = await saveQuickTransaction(
        {
          kind,
          title: title.trim() || popular.find((c) => String(c.id) === resolvedCategoryId)?.name || "Expense",
          amountPaise: preview,
          categoryId: Number(resolvedCategoryId),
          paymentMethod,
          occurredAt: new Date(`${occurredOn}T12:00:00`),
        },
        { allowDuplicate },
      );
      await invalidate();
      successFeedback();
      setSaving(false);
      setSuccess(true);
      const catName = pool.find((c) => String(c.id) === resolvedCategoryId)?.name ?? "misc";
      showToast(`logged ${formatINR(preview)} · ${catName.toLowerCase()}`, {
        tone: "success",
        durationMs: 5000,
        undo: async () => {
          await softDeleteTransaction(id);
          await invalidate();
        },
      });
      setTimeout(handleClose, 700);
    } catch (err) {
      setSaving(false);
      if (err instanceof DuplicateTransactionError) setDupError(true);
    }
  }

  async function runParse() {
    if (!aiActive || !title.trim() || parsing) return;
    setParsing(true);
    try {
      const result = await parseTransactionWithAi(title.trim(), categoryOptions, kind);
      applyParsed(result);
    } catch {
      showToast("Couldn't read that. Type the amount.", { tone: "error" });
    } finally {
      setParsing(false);
    }
  }

  function onPasteText(text: string) {
    const parsed = parseSms(text);
    if (parsed) {
      applyParsed({ title: parsed.merchant, amountPaise: parsed.amountPaise, kind: parsed.kind });
    }
  }

  const body = success ? (
    <div className="flex flex-1 items-center justify-center py-16">
      <SuccessMark label={copy.success.saved} />
    </div>
  ) : (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void submit(false);
      }}
      onPaste={(event) => onPasteText(event.clipboardData.getData("text"))}
      className="flex min-h-0 flex-1 flex-col"
    >
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
        <KindPill kind={sheetKind} onChange={handleKindChange} />
        {sheetKind === "split" && (
          <p className="font-body text-sm text-ink-2">Splitting with crew comes next. Log it as spent for now, or switch back.</p>
        )}
        <p className="text-center font-mono text-[48px] leading-none tracking-[-0.04em] text-ink">
          <span className="text-ink-2">₹</span>
          {amount || "0"}
        </p>
        {isMobileLayout ? (
          <div>
            <label className="sr-only" htmlFor="quick-amount">Amount</label>
            <input id="quick-amount" value={amount} readOnly inputMode="none" className="sr-only" />
            <MoneyKeypad onKey={(key) => setAmount((current) => applyKeypadKey(current, key))} />
          </div>
        ) : (
          <input
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            inputMode="decimal"
            aria-label="Amount (INR)"
            placeholder="0"
            className="h-12 w-full rounded-[14px] border border-hairline bg-transparent px-4 font-mono text-lg text-ink outline-none focus:border-lime"
          />
        )}
        <div className="flex gap-2">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="what was it?"
            aria-label="What was it"
            className="h-12 min-w-0 flex-1 rounded-[14px] border border-hairline bg-transparent px-4 font-body text-base text-ink outline-none focus:border-lime"
          />
          {aiActive && (
            <button
              type="button"
              className="h-12 shrink-0 rounded-full border border-hairline px-4 font-mono text-[11px] uppercase tracking-[0.08em] text-ink disabled:opacity-40"
              disabled={parsing || title.trim().length < 3}
              onClick={() => void runParse()}
            >
              {parsing ? "Reading" : "Parse"}
            </button>
          )}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {popular.map((category) => (
            <button
              key={category.id}
              type="button"
              className={cn(
                "h-11 shrink-0 rounded-full border px-3 font-body text-sm",
                String(category.id) === resolvedCategoryId
                  ? "border-lime bg-lime text-[#0D0D0B]"
                  : "border-hairline text-ink",
              )}
              onClick={() => category.id != null && setCategoryId(String(category.id))}
            >
              {category.name}
            </button>
          ))}
          <button
            type="button"
            className="h-11 shrink-0 rounded-full border border-hairline px-3 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-2"
            onClick={() => setShowAllCategories((openMore) => !openMore)}
          >
            More
          </button>
        </div>
        {showAllCategories && (
          <CategoryCollapsiblePicker
            categories={pool}
            value={resolvedCategoryId}
            onChange={setCategoryId}
            kind={kind}
            compact
          />
        )}
        <div className="flex flex-wrap gap-2" role="group" aria-label="Paid with">
          {PAY_CHIPS.map((method) => (
            <button
              key={method}
              type="button"
              aria-pressed={paymentMethod === method}
              className={cn(
                "h-11 rounded-full border px-3 font-mono text-[11px] uppercase tracking-[0.08em]",
                paymentMethod === method ? "border-ink bg-ink text-bg" : "border-hairline text-ink",
              )}
              onClick={() => setPaymentMethod(method)}
            >
              {method}
            </button>
          ))}
          <button
            type="button"
            className="h-11 rounded-full border border-hairline px-3 font-mono text-[11px] uppercase tracking-[0.08em] text-ink"
            onClick={() => setShowDate((openDate) => !openDate)}
          >
            {dateLabel}
          </button>
        </div>
        {showDate && (
          <input
            type="date"
            value={occurredOn}
            aria-label="Date"
            onChange={(event) => setOccurredOn(event.target.value)}
            className="h-11 rounded-[14px] border border-hairline bg-transparent px-3 font-mono text-sm text-ink"
          />
        )}
      </div>
      <div className="shrink-0 border-t border-hairline px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {dupError && (
          <button type="button" className="mb-3 h-11 w-full rounded-full border border-hairline text-sm text-ink" onClick={() => void submit(true)}>
            Save anyway
          </button>
        )}
        <button
          type="submit"
          disabled={saving || preview <= 0 || sheetKind === "split"}
          className="h-12 w-full rounded-full bg-lime font-medium text-[#0D0D0B] disabled:opacity-40"
        >
          {saving ? "Saving" : `Save ${preview > 0 ? formatINR(preview) : ""}`.trim()}
        </button>
      </div>
    </form>
  );

  return (
    <>
      {isMobileLayout && (
        <Sheet open={open} onClose={handleClose} labelledBy="quick-add-title" fullScreen stealFocus={false}>
          <div className="flex h-full flex-col bg-bg">
            <header className="flex shrink-0 items-center justify-between px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
              <button type="button" onClick={handleClose} className="h-11 px-1 text-sm text-ink-2">
                Cancel
              </button>
              <h2 id="quick-add-title" className="font-body text-base font-medium text-ink">
                Add
              </h2>
              <span className="w-12" aria-hidden />
            </header>
            {body}
          </div>
        </Sheet>
      )}
      {!isMobileLayout && (
        <Dialog open={open} onClose={handleClose} labelledBy="quick-add-title-desktop" size="lg">
          <div className="bg-bg p-6">
            <h2 id="quick-add-title-desktop" className="mb-4 font-body text-lg text-ink">
              Add
            </h2>
            {body}
          </div>
        </Dialog>
      )}
    </>
  );
}

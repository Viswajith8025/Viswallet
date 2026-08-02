"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SuccessMark } from "@/components/ui/success-mark";
import { successFeedback } from "@/lib/ux/feedback";
import { useUIStore } from "@/lib/store/ui-store";
import { Button } from "@/components/ui/button";
import { CategoryPicker } from "@/components/categories/category-picker";
import { CategoryGrid } from "@/components/categories/category-grid";
import { Input, Select } from "@/components/ui/input";
import { Dialog, Sheet } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { AiSmartInput } from "@/components/ai/ai-smart-input";
import { DuplicateTransactionError } from "@/lib/db/errors";
import { parseRupeeInput, formatINR } from "@/lib/money";
import { PAYMENT_METHODS } from "@/lib/categories-default";
import { useCategories } from "@/lib/queries/use-finance";
import { getLastPaymentMethod, pickDefaultCategoryId } from "@/lib/ux/defaults";
import { filterQuickAddCategories } from "@/lib/categories/manage-category";
import { saveQuickTransaction } from "@/lib/transactions/save-quick-transaction";
import { useInvalidateFinance } from "@/hooks/use-invalidate-finance";
import { showToast } from "@/lib/store/toast-store";
import { useAiFeatures } from "@/hooks/use-ai-features";
import { suggestCategoryWithAi, type AiParseResult } from "@/lib/ai/client";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/design/cn";

const TYPE_OPTIONS = [
  { value: "expense" as const, label: "Spent" },
  { value: "income" as const, label: "Earned" },
];

function TypePills({
  kind,
  onChange,
  className,
}: {
  kind: "expense" | "income";
  onChange: (k: "expense" | "income") => void;
  className?: string;
}) {
  return (
    <div className={cn("flex rounded-lg bg-muted/80 p-1", className)}>
      {TYPE_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "flex-1 rounded-md py-2.5 text-sm font-medium transition-colors",
            kind === opt.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function QuickAddModal() {
  const open = useUIStore((s) => s.quickAddOpen);
  const kind = useUIStore((s) => s.quickAddKind);
  const setOpen = useUIStore((s) => s.setQuickAddOpen);
  const invalidate = useInvalidateFinance();
  const categories = useCategories();
  const expenseCats = useMemo(() => categories.filter((c) => c.countsTowardSpending), [categories]);
  const incomeCats = useMemo(
    () => categories.filter((c) => !c.countsTowardSpending || c.slug === "savings"),
    [categories],
  );
  const pool = kind === "income" ? incomeCats : expenseCats;
  const visiblePool = useMemo(() => filterQuickAddCategories(pool), [pool]);

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [isRecurring, setIsRecurring] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [dupError, setDupError] = useState(false);
  const { active: aiActive } = useAiFeatures();
  const wasOpen = useRef(false);
  const debouncedTitle = useDebounce(title, 700);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const categoryOptions = useMemo(
    () => pool.map((c) => ({ slug: c.slug, name: c.name })),
    [pool],
  );

  useEffect(() => {
    if (open && !wasOpen.current) {
      const def = pickDefaultCategoryId(kind, visiblePool.length ? visiblePool : pool);
      setTitle("");
      setAmount("");
      setCategoryId(def ? String(def) : "");
      setIsRecurring(false);
      setDupError(false);
      setSuccess(false);
      setPaymentMethod(getLastPaymentMethod());
    }
    wasOpen.current = open;
  }, [open, kind, visiblePool, pool, categories]);

  useEffect(() => {
    if (!aiActive || !debouncedTitle.trim() || debouncedTitle.length < 3) return;
    let cancelled = false;
    void suggestCategoryWithAi(debouncedTitle.trim(), kind, categoryOptions)
      .then((res) => {
        if (cancelled) return;
        const match = pool.find((c) => c.slug === res.categorySlug);
        if (match?.id != null) setCategoryId(String(match.id));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [aiActive, debouncedTitle, kind, categoryOptions, pool]);

  function applyAiParse(parsed: AiParseResult) {
    setTitle(parsed.title);
    setAmount(String(parsed.amountPaise / 100));
    useUIStore.setState({ quickAddKind: parsed.kind });
    const matchPool = parsed.kind === "income" ? incomeCats : expenseCats;
    const match = matchPool.find((c) => c.slug === parsed.categorySlug);
    if (match?.id != null) setCategoryId(String(match.id));
  }

  function handleKindChange(k: "expense" | "income") {
    useUIStore.setState({ quickAddKind: k });
    const nextPool = k === "income" ? incomeCats : expenseCats;
    const visible = filterQuickAddCategories(nextPool);
    const def = pickDefaultCategoryId(k, visible.length ? visible : nextPool);
    setCategoryId(def ? String(def) : "");
  }

  function handleClose() {
    setOpen(false);
  }

  async function submit(allowDuplicate = false) {
    const paise = parseRupeeInput(amount);
    if (paise <= 0) return;
    setSaving(true);
    setDupError(false);
    try {
      const catId = Number(categoryId || visiblePool[0]?.id || pool[0]?.id);
      await saveQuickTransaction(
        {
          kind,
          title: title.trim(),
          amountPaise: paise,
          categoryId: catId,
          paymentMethod,
          isRecurring,
        },
        { allowDuplicate },
      );
      await invalidate();
      successFeedback();
      setSaving(false);
      setSuccess(true);
      showToast(`${kind === "income" ? "Earned" : "Spent"} ${formatINR(paise)}`, { tone: "success" });
      setTimeout(handleClose, 700);
    } catch (err) {
      setSaving(false);
      if (err instanceof DuplicateTransactionError) {
        setDupError(true);
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submit(false);
  }

  const preview = parseRupeeInput(amount);
  const mobileTitle = kind === "income" ? "Add income" : "Add expense";

  const mobileBody = success ? (
    <div className="flex flex-1 items-center justify-center py-16">
      <SuccessMark label="Saved" />
    </div>
  ) : (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
      <div className="px-4 py-3 space-y-3">
        <TypePills kind={kind} onChange={handleKindChange} />
        {aiActive && (
          <AiSmartInput
            kind={kind}
            categories={categoryOptions}
            onParsed={applyAiParse}
            compact
          />
        )}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title — e.g. Lunch, Uber, Amazon"
          className="w-full rounded-xl border border-border/60 bg-muted/40 px-4 py-3 text-sm outline-none placeholder:text-muted-foreground/60 focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
          aria-label="Title"
        />
        <p className="text-center text-xs text-muted-foreground">
          Pick a category, enter title and amount
        </p>
      </div>

      <div className="scroll-premium min-h-0 flex-1 overflow-y-auto">
        <CategoryGrid
          categories={pool}
          value={categoryId || String(visiblePool[0]?.id ?? pool[0]?.id ?? "")}
          onChange={setCategoryId}
          kind={kind}
        />
      </div>

      <div className="shrink-0 border-t border-border/50 bg-background px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center gap-2 rounded-xl bg-muted/50 px-4 py-3">
          <span className="text-lg font-medium text-muted-foreground">₹</span>
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className="min-w-0 flex-1 bg-transparent text-2xl font-semibold tabular-nums outline-none placeholder:text-muted-foreground/40"
            aria-label="Amount in rupees"
          />
        </div>
        {dupError && (
          <Button type="button" variant="outline" size="sm" className="mt-3 w-full" onClick={() => submit(true)}>
            Save anyway (similar entry exists)
          </Button>
        )}
        <Button type="submit" className="mt-3 w-full" size="lg" disabled={saving || preview <= 0}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );

  const desktopBody = success ? (
    <div className="py-10">
      <SuccessMark label="Saved" />
    </div>
  ) : (
    <>
      <TypePills kind={kind} onChange={handleKindChange} className="mb-5" />
      {preview > 0 && (
        <p className="mb-4 text-center text-2xl font-semibold tabular-nums text-primary">{formatINR(preview)}</p>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        {aiActive && (
          <AiSmartInput
            kind={kind}
            categories={categoryOptions}
            onParsed={applyAiParse}
          />
        )}
        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Lunch, Uber, salary bonus"
          hint="Uses category name if left blank"
        />
        <Input
          label="Amount (₹)"
          required
          type="number"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0"
        />
        <CategoryPicker
          categories={pool}
          value={categoryId || String(visiblePool[0]?.id ?? pool[0]?.id ?? "")}
          onChange={setCategoryId}
          label="Category"
          kind={kind}
        />
        <Select label="Paid with" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
          {PAYMENT_METHODS.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </Select>
        <Checkbox label="Repeats every month" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} />
        {dupError && (
          <Button type="button" variant="outline" size="sm" onClick={() => submit(true)}>
            Save anyway
          </Button>
        )}
        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="ghost" onClick={handleClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
        </div>
      </form>
    </>
  );

  return (
    <>
      {isMobile && (
        <Sheet open={open} onClose={handleClose} labelledBy="quick-add-title" fullScreen>
          <div className="flex h-full flex-col bg-background">
            <header className="flex shrink-0 items-center justify-between border-b border-border/50 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
              <button type="button" onClick={handleClose} className="text-sm text-muted-foreground">
                Cancel
              </button>
              <h2 id="quick-add-title" className="text-base font-semibold">{mobileTitle}</h2>
              <span className="w-12" aria-hidden />
            </header>
            {mobileBody}
          </div>
        </Sheet>
      )}

      {!isMobile && (
        <Dialog open={open} onClose={handleClose} labelledBy="quick-add-title-desktop" size="lg">
          <div className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 id="quick-add-title-desktop" className="text-lg font-semibold">Add transaction</h2>
              <Button variant="ghost" size="sm" onClick={handleClose}>Close</Button>
            </div>
            {desktopBody}
          </div>
        </Dialog>
      )}
    </>
  );
}

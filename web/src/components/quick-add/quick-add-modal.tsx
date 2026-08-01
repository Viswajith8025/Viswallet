"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { X, Sparkles, Wand2 } from "lucide-react";
import { SuccessMark } from "@/components/ui/success-mark";
import { successFeedback } from "@/lib/ux/feedback";
import { useUIStore } from "@/lib/store/ui-store";
import { Button } from "@/components/ui/button";
import { CategoryPicker } from "@/components/categories/category-picker";
import { Input, Select } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Hint } from "@/components/ui/hint";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { DuplicateTransactionError } from "@/lib/db/errors";
import { parseRupeeInput, formatINR } from "@/lib/money";
import { PAYMENT_METHODS } from "@/lib/categories-default";
import { useCategories } from "@/lib/queries/use-finance";
import { getLastPaymentMethod, pickDefaultCategoryId } from "@/lib/ux/defaults";
import { saveQuickTransaction } from "@/lib/transactions/save-quick-transaction";
import { useInvalidateFinance } from "@/hooks/use-invalidate-finance";
import { showToast } from "@/lib/store/toast-store";
import { format } from "date-fns";
import { getSettings } from "@/lib/db";
import { useAiStatus } from "@/hooks/use-ai-status";
import { parseTransactionWithAi, suggestCategoryWithAi } from "@/lib/ai/client";
import { useDebounce } from "@/hooks/use-debounce";

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

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [isRecurring, setIsRecurring] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [dupError, setDupError] = useState(false);
  const [aiLine, setAiLine] = useState("");
  const [aiParsing, setAiParsing] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(false);
  const aiStatus = useAiStatus();
  const wasOpen = useRef(false);
  const debouncedTitle = useDebounce(title, 700);

  useEffect(() => {
    void getSettings().then((s) => setAiEnabled(Boolean(s.aiFeaturesEnabled)));
  }, []);

  const aiActive = aiEnabled && aiStatus?.available;
  const categoryOptions = useMemo(
    () => pool.map((c) => ({ slug: c.slug, name: c.name })),
    [pool],
  );

  // Reset only when modal opens — not on every parent re-render.
  useEffect(() => {
    if (open && !wasOpen.current) {
      const def = pickDefaultCategoryId(kind, pool.length ? pool : categories);
      setTitle("");
      setAmount("");
      setCategoryId(def ? String(def) : "");
      setIsRecurring(false);
      setDupError(false);
      setSuccess(false);
      setAiLine("");
      setPaymentMethod(getLastPaymentMethod());
    }
    wasOpen.current = open;
  }, [open, kind, pool, categories]);

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

  async function handleAiParse() {
    if (!aiActive || !aiLine.trim()) return;
    setAiParsing(true);
    try {
      const parsed = await parseTransactionWithAi(aiLine.trim(), categoryOptions, kind);
      setTitle(parsed.title);
      setAmount(String(parsed.amountPaise / 100));
      useUIStore.setState({ quickAddKind: parsed.kind });
      const match = (parsed.kind === "income" ? incomeCats : expenseCats).find(
        (c) => c.slug === parsed.categorySlug,
      );
      if (match?.id != null) setCategoryId(String(match.id));
      showToast("Filled from your description", { tone: "success" });
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not parse", { tone: "default" });
    } finally {
      setAiParsing(false);
    }
  }

  function handleKindChange(k: "expense" | "income") {
    useUIStore.setState({ quickAddKind: k });
    const nextPool = k === "income" ? incomeCats : expenseCats;
    const def = pickDefaultCategoryId(k, nextPool.length ? nextPool : categories);
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
      const catId = Number(categoryId || pool[0]?.id);
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
      showToast(`${kind === "income" ? "Income" : "Expense"} saved · ${formatINR(paise)}`, { tone: "success" });
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

  return (
    <Dialog open={open} onClose={handleClose} labelledBy="quick-add-title">
      <div className="p-6">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <h2 id="quick-add-title" className="text-lg font-semibold tracking-tight">
                Quick add
              </h2>
              <Badge variant={kind === "income" ? "success" : "primary"}>{kind}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{format(new Date(), "EEEE, d MMMM")}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose} aria-label="Close">
            <X size={18} />
          </Button>
        </div>

        {success ? (
          <div className="py-10">
            <SuccessMark label="Saved successfully" />
          </div>
        ) : (
          <>
            <SegmentedControl
              options={[
                { value: "expense", label: "Expense" },
                { value: "income", label: "Income" },
              ]}
              value={kind}
              onChange={handleKindChange}
              fullWidth
              className="mb-5"
            />
            {preview > 0 && (
              <p className="mb-4 text-center text-2xl font-semibold tabular-nums text-primary">{formatINR(preview)}</p>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              {aiActive && (
                <div className="rounded-xl border border-primary/20 bg-primary/[0.04] p-3 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-primary">
                    <Sparkles size={14} />
                    AI quick add
                  </div>
                  <div className="flex gap-2">
                    <Input
                      label="Describe it"
                      value={aiLine}
                      onChange={(e) => setAiLine(e.target.value)}
                      placeholder="e.g. 450 Swiggy lunch"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-6 shrink-0"
                      disabled={aiParsing || !aiLine.trim()}
                      onClick={() => void handleAiParse()}
                    >
                      <Wand2 size={15} className="mr-1" />
                      {aiParsing ? "…" : "Parse"}
                    </Button>
                  </div>
                </div>
              )}
              <Input
                label="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={kind === "income" ? "Freelance, refund..." : "Optional — uses category if blank"}
                hint="Leave blank to use the category name (e.g. Spotify)"
                autoFocus
              />
              <Input
                label="Amount (INR)"
                required
                type="number"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
              <CategoryPicker
                categories={pool}
                value={categoryId || String(pool[0]?.id ?? "")}
                onChange={setCategoryId}
              />
              <Select label="Payment" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </Select>
              <Checkbox
                label="Mark as recurring"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
              />
              {dupError && (
                <div className="rounded-xl border border-warning/30 bg-warning-muted/50 p-3 text-sm">
                  <p className="text-warning">Similar transaction exists today.</p>
                  <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => submit(true)}>
                    Save anyway
                  </Button>
                </div>
              )}
              <div className="flex justify-end gap-2 border-t border-border pt-4">
                <Button type="button" variant="ghost" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </Button>
              </div>
            </form>
            <Hint className="mt-4">
              Tip: Press <kbd className="rounded bg-muted px-1">⌘K</kbd> anytime to open commands.
            </Hint>
          </>
        )}
      </div>
    </Dialog>
  );
}

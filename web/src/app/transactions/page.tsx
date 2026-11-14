"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import Fuse from "fuse.js";
import { Search } from "lucide-react";
import { PageHeader, EmptyState, PageContainer } from "@/components/ui/page";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FinanceGate } from "@/components/layout/finance-gate";
import { FadeIn } from "@/components/ui/motion";
import { CategoryPicker } from "@/components/categories/category-picker";
import { Checkbox } from "@/components/ui/checkbox";
import { Hint } from "@/components/ui/hint";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { TabBar } from "@/components/ui/tab-bar";
import { useCategories } from "@/lib/queries/use-finance";
import { useInvalidateFinance, usePagination } from "@/hooks";
import { categoryMap } from "@/lib/engines/finance-snapshot";
import type { FinanceSnapshot } from "@/lib/engines/finance-snapshot";
import { getSettings } from "@/lib/db";
import { addTransaction, updateTransactionWithLock } from "@/lib/db/repositories/transactions";
import { restoreTransaction, softDeleteTransaction } from "@/lib/db/integrity";
import { DuplicateTransactionError, OptimisticLockError, ReferentialIntegrityError } from "@/lib/db/errors";
import type { Transaction } from "@/lib/db/types";
import { parseRupeeInput, formatINR } from "@/lib/money";
import { getMonthKey } from "@/lib/salary-cycle";
import { PAYMENT_METHODS } from "@/lib/categories-default";
import {
  getLastPaymentMethod,
  pickDefaultCategoryId,
  setLastCategoryId,
  setLastPaymentMethod,
} from "@/lib/ux/defaults";
import { confirmAction } from "@/lib/store/confirm-store";
import { copy, toastCopy } from "@/lib/ux/copy";
import { showToast } from "@/lib/store/toast-store";
import { useUIStore } from "@/lib/store/ui-store";
import { SharedBalance } from "@/components/dashboard/shared-balance";
import { MoneyTabs } from "@/components/money/money-tabs";
import { SwipeTransactionRow } from "@/components/money/swipe-transaction-row";

function TransactionsContent({
  data,
  initialShowForm = false,
  initialKind = "expense",
  editId,
}: {
  data: FinanceSnapshot;
  initialShowForm?: boolean;
  initialKind?: "expense" | "income";
  editId?: string | null;
}) {
  const invalidate = useInvalidateFinance();
  const setStatementImportOpen = useUIStore((s) => s.setStatementImportOpen);
  const setQuickAddOpen = useUIStore((s) => s.setQuickAddOpen);
  const categories = useCategories();
  const expenseCats = useMemo(() => categories.filter((c) => c.countsTowardSpending), [categories]);
  const incomeCats = useMemo(
    () => categories.filter((c) => !c.countsTowardSpending || c.slug === "savings"),
    [categories],
  );

  const [filter, setFilter] = useState<"all" | "expense" | "income">("all");
  const [showForm, setShowForm] = useState(initialShowForm);
  const [edit, setEdit] = useState<Transaction | null>(null);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [kind, setKind] = useState<"expense" | "income">(initialKind);
  const [categoryId, setCategoryId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(getLastPaymentMethod());
  const [isRecurring, setIsRecurring] = useState(false);
  const [formError, setFormError] = useState("");
  const [forceDuplicate, setForceDuplicate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [minRupee, setMinRupee] = useState("");
  const [maxRupee, setMaxRupee] = useState("");
  const [windowSize, setWindowSize] = useState(80);

  const cats = categoryMap(data.categories);
  const list = useMemo(
    () => data.transactions.filter((t) => filter === "all" || t.kind === filter),
    [data.transactions, filter],
  );
  const pagination = usePagination(list, 50);
  const fuse = useMemo(
    () => new Fuse(list, { keys: ["title", "notes", "paymentMethod"], threshold: 0.35 }),
    [list],
  );
  const searched = useMemo(() => {
    let rows = query.trim() ? fuse.search(query).map((result) => result.item) : list;
    if (categoryFilter) rows = rows.filter((row) => String(row.categoryId) === categoryFilter);
    const min = parseRupeeInput(minRupee);
    const max = parseRupeeInput(maxRupee);
    if (min > 0) rows = rows.filter((row) => row.amountPaise >= min);
    if (max > 0) rows = rows.filter((row) => row.amountPaise <= max);
    return rows;
  }, [categoryFilter, fuse, list, maxRupee, minRupee, query]);
  const visible = searched.length > 200 ? searched.slice(0, windowSize) : searched;
  const dayGroups = useMemo(() => {
    const groups = new Map<string, { label: string; total: number; rows: Transaction[] }>();
    for (const row of visible) {
      const day = format(new Date(row.occurredAt), "yyyy-MM-dd");
      const group = groups.get(day) ?? {
        label: format(new Date(row.occurredAt), "EEE d MMM").toUpperCase(),
        total: 0,
        rows: [],
      };
      group.rows.push(row);
      group.total += row.kind === "income" ? row.amountPaise : -row.amountPaise;
      groups.set(day, group);
    }
    return [...groups.entries()];
  }, [visible]);
  const previewPaise = parseRupeeInput(amount);
  const activeCats = kind === "income" ? incomeCats : expenseCats;
  const resolvedCategoryId =
    categoryId ||
    String(
      pickDefaultCategoryId(kind, activeCats.length ? activeCats : categories) ?? activeCats[0]?.id ?? "",
    );

  useEffect(() => {
    if (!editId) return;
    const t = data.transactions.find((x) => x.id === Number(editId));
    if (t) startEdit(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- open edit once from deep link
  }, [editId]);

  useEffect(() => {
    if (!initialShowForm) return;
    requestAnimationFrame(() => {
      document.getElementById("transaction-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [initialShowForm]);

  function resetForm() {
    setTitle("");
    setAmount("");
    setKind("expense");
    setCategoryId("");
    setIsRecurring(false);
    setFormError("");
    setForceDuplicate(false);
    setEdit(null);
    setShowForm(false);
  }

  function startEdit(t: Transaction) {
    if (!t.id) return;
    setEdit(t);
    setTitle(t.title);
    setAmount(String(t.amountPaise / 100));
    setKind(t.kind);
    setCategoryId(String(t.categoryId));
    setPaymentMethod(t.paymentMethod);
    setIsRecurring(t.isRecurring);
    setShowForm(true);
    setFormError("");
    setForceDuplicate(false);
    requestAnimationFrame(() => {
      document.getElementById("transaction-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function openNew(k: "expense" | "income" = "expense") {
    setEdit(null);
    setTitle("");
    setAmount("");
    setKind(k);
    setIsRecurring(false);
    setFormError("");
    setForceDuplicate(false);
    const pool = k === "income" ? incomeCats : expenseCats;
    const def = pickDefaultCategoryId(k, pool.length ? pool : categories);
    setCategoryId(def ? String(def) : "");
    setPaymentMethod(getLastPaymentMethod());
    setShowForm(true);
  }

  function handleKindChange(k: "expense" | "income") {
    setKind(k);
    const pool = k === "income" ? incomeCats : expenseCats;
    const def = pickDefaultCategoryId(k, pool.length ? pool : categories);
    setCategoryId(def ? String(def) : "");
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    const paise = parseRupeeInput(amount);
    if (paise <= 0) {
      setFormError(copy.formErrors.amountRequired);
      showToast(copy.validation.amountRequired, { tone: "error" });
      return;
    }
    const catId = Number(resolvedCategoryId || categories[0]?.id);
    if (!catId || !Number.isFinite(catId)) {
      setFormError(copy.formErrors.categoryRequired);
      showToast(copy.validation.categoryRequired, { tone: "error" });
      return;
    }
    setFormError("");
    setSaving(true);
    try {
      const settings = await getSettings();
      const occurredAt = edit ? new Date(edit.occurredAt) : new Date();
      const monthKey = getMonthKey(occurredAt, settings.salaryDay);

      if (edit?.id) {
        await updateTransactionWithLock(edit.id, {
          title: title,
          kind,
          amountPaise: paise,
          categoryId: catId,
          paymentMethod,
          monthKey,
          isRecurring,
        });
        showToast(copy.toast.transactionUpdated, { tone: "success" });
      } else {
        await addTransaction(
          {
            kind,
            title: title,
            amountPaise: paise,
            categoryId: catId,
            paymentMethod,
            occurredAt,
            monthKey,
            tags: [],
            isRecurring,
          },
          { allowDuplicate: forceDuplicate },
        );
        showToast(
          kind === "income" ? toastCopy.recordedIncome(previewPaise) : toastCopy.recordedExpense(previewPaise),
          { tone: "success" },
        );
      }

      setLastPaymentMethod(paymentMethod);
      setLastCategoryId(kind, catId);
      await invalidate();
      resetForm();
      pagination.reset();
    } catch (err) {
      if (err instanceof DuplicateTransactionError) {
        setFormError(copy.formErrors.duplicateToday);
        setForceDuplicate(true);
        showToast(copy.toast.duplicateToday, { tone: "error" });
      } else if (err instanceof OptimisticLockError) {
        setFormError(copy.formErrors.updateConflict);
        showToast(copy.toast.updateConflict, { tone: "error" });
      } else if (err instanceof ReferentialIntegrityError) {
        setFormError(err.message);
        showToast(err.message, { tone: "error" });
      } else {
        const message = err instanceof Error ? err.message : copy.errors.saveTransaction;
        setFormError(message);
        showToast(message, { tone: "error" });
      }
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    const txn = data.transactions.find((t) => t.id === id);
    const ok = await confirmAction({
      title: copy.confirm.deleteTransaction,
      description: txn ? copy.confirmDesc.removeTransaction(txn.title, formatINR(txn.amountPaise)) : undefined,
      confirmLabel: copy.confirm.remove,
      destructive: true,
    });
    if (!ok) return;
    await softDeleteTransaction(id);
    await invalidate();
    showToast(copy.toast.transactionDeleted, {
      tone: "default",
      undo: async () => {
        await restoreTransaction(id);
        await invalidate();
      },
    });
  }

  return (
    <PageContainer className="max-w-5xl space-y-4 md:space-y-6">
      <FadeIn>
        <PageHeader
          title={copy.pages.transactions.title}
          description={copy.pages.transactions.description}
          mobileActions={
            <Button size="sm" onClick={() => setQuickAddOpen(true, "expense")}>
              {copy.buttons.add}
            </Button>
          }
          actions={
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setStatementImportOpen(true)}>
                {copy.forms.importStatement}
              </Button>
              <Button variant="outline" onClick={() => openNew("income")}>
                {copy.forms.addIncome}
              </Button>
              <Button onClick={() => openNew("expense")}>{copy.forms.addExpense}</Button>
            </div>
          }
        />
        <SharedBalance paise={data.remainingPaise} className="mt-3 text-[28px] font-semibold" />
      </FadeIn>

      <MoneyTabs />
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-hairline"
          aria-label="Search transactions"
          onClick={() => setShowSearch((open) => !open)}
        >
          <Search size={16} />
        </button>
        {showSearch && (
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search transactions"
            placeholder="Search"
            className="h-11 min-w-0 flex-1 rounded-full border border-hairline bg-transparent px-4 text-sm text-ink outline-none focus:border-lime"
          />
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <select
          aria-label="Category"
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
          className="h-11 rounded-full border border-hairline bg-transparent px-3 text-sm text-ink"
        >
          <option value="">Category</option>
          {categories.map((category) => (
            <option key={category.id} value={String(category.id)}>
              {category.name}
            </option>
          ))}
        </select>
        <input
          value={minRupee}
          onChange={(event) => setMinRupee(event.target.value)}
          inputMode="decimal"
          aria-label="Minimum amount"
          placeholder="Min ₹"
          className="h-11 w-24 rounded-full border border-hairline bg-transparent px-3 font-mono text-sm text-ink"
        />
        <input
          value={maxRupee}
          onChange={(event) => setMaxRupee(event.target.value)}
          inputMode="decimal"
          aria-label="Maximum amount"
          placeholder="Max ₹"
          className="h-11 w-24 rounded-full border border-hairline bg-transparent px-3 font-mono text-sm text-ink"
        />
      </div>

      <TabBar
        className="md:hidden"
        options={[
          { value: "all", label: copy.labels.all },
          { value: "expense", label: copy.labels.spent },
          { value: "income", label: copy.labels.earned },
        ]}
        value={filter}
        onChange={(f) => {
          setFilter(f);
          pagination.reset();
        }}
        aria-label={copy.forms.filterTransactions}
      />

      <SegmentedControl
        className="hidden md:flex"
        options={[
          { value: "all", label: copy.labels.all },
          { value: "expense", label: copy.labels.expense },
          { value: "income", label: copy.labels.income },
        ]}
        value={filter}
        onChange={(f) => {
          setFilter(f);
          pagination.reset();
        }}
        aria-label={copy.forms.filterTransactions}
      />

      {showForm && (
        <Card id="transaction-form">
          <CardContent className="p-5 md:p-6">
            <div className="mb-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{edit ? copy.forms.editTransaction : copy.forms.newTransaction}</h3>
                <Badge variant={kind === "income" ? "success" : "primary"}>{kind}</Badge>
              </div>
              {previewPaise > 0 && (
                <p className="text-lg font-semibold tabular-nums text-primary">{formatINR(previewPaise)}</p>
              )}
            </div>
            <form onSubmit={save} className="grid gap-4 md:grid-cols-2">
              <Input
                label={copy.forms.title}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={copy.forms.titleOptional}
                hint={copy.forms.titleHint}
                autoFocus
              />
              <Input
                label={copy.forms.amountInr}
                required
                type="number"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <Select label={copy.forms.type} value={kind} onChange={(e) => handleKindChange(e.target.value as "expense" | "income")}>
                <option value="expense">{copy.labels.expense}</option>
                <option value="income">{copy.labels.income}</option>
              </Select>
              <CategoryPicker
                categories={activeCats}
                value={resolvedCategoryId}
                onChange={setCategoryId}
                kind={kind}
              />
              <Select label={copy.forms.payment} value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </Select>
              <Checkbox
                label={copy.forms.recurringPayment}
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="self-end"
              />
              <div className="flex flex-col gap-2 md:col-span-2 sm:flex-row sm:items-end">
                {formError && (
                  <p className="text-sm text-destructive sm:mr-auto sm:mb-2 sm:flex-1" role="alert">
                    {formError}
                  </p>
                )}
                <Button type="submit" disabled={saving} className="sm:w-auto">
                  {saving ? copy.buttons.saving : edit ? copy.labels.update : copy.buttons.save}
                </Button>
                <Button type="button" variant="ghost" onClick={resetForm}>
                  {copy.buttons.cancel}
                </Button>
                {forceDuplicate && !edit && (
                  <Button type="submit" variant="outline" size="sm">
                    {copy.buttons.saveAnyway}
                  </Button>
                )}
              </div>
            </form>
            {!edit && (
              <Hint className="mt-4 md:col-span-2">
                {copy.forms.transactionHint}
              </Hint>
            )}
          </CardContent>
        </Card>
      )}

      {searched.length === 0 ? (
        <EmptyState
          minimal
          title={copy.empty.noTransactions.title}
          description={copy.empty.noTransactions.description}
          action={
            <Button size="sm" onClick={() => setQuickAddOpen(true, "expense")}>
              {copy.buttons.addTransaction}
            </Button>
          }
        />
      ) : (
        <Card className="border-border/60 shadow-none">
          <CardContent className="p-0">
            <div>
              {dayGroups.map(([day, group]) => (
                <section key={day}>
                  <h2 className="sticky top-14 z-10 bg-bg px-4 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-2">
                    {group.label} · {group.total < 0 ? "−" : "+"}
                    {formatINR(Math.abs(group.total))}
                  </h2>
                  <div>
                    {group.rows.map((t) => (
                      <SwipeTransactionRow
                        key={t.id}
                        transaction={t}
                        categoryName={cats.get(t.categoryId)?.name}
                        onEdit={startEdit}
                        onDelete={remove}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
            {searched.length > visible.length && (
              <button
                type="button"
                className="h-11 w-full text-sm text-ink-2"
                onClick={() => setWindowSize((size) => size + 80)}
              >
                Show more
              </button>
            )}
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}

function TransactionsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tab = searchParams.get("tab");
  useEffect(() => {
    if (tab === "bills") router.replace("/bills");
    else if (tab === "subscriptions") router.replace("/subscriptions");
    else if (tab === "emi") router.replace("/emi");
    else if (tab === "income") router.replace("/income");
  }, [router, tab]);
  const addParam = searchParams.get("add");
  const editId = searchParams.get("edit");
  const openAdd = addParam != null;
  const initialKind = addParam === "income" ? "income" : "expense";

  return (
    <FinanceGate>
      {(data) => (
        <TransactionsContent
          data={data}
          initialShowForm={openAdd}
          initialKind={initialKind}
          editId={editId}
        />
      )}
    </FinanceGate>
  );
}

export default function Page() {
  return (
    <Suspense>
      <TransactionsPage />
    </Suspense>
  );
}

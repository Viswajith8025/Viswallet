"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader, EmptyState, PageContainer } from "@/components/ui/page";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FinanceGate } from "@/components/layout/finance-gate";
import { FadeIn } from "@/components/ui/motion";
import { TransactionRow } from "@/components/shared/transaction-row";
import { CategoryPicker } from "@/components/categories/category-picker";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { Checkbox } from "@/components/ui/checkbox";
import { Hint } from "@/components/ui/hint";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { TabBar } from "@/components/ui/tab-bar";
import { DataList } from "@/components/ui/list";
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

  const cats = categoryMap(data.categories);
  const list = useMemo(
    () => data.transactions.filter((t) => filter === "all" || t.kind === filter),
    [data.transactions, filter],
  );
  const pagination = usePagination(list, 50);
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
      </FadeIn>

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

      {list.length === 0 ? (
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
            <DataList inset>
              {pagination.items.map((t) => (
                <TransactionRow
                  key={t.id}
                  transaction={t}
                  categoryName={cats.get(t.categoryId)?.name}
                  categoryColor={cats.get(t.categoryId)?.color}
                  categoryIconName={cats.get(t.categoryId)?.iconName}
                  showActions
                  onEdit={startEdit}
                  onDelete={remove}
                />
              ))}
            </DataList>
            <PaginationControls
              page={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalItems}
              pageSize={pagination.pageSize}
              hasPrev={pagination.hasPrev}
              hasNext={pagination.hasNext}
              onPrev={pagination.prev}
              onNext={pagination.next}
            />
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}

function TransactionsPage() {
  const searchParams = useSearchParams();
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

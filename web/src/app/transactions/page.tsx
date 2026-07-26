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
import { PaginationControls } from "@/components/shared/pagination-controls";
import { Checkbox } from "@/components/ui/checkbox";
import { Hint } from "@/components/ui/hint";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { DataList } from "@/components/ui/list";
import { useCategories } from "@/lib/queries/use-finance";
import { useInvalidateFinance, usePagination } from "@/hooks";
import { categoryMap } from "@/lib/engines/finance-snapshot";
import type { FinanceSnapshot } from "@/lib/engines/finance-snapshot";
import { getSettings } from "@/lib/db";
import { addTransaction, updateTransactionWithLock } from "@/lib/db/repositories/transactions";
import { restoreTransaction, softDeleteTransaction } from "@/lib/db/integrity";
import { DuplicateTransactionError, OptimisticLockError } from "@/lib/db/errors";
import type { Transaction } from "@/lib/db/types";
import { parseRupeeInput, formatINR } from "@/lib/money";
import { getMonthKey } from "@/lib/salary-cycle";
import { PAYMENT_METHODS } from "@/lib/categories-default";
import { sanitizeTitle } from "@/lib/security";
import {
  getLastPaymentMethod,
  pickDefaultCategoryId,
  setLastCategoryId,
  setLastPaymentMethod,
} from "@/lib/ux/defaults";
import { confirmAction } from "@/lib/store/confirm-store";
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
    setEdit(t);
    setTitle(t.title);
    setAmount(String(t.amountPaise / 100));
    setKind(t.kind);
    setCategoryId(String(t.categoryId));
    setPaymentMethod(t.paymentMethod);
    setIsRecurring(t.isRecurring);
    setShowForm(true);
    setFormError("");
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
    if (!title.trim() || paise <= 0) {
      setFormError("Enter a title and amount greater than zero.");
      return;
    }
    setFormError("");
    setSaving(true);
    try {
      const settings = await getSettings();
      const occurredAt = edit ? new Date(edit.occurredAt) : new Date();
      const monthKey = getMonthKey(occurredAt, settings.salaryDay);
      const catId = Number(resolvedCategoryId || categories[0]?.id);

      if (edit?.id) {
        await updateTransactionWithLock(
          edit.id,
          {
            title: sanitizeTitle(title),
            kind,
            amountPaise: paise,
            categoryId: catId,
            paymentMethod,
            monthKey,
            isRecurring,
          },
          edit.rowVersion ?? 1,
        );
        showToast("Transaction updated", { tone: "success" });
      } else {
        await addTransaction(
          {
            kind,
            title: sanitizeTitle(title),
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
        showToast(`${kind === "income" ? "Income" : "Expense"} saved`, { tone: "success" });
      }

      setLastPaymentMethod(paymentMethod);
      setLastCategoryId(kind, catId);
      await invalidate();
      resetForm();
      pagination.reset();
    } catch (err) {
      if (err instanceof DuplicateTransactionError) {
        setFormError("Similar transaction found today.");
        setForceDuplicate(true);
      } else if (err instanceof OptimisticLockError) {
        setFormError("Updated elsewhere — refresh and try again.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    const txn = data.transactions.find((t) => t.id === id);
    const ok = await confirmAction({
      title: "Delete transaction?",
      description: txn ? `"${txn.title}" (${formatINR(txn.amountPaise)}) will be removed.` : undefined,
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    await softDeleteTransaction(id);
    await invalidate();
    showToast("Transaction deleted", {
      tone: "default",
      undo: async () => {
        await restoreTransaction(id);
        await invalidate();
      },
    });
  }

  return (
    <PageContainer className="max-w-5xl space-y-6">
      <FadeIn>
        <PageHeader
          title="Transactions"
          description="Every rupee in and out, beautifully organized."
          actions={
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setStatementImportOpen(true)}>
                Import statement
              </Button>
              <Button variant="outline" onClick={() => openNew("income")}>
                Add income
              </Button>
              <Button onClick={() => openNew("expense")}>Add expense</Button>
            </div>
          }
        />
      </FadeIn>

      <SegmentedControl
        options={[
          { value: "all", label: "All" },
          { value: "expense", label: "Expense" },
          { value: "income", label: "Income" },
        ]}
        value={filter}
        onChange={(f) => {
          setFilter(f);
          pagination.reset();
        }}
        aria-label="Filter transactions"
      />

      {showForm && (
        <Card>
          <CardContent className="p-5 md:p-6">
            <div className="mb-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{edit ? "Edit transaction" : "New transaction"}</h3>
                <Badge variant={kind === "income" ? "success" : "primary"}>{kind}</Badge>
              </div>
              {previewPaise > 0 && (
                <p className="text-lg font-semibold tabular-nums text-primary">{formatINR(previewPaise)}</p>
              )}
            </div>
            <form onSubmit={save} className="grid gap-4 md:grid-cols-2">
              <Input label="Title" required value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
              <Input
                label="Amount (INR)"
                required
                type="number"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <Select label="Type" value={kind} onChange={(e) => handleKindChange(e.target.value as "expense" | "income")}>
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </Select>
              <Select
                label="Category"
                value={resolvedCategoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                {activeCats.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
              <Select label="Payment" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </Select>
              <Checkbox
                label="Recurring payment"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="self-end"
              />
              {formError && (
                <div className="md:col-span-2">
                  <p className="text-sm text-destructive" role="alert">
                    {formError}
                  </p>
                  {forceDuplicate && (
                    <Button type="submit" variant="outline" size="sm" className="mt-2">
                      Save anyway
                    </Button>
                  )}
                </div>
              )}
              <div className="flex items-end gap-2 md:col-span-2">
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving…" : edit ? "Update" : "Save"}
                </Button>
                <Button type="button" variant="ghost" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
            {!edit && (
              <Hint className="mt-4 md:col-span-2">
                We remember your last category and payment method. Duplicates on the same day are flagged automatically.
              </Hint>
            )}
          </CardContent>
        </Card>
      )}

      {list.length === 0 ? (
        <EmptyState
          title="No transactions"
          description="Add your first expense or income to begin tracking."
          illustration="transactions"
          action={
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => openNew("income")}>
                Add income
              </Button>
              <Button onClick={() => openNew("expense")}>Add expense</Button>
            </div>
          }
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <DataList>
              {pagination.items.map((t) => (
                <TransactionRow
                  key={t.id}
                  transaction={t}
                  categoryName={cats.get(t.categoryId)?.name}
                  categoryColor={cats.get(t.categoryId)?.color}
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

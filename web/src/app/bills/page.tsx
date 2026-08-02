"use client";

import { useState } from "react";
import { format, isPast, startOfDay } from "date-fns";
import { PageHeader, StatCard, EmptyState, PageContainer } from "@/components/ui/page";
import { DexiePageGate } from "@/components/layout/dexie-page-gate";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { db } from "@/lib/db";
import type { Bill } from "@/lib/db/types";
import { formatINR, parseRupeeInput } from "@/lib/money";
import { computeBillStatus, loadBillsWithSyncedStatus } from "@/lib/bills/status";
import { markBillPaid } from "@/lib/obligations/mark-bill-paid";
import { BillsTimeline } from "@/components/bills/bills-timeline";
import { copy } from "@/lib/ux/copy";
import { showToast } from "@/lib/store/toast-store";
import { useInvalidateFinance, useAsyncAction, useDexieTable } from "@/hooks";
import { confirmAction } from "@/lib/store/confirm-store";
import { notifyDataMutation } from "@/lib/db/notify-mutation";

export default function BillsPage() {
  const invalidate = useInvalidateFinance();
  const { loading: saving, run } = useAsyncAction();
  const { data: bills = [], isPending, isError, refetch } = useDexieTable(
    "bills",
    () => loadBillsWithSyncedStatus(),
  );
  const [showForm, setShowForm] = useState(false);
  const [edit, setEdit] = useState<Bill | null>(null);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueAt, setDueAt] = useState(format(new Date(), "yyyy-MM-dd"));
  const [isRecurring, setIsRecurring] = useState(false);
  const [notes, setNotes] = useState("");
  const [payingId, setPayingId] = useState<number | null>(null);

  const unpaid = bills.filter((b) => computeBillStatus(b) !== "paid");
  const dueTotal = unpaid.reduce((s, b) => s + b.amountPaise, 0);
  const overdueCount = unpaid.filter((b) => computeBillStatus(b) === "overdue").length;

  function resetForm() {
    setEdit(null);
    setName("");
    setAmount("");
    setDueAt(format(new Date(), "yyyy-MM-dd"));
    setIsRecurring(false);
    setNotes("");
    setShowForm(false);
  }

  function startEdit(b: Bill) {
    setEdit(b);
    setName(b.name);
    setAmount(String(b.amountPaise / 100));
    setDueAt(format(new Date(b.dueAt), "yyyy-MM-dd"));
    setIsRecurring(b.isRecurring);
    setNotes(b.notes ?? "");
    setShowForm(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const paise = parseRupeeInput(amount);
    if (!name.trim()) {
      showToast(copy.validation.billNameRequired, { tone: "error" });
      return;
    }
    if (paise <= 0) {
      showToast(copy.validation.amountRequired, { tone: "error" });
      return;
    }
    await run(async () => {
      const now = new Date();
      const due = new Date(dueAt);
      const status = isPast(startOfDay(due)) ? "overdue" : "upcoming";
      if (edit?.id) {
        await db.bills.update(edit.id, {
          name: name.trim(),
          amountPaise: paise,
          dueAt: due,
          isRecurring,
          notes: notes.trim() || undefined,
          status,
          updatedAt: now,
        });
      } else {
        await db.bills.add({
          name: name.trim(),
          amountPaise: paise,
          dueAt: due,
          status,
          isRecurring,
          notes: notes.trim() || undefined,
          createdAt: now,
          updatedAt: now,
        });
      }
      resetForm();
      notifyDataMutation();
      await invalidate();
    });
  }

  async function handleMarkPaid(id: number) {
    setPayingId(id);
    try {
      await markBillPaid(id);
      showToast(copy.toast.billPaid, { tone: "success" });
      await invalidate();
    } catch (err) {
      showToast(err instanceof Error ? err.message : copy.toast.billPayFailed, { tone: "error" });
    } finally {
      setPayingId(null);
    }
  }

  async function remove(id: number) {
    const bill = bills.find((b) => b.id === id);
    const ok = await confirmAction({
      title: copy.confirm.deleteBill,
      description: bill ? copy.confirmDesc.removeBill(bill.name, formatINR(bill.amountPaise)) : undefined,
      confirmLabel: copy.confirm.remove,
      destructive: true,
    });
    if (!ok) return;
    await db.bills.delete(id);
    notifyDataMutation();
    await invalidate();
  }

  return (
    <PageContainer className="max-w-5xl">
      <PageHeader
        eyebrow={copy.labels.money}
        title={copy.pages.bills.title}
        description={copy.pages.bills.description}
        actions={<Button onClick={() => { resetForm(); setShowForm(true); }}>{copy.buttons.addBill}</Button>}
        mobileActions={
          <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }}>
            {copy.buttons.addBill}
          </Button>
        }
      />

      <DexiePageGate isPending={isPending} isError={isError} onRetry={() => refetch()} label={copy.loading.bills}>
      <div className="space-y-8">

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label={copy.labels.unpaidTotal} value={formatINR(dueTotal)} tone={dueTotal > 0 ? "negative" : "default"} />
        <StatCard label={copy.labels.openBills} value={unpaid.length} />
        <StatCard label={copy.labels.overdue} value={overdueCount} tone={overdueCount > 0 ? "negative" : "default"} />
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-5">
            <form onSubmit={save} className="grid gap-4 md:grid-cols-2">
              <Input label={copy.forms.billName} required value={name} onChange={(e) => setName(e.target.value)} placeholder={copy.forms.billPlaceholder} />
              <Input label={copy.forms.amountInr} required type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
              <Input label={copy.forms.dueDate} required type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
              <Select label={copy.labels.recurring} value={isRecurring ? "yes" : "no"} onChange={(e) => setIsRecurring(e.target.value === "yes")}>
                <option value="no">{copy.labels.oneTime}</option>
                <option value="yes">{copy.labels.recurring}</option>
              </Select>
              <div className="md:col-span-2">
                <Textarea label={copy.forms.notes} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
              <div className="flex gap-2 md:col-span-2">
                <Button type="submit" disabled={saving}>{saving ? copy.buttons.saving : edit ? copy.labels.update : copy.buttons.save}</Button>
                <Button type="button" variant="ghost" onClick={resetForm}>{copy.buttons.cancel}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {bills.length === 0 ? (
        <EmptyState title={copy.empty.noBills.title} description={copy.empty.noBills.description} action={<Button onClick={() => setShowForm(true)}>{copy.buttons.addBill}</Button>} />
      ) : (
        <BillsTimeline
          bills={bills}
          payingId={payingId}
          onMarkPaid={handleMarkPaid}
          onEdit={startEdit}
          onDelete={remove}
        />
      )}
      </div>
      </DexiePageGate>
    </PageContainer>
  );
}

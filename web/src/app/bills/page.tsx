"use client";

import { useEffect, useState } from "react";
import { format, isPast, startOfDay } from "date-fns";
import { Check, Pencil, Trash2 } from "lucide-react";
import { PageHeader, StatCard, EmptyState } from "@/components/ui/page";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { useDb } from "@/components/providers/db-provider";
import { db } from "@/lib/db";
import type { Bill } from "@/lib/db/types";
import { formatINR, parseRupeeInput } from "@/lib/money";
import { computeBillStatus, loadBillsWithSyncedStatus } from "@/lib/bills/status";
import { useInvalidateFinance, useAsyncAction } from "@/hooks";
import { confirmAction } from "@/lib/store/confirm-store";

export default function BillsPage() {
  const { version } = useDb();
  const invalidate = useInvalidateFinance();
  const { loading: saving, run } = useAsyncAction();
  const [bills, setBills] = useState<Bill[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [edit, setEdit] = useState<Bill | null>(null);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueAt, setDueAt] = useState(format(new Date(), "yyyy-MM-dd"));
  const [isRecurring, setIsRecurring] = useState(false);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    loadBillsWithSyncedStatus().then(setBills);
  }, [version]);

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
    if (!name.trim() || paise <= 0) return;
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
      await invalidate();
    });
  }

  async function markPaid(id: number) {
    const now = new Date();
    await db.bills.update(id, { status: "paid", paidAt: now, updatedAt: now });
    await invalidate();
  }

  async function remove(id: number) {
    const bill = bills.find((b) => b.id === id);
    const ok = await confirmAction({
      title: "Delete bill?",
      description: bill ? `"${bill.name}" (${formatINR(bill.amountPaise)}) will be removed.` : undefined,
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    await db.bills.delete(id);
    await invalidate();
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <PageHeader
        title="Bills"
        description="Stay ahead of due dates and recurring payments."
        actions={<Button onClick={() => { resetForm(); setShowForm(true); }}>Add bill</Button>}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Unpaid total" value={formatINR(dueTotal)} tone={dueTotal > 0 ? "negative" : "default"} />
        <StatCard label="Open bills" value={unpaid.length} />
        <StatCard label="Overdue" value={overdueCount} tone={overdueCount > 0 ? "negative" : "default"} />
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-5">
            <form onSubmit={save} className="grid gap-4 md:grid-cols-2">
              <Input label="Bill name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Electricity" />
              <Input label="Amount (INR)" required type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
              <Input label="Due date" required type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
              <Select label="Recurring" value={isRecurring ? "yes" : "no"} onChange={(e) => setIsRecurring(e.target.value === "yes")}>
                <option value="no">One-time</option>
                <option value="yes">Recurring</option>
              </Select>
              <div className="md:col-span-2">
                <Textarea label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
              <div className="flex gap-2 md:col-span-2">
                <Button type="submit" disabled={saving}>{saving ? "Saving…" : edit ? "Update" : "Save"}</Button>
                <Button type="button" variant="ghost" onClick={resetForm}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {bills.length === 0 ? (
        <EmptyState title="No bills yet" description="Add your first bill to track due dates." action={<Button onClick={() => setShowForm(true)}>Add bill</Button>} />
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {bills.map((b) => {
                const status = computeBillStatus(b);
                return (
                  <li key={b.id} className="flex items-center justify-between gap-3 px-5 py-4">
                    <div>
                      <p className="font-medium">{b.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Due {format(new Date(b.dueAt), "dd MMM yyyy")}
                        {b.isRecurring && " · Recurring"}
                        {" · "}
                        <span className={status === "overdue" ? "text-destructive" : status === "paid" ? "text-success" : ""}>
                          {status}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="tabular-nums font-semibold">{formatINR(b.amountPaise)}</span>
                      {status !== "paid" && (
                        <Button size="icon" variant="ghost" title="Mark paid" onClick={() => b.id && markPaid(b.id)}>
                          <Check size={14} className="text-success" />
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" onClick={() => startEdit(b)}><Pencil size={14} /></Button>
                      <Button size="icon" variant="ghost" onClick={() => b.id && remove(b.id)}><Trash2 size={14} className="text-destructive" /></Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

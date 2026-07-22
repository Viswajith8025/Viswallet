"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Pencil, Trash2 } from "lucide-react";
import { PageHeader, StatCard, EmptyState, PageContainer } from "@/components/ui/page";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { db } from "@/lib/db";
import type { Loan } from "@/lib/db/types";
import { formatINR, parseRupeeInput } from "@/lib/money";
import { useDexieTable, useInvalidateFinance, useAsyncAction } from "@/hooks";
import { confirmAction } from "@/lib/store/confirm-store";

export function LoanList({ direction }: { direction: Loan["direction"] }) {
  const invalidate = useInvalidateFinance();
  const { loading: saving, run } = useAsyncAction();
  const { data: loans = [] } = useDexieTable(`loans-${direction}`, () =>
    db.loans.filter((l) => !l.isDeleted && l.direction === direction).toArray(),
  );

  const [showForm, setShowForm] = useState(false);
  const [edit, setEdit] = useState<Loan | null>(null);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [payLoanId, setPayLoanId] = useState<number | null>(null);
  const [payAmount, setPayAmount] = useState("");

  const isLent = direction === "lent_by_me";
  const title = isLent ? "Lent money" : "Borrowed money";
  const desc = isLent ? "Track money you gave to others" : "Track money you borrowed from others";

  const outstanding = loans.filter((l) => l.status !== "returned").reduce((s, l) => s + l.balancePaise, 0);
  const activeCount = loans.filter((l) => l.status !== "returned").length;

  function resetForm() {
    setEdit(null);
    setName("");
    setAmount("");
    setReason("");
    setShowForm(false);
  }

  function startEdit(l: Loan) {
    setEdit(l);
    setName(l.personName);
    setAmount(String(l.principalPaise / 100));
    setReason(l.reason ?? "");
    setShowForm(true);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const paise = parseRupeeInput(amount);
    if (!name.trim() || paise <= 0) return;
    await run(async () => {
      const now = new Date();
      if (edit?.id) {
        const diff = paise - edit.principalPaise;
        await db.loans.update(edit.id, {
          personName: name.trim(),
          principalPaise: paise,
          balancePaise: Math.max(0, edit.balancePaise + diff),
          reason: reason.trim() || undefined,
          updatedAt: now,
        });
      } else {
        await db.loans.add({
          personName: name.trim(),
          direction,
          principalPaise: paise,
          balancePaise: paise,
          reason: reason.trim() || undefined,
          borrowedAt: now,
          status: "pending",
          isDeleted: false,
          createdAt: now,
          updatedAt: now,
        });
      }
      resetForm();
      await invalidate();
    });
  }

  async function handlePayment(e: React.FormEvent) {
    e.preventDefault();
    if (!payLoanId) return;
    const paise = parseRupeeInput(payAmount);
    if (paise <= 0) return;
    await run(async () => {
      const loan = await db.loans.get(payLoanId);
      if (!loan) return;
      const now = new Date();
      const newBalance = Math.max(0, loan.balancePaise - paise);
      await db.loanPayments.add({
        loanId: payLoanId,
        amountPaise: paise,
        paidAt: now,
        createdAt: now,
      });
      await db.loans.update(payLoanId, {
        balancePaise: newBalance,
        status: newBalance === 0 ? "returned" : "partial",
        updatedAt: now,
      });
      setPayLoanId(null);
      setPayAmount("");
      await invalidate();
    });
  }

  async function remove(id: number) {
    const loan = loans.find((l) => l.id === id);
    const ok = await confirmAction({
      title: "Delete entry?",
      description: loan ? `"${loan.personName}" (${formatINR(loan.balancePaise)} outstanding) will be removed.` : undefined,
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    await db.loans.update(id, { isDeleted: true, updatedAt: new Date() });
    await invalidate();
  }

  return (
    <PageContainer className="max-w-5xl">
      <PageHeader
        title={title}
        description={desc}
        actions={
          <Button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
          >
            Add entry
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        <StatCard label="Outstanding" value={formatINR(outstanding)} tone={outstanding > 0 ? "negative" : "default"} />
        <StatCard label="Active entries" value={activeCount} />
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-5">
            <form onSubmit={handleAdd} className="grid gap-4 md:grid-cols-2">
              <Input label="Person name" required value={name} onChange={(e) => setName(e.target.value)} />
              <Input label="Amount (INR)" required type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
              <div className="md:col-span-2">
                <Textarea label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} />
              </div>
              <div className="flex gap-2 md:col-span-2">
                <Button type="submit" disabled={saving}>{saving ? "Saving…" : edit ? "Update" : "Save"}</Button>
                <Button type="button" variant="ghost" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {payLoanId && (
        <Card>
          <CardContent className="p-5">
            <form onSubmit={handlePayment} className="flex flex-wrap items-end gap-3">
              <Input label="Payment amount (INR)" type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
              <Button type="submit" disabled={saving}>{saving ? "Recording…" : "Record payment"}</Button>
              <Button type="button" variant="ghost" onClick={() => setPayLoanId(null)}>
                Cancel
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {loans.length === 0 ? (
        <EmptyState
          title="No entries yet"
          description="Add your first loan to start tracking."
          action={<Button onClick={() => setShowForm(true)}>Add entry</Button>}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {loans.map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-3 px-5 py-4">
                  <div>
                    <p className="font-medium">{l.personName}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(l.borrowedAt), "dd MMM yyyy")} · {l.status}
                      {l.reason && ` · ${l.reason}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="font-semibold tabular-nums">{formatINR(l.balancePaise)}</p>
                      <p className="text-xs text-muted-foreground">of {formatINR(l.principalPaise)}</p>
                    </div>
                    {l.status !== "returned" && (
                      <Button size="sm" variant="outline" onClick={() => setPayLoanId(l.id!)}>
                        Pay
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" onClick={() => startEdit(l)} aria-label="Edit">
                      <Pencil size={14} />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => l.id && remove(l.id)} aria-label="Delete">
                      <Trash2 size={14} className="text-destructive" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}

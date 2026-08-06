"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ArrowUpRight, Pencil, Plus, Trash2, HandCoins } from "lucide-react";
import { PageHeader, PageContainer } from "@/components/ui/page";
import { DexiePageGate } from "@/components/layout/dexie-page-gate";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { db } from "@/lib/db";
import type { Loan } from "@/lib/db/types";
import { formatINR, parseRupeeInput } from "@/lib/money";
import { useDexieTable, useInvalidateFinance, useAsyncAction } from "@/hooks";
import { confirmAction } from "@/lib/store/confirm-store";
import { markLentFullyReturned, loanProgress, recordLoanPayment, createLentLoan, updateLentLoan, archiveLentLoan } from "@/lib/loans/record-loan-payment";
import { copy, toastCopy } from "@/lib/ux/copy";
import { showToast } from "@/lib/store/toast-store";
import { notifyDataMutation } from "@/lib/db/notify-mutation";
import { LoanDueBadge } from "@/components/loans/loan-due-badge";
import { defaultLoanDueDate, parseLoanDueInput, getLoanDueStatus } from "@/lib/loans/loan-due";
import { cn } from "@/lib/design/cn";

export function LentExperience() {
  const invalidate = useInvalidateFinance();
  const { loading: saving, run } = useAsyncAction();
  const { data: loans = [], isPending, isError, refetch } = useDexieTable("loans-lent", () =>
    db.loans.filter((l) => !l.isDeleted && l.direction === "lent_by_me").toArray(),
  );

  const [showForm, setShowForm] = useState(false);
  const [edit, setEdit] = useState<Loan | null>(null);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [payingId, setPayingId] = useState<number | null>(null);
  const [partialLoanId, setPartialLoanId] = useState<number | null>(null);
  const [partialAmount, setPartialAmount] = useState("");

  const active = loans.filter((l) => l.status !== "returned");
  const outstanding = active.reduce((s, l) => s + l.balancePaise, 0);

  function resetForm() {
    setEdit(null);
    setName("");
    setAmount("");
    setReason("");
    setDueAt("");
    setShowForm(false);
  }

  function startEdit(l: Loan) {
    setEdit(l);
    setName(l.personName);
    setAmount(String(l.principalPaise / 100));
    setReason(l.reason ?? "");
    setDueAt(
      l.expectedReturnAt ? format(new Date(l.expectedReturnAt), "yyyy-MM-dd") : "",
    );
    setShowForm(true);
  }

  function openAddForm() {
    resetForm();
    setDueAt(defaultLoanDueDate());
    setShowForm(true);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const paise = parseRupeeInput(amount);
    if (!name.trim() || paise <= 0) return;
    await run(async () => {
      const expectedReturnAt = parseLoanDueInput(dueAt);
      if (edit?.id) {
        const diff = paise - edit.principalPaise;
        await updateLentLoan(edit.id, {
          personName: name.trim(),
          principalPaise: paise,
          balancePaise: Math.max(0, edit.balancePaise + diff),
          reason: reason.trim() || undefined,
          expectedReturnAt,
        });
        showToast(copy.toast.entryUpdated, { tone: "success" });
      } else {
        await createLentLoan({
          personName: name.trim(),
          amountPaise: paise,
          reason: reason.trim() || undefined,
          expectedReturnAt,
        });
        showToast(toastCopy.lent(paise), { tone: "success" });
      }
      resetForm();
      notifyDataMutation();
      await invalidate();
    });
  }

  async function handleMarkReturned(loan: Loan) {
    if (!loan.id) return;
    setPayingId(loan.id);
    try {
      await markLentFullyReturned(loan.id);
      showToast(toastCopy.received(loan.balancePaise), { tone: "success" });
      await invalidate();
    } catch (err) {
      showToast(err instanceof Error ? err.message : copy.errors.generic, { tone: "error" });
    } finally {
      setPayingId(null);
    }
  }

  async function handlePartialReturn(loan: Loan, payAmount: string) {
    if (!loan.id) return;
    const paise = parseRupeeInput(payAmount);
    if (paise <= 0) return;
    setPayingId(loan.id);
    try {
      await recordLoanPayment(loan.id, paise, { linkTransaction: true });
      showToast(toastCopy.received(paise), { tone: "success" });
      await invalidate();
    } catch (err) {
      showToast(err instanceof Error ? err.message : copy.errors.generic, { tone: "error" });
    } finally {
      setPayingId(null);
    }
  }

  async function remove(id: number) {
    const ok = await confirmAction({
      title: copy.confirm.deleteLoan,
      confirmLabel: copy.confirm.remove,
      destructive: true,
    });
    if (!ok) return;
    await archiveLentLoan(id);
    notifyDataMutation();
    await invalidate();
  }

  return (
    <DexiePageGate isPending={isPending} isError={isError} onRetry={() => refetch()}>
    <PageContainer className="max-w-3xl">
      <PageHeader
        eyebrow="Credit"
        title="Lent"
        description="Money others owe you. Mark returned when they pay back — it becomes income."
        actions={
          <Button onClick={openAddForm}>
            <Plus size={16} className="mr-1" />
            Add lent
          </Button>
        }
      />

      <Card className="overflow-hidden border-success/20 bg-gradient-to-br from-success/[0.08] via-card to-card">
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-success">
                <ArrowUpRight size={18} />
                <span className="text-sm font-medium">Others owe you</span>
              </div>
              <p className="mt-2 font-display text-4xl font-semibold tabular-nums tracking-tight">
                {formatINR(outstanding)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{active.length} waiting for return</p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-success/10 text-success">
              <HandCoins size={28} strokeWidth={1.5} />
            </div>
          </div>
        </CardContent>
      </Card>

      {showForm && (
        <Card className="animate-fade-in border-success/20">
          <CardContent className="p-5">
            <form onSubmit={handleAdd} className="space-y-4">
              <Input label="Who lent to?" required value={name} onChange={(e) => setName(e.target.value)} />
              <Input label="Amount (₹)" required type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
              <Textarea label="Reason (optional)" value={reason} onChange={(e) => setReason(e.target.value)} />
              <Input
                label="Return by (optional)"
                type="date"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
                hint="Shows on your dashboard as a reminder"
              />
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>{saving ? "Saving…" : edit ? "Update" : "Save"}</Button>
                <Button type="button" variant="ghost" onClick={resetForm}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {active.length === 0 && !showForm ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <HandCoins size={40} className="text-muted-foreground" />
            <p className="font-medium">No money lent out</p>
            <Button onClick={openAddForm}>Lend money</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {active.map((loan) => (
            <Card key={loan.id} className={cn(
              "surface-card surface-interactive",
              loan.expectedReturnAt && getLoanDueStatus(loan) === "overdue" && "border-warning/40",
            )}>
              <CardContent className="p-5">
                <div className="flex justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold">{loan.personName}</p>
                    {loan.reason && <p className="text-sm text-muted-foreground">{loan.reason}</p>}
                    <p className="text-xs text-muted-foreground mt-1">
                      Since {format(new Date(loan.borrowedAt), "dd MMM yyyy")}
                    </p>
                    <LoanDueBadge loan={loan} direction="lent_by_me" className="mt-1" />
                  </div>
                  <p className="text-2xl font-bold tabular-nums text-success">{formatINR(loan.balancePaise)}</p>
                </div>
                {loanProgress(loan) > 0 && (
                  <div className="mt-3 space-y-1">
                    <Progress value={loanProgress(loan)} className="h-1.5" />
                    <p className="text-xs text-muted-foreground">{loanProgress(loan)}% returned</p>
                  </div>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    disabled={payingId === loan.id}
                    onClick={() => handleMarkReturned(loan)}
                  >
                    {payingId === loan.id ? "Saving…" : `Mark returned ${formatINR(loan.balancePaise)}`}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPartialLoanId(partialLoanId === loan.id ? null : loan.id!)}
                  >
                    Partial
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => startEdit(loan)}><Pencil size={14} /></Button>
                  <Button size="icon" variant="ghost" onClick={() => loan.id && remove(loan.id)}><Trash2 size={14} className="text-destructive" /></Button>
                </div>
                {partialLoanId === loan.id && (
                  <div className="mt-3 flex gap-2 animate-fade-in">
                    <Input
                      type="number"
                      inputMode="decimal"
                      placeholder="Partial amount"
                      value={partialAmount}
                      onChange={(e) => setPartialAmount(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      disabled={payingId === loan.id || !partialAmount}
                      onClick={() => {
                        handlePartialReturn(loan, partialAmount);
                        setPartialAmount("");
                        setPartialLoanId(null);
                      }}
                    >
                      Receive
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageContainer>
    </DexiePageGate>
  );
}

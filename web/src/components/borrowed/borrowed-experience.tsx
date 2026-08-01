"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ArrowDownLeft, Pencil, Plus, Trash2, Wallet } from "lucide-react";
import { PageHeader, PageContainer } from "@/components/ui/page";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { db } from "@/lib/db";
import type { Loan } from "@/lib/db/types";
import { formatINR, parseRupeeInput } from "@/lib/money";
import { useDexieTable, useInvalidateFinance, useAsyncAction } from "@/hooks";
import { confirmAction } from "@/lib/store/confirm-store";
import { markBorrowedFullyPaid, loanProgress, recordLoanPayment } from "@/lib/loans/record-loan-payment";
import { showToast } from "@/lib/store/toast-store";
import { notifyDataMutation } from "@/lib/db/notify-mutation";
import { cn } from "@/lib/design/cn";
import { LoanDueBadge } from "@/components/loans/loan-due-badge";
import { defaultLoanDueDate, parseLoanDueInput, getLoanDueStatus } from "@/lib/loans/loan-due";

export function BorrowedExperience() {
  const invalidate = useInvalidateFinance();
  const { loading: saving, run } = useAsyncAction();
  const { data: loans = [] } = useDexieTable("loans-borrowed", () =>
    db.loans.filter((l) => !l.isDeleted && l.direction === "borrowed_by_me").toArray(),
  );

  const [showForm, setShowForm] = useState(false);
  const [edit, setEdit] = useState<Loan | null>(null);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [payingId, setPayingId] = useState<number | null>(null);

  const active = loans.filter((l) => l.status !== "returned");
  const outstanding = active.reduce((s, l) => s + l.balancePaise, 0);
  const cleared = loans.filter((l) => l.status === "returned");

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
      const now = new Date();
      const expectedReturnAt = parseLoanDueInput(dueAt);
      if (edit?.id) {
        const diff = paise - edit.principalPaise;
        await db.loans.update(edit.id, {
          personName: name.trim(),
          principalPaise: paise,
          balancePaise: Math.max(0, edit.balancePaise + diff),
          reason: reason.trim() || undefined,
          expectedReturnAt,
          updatedAt: now,
        });
        showToast("Entry updated", { tone: "success" });
      } else {
        await db.loans.add({
          personName: name.trim(),
          direction: "borrowed_by_me",
          principalPaise: paise,
          balancePaise: paise,
          reason: reason.trim() || undefined,
          borrowedAt: now,
          expectedReturnAt,
          status: "pending",
          isDeleted: false,
          createdAt: now,
          updatedAt: now,
        });
        showToast(
          `Borrowed ${formatINR(paise)} — mark as paid on dashboard when you repay`,
          { tone: "success" },
        );
      }
      resetForm();
      notifyDataMutation();
      await invalidate();
    });
  }

  async function handleMarkPaid(loan: Loan) {
    if (!loan.id) return;
    setPayingId(loan.id);
    try {
      const result = await markBorrowedFullyPaid(loan.id);
      showToast(
        `Paid ${formatINR(loan.balancePaise)} to ${loan.personName} — logged as expense`,
        { tone: "success" },
      );
      if (result.fullyPaid) {
        showToast("Debt cleared!", { tone: "success" });
      }
      await invalidate();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Payment failed", { tone: "error" });
    } finally {
      setPayingId(null);
    }
  }

  async function handlePartialPay(loan: Loan, payAmount: string) {
    if (!loan.id) return;
    const paise = parseRupeeInput(payAmount);
    if (paise <= 0) return;
    setPayingId(loan.id);
    try {
      await recordLoanPayment(loan.id, paise, { linkTransaction: true });
      showToast(`Paid ${formatINR(paise)} — logged as expense`, { tone: "success" });
      await invalidate();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Payment failed", { tone: "error" });
    } finally {
      setPayingId(null);
    }
  }

  async function remove(id: number) {
    const loan = loans.find((l) => l.id === id);
    const ok = await confirmAction({
      title: "Remove this entry?",
      description: loan ? `"${loan.personName}" will be deleted.` : undefined,
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    await db.loans.update(id, { isDeleted: true, updatedAt: new Date() });
    notifyDataMutation();
    await invalidate();
  }

  return (
    <PageContainer className="max-w-3xl">
      <PageHeader
        eyebrow="Credit"
        title="Borrowed"
        description="Money you owe others. Mark as paid when you repay — it becomes an expense automatically."
        actions={
          <Button onClick={openAddForm}>
            <Plus size={16} className="mr-1" />
            Add borrowed
          </Button>
        }
      />

      {/* Hero debt summary */}
      <Card className="overflow-hidden border-destructive/20 bg-gradient-to-br from-destructive/[0.08] via-card to-card">
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-destructive">
                <ArrowDownLeft size={18} />
                <span className="text-sm font-medium">You owe</span>
              </div>
              <p className="mt-2 font-display text-4xl font-semibold tabular-nums tracking-tight">
                {formatINR(outstanding)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {active.length} active · {cleared.length} cleared
              </p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
              <Wallet size={28} strokeWidth={1.5} />
            </div>
          </div>
          {outstanding > 0 && (
            <p className="mt-4 rounded-lg bg-background/60 px-3 py-2 text-xs text-muted-foreground">
              Tip: Use <strong className="text-foreground">Mark as paid</strong> on the dashboard or here — we deduct the balance and add an expense entry.
            </p>
          )}
        </CardContent>
      </Card>

      {showForm && (
        <Card className="animate-fade-in border-primary/20">
          <CardContent className="p-5">
            <form onSubmit={handleAdd} className="space-y-4">
              <Input
                label="Who did you borrow from?"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Friend, family, colleague…"
              />
              <Input
                label="Amount (₹)"
                required
                type="number"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="5000"
              />
              <Textarea
                label="What for? (optional)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Emergency, trip, gadget…"
              />
              <Input
                label="Pay by (optional)"
                type="date"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
                hint="Shows on your dashboard as a reminder"
              />
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving…" : edit ? "Update" : "Save borrowed"}
                </Button>
                <Button type="button" variant="ghost" onClick={resetForm}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {active.length === 0 && !showForm ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <ArrowDownLeft size={28} />
            </div>
            <div>
              <p className="font-medium">No borrowed money</p>
              <p className="mt-1 text-sm text-muted-foreground max-w-sm">
                When you borrow from someone, add it here. We&apos;ll remind you on the dashboard to mark it paid.
              </p>
            </div>
            <Button onClick={openAddForm}>Add borrowed money</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {active.map((loan) => (
            <BorrowedCard
              key={loan.id}
              loan={loan}
              paying={payingId === loan.id}
              onMarkPaid={() => handleMarkPaid(loan)}
              onPartialPay={(amt) => handlePartialPay(loan, amt)}
              onEdit={() => startEdit(loan)}
              onDelete={() => loan.id && remove(loan.id)}
            />
          ))}
        </div>
      )}

      {cleared.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground px-1">Cleared</h2>
          {cleared.map((loan) => (
            <Card key={loan.id} className="opacity-70">
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">{loan.personName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatINR(loan.principalPaise)} · cleared
                  </p>
                </div>
                <Button size="icon" variant="ghost" onClick={() => loan.id && remove(loan.id)} aria-label="Delete">
                  <Trash2 size={14} className="text-destructive" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </section>
      )}
    </PageContainer>
  );
}

function BorrowedCard({
  loan,
  paying,
  onMarkPaid,
  onPartialPay,
  onEdit,
  onDelete,
}: {
  loan: Loan;
  paying: boolean;
  onMarkPaid: () => void;
  onPartialPay: (amount: string) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [showPartial, setShowPartial] = useState(false);
  const [partialAmount, setPartialAmount] = useState("");
  const progress = loanProgress(loan);

  return (
    <Card
      className={cn(
        "surface-card surface-interactive overflow-hidden transition-all",
        loan.balancePaise > 50_000_00 && "border-destructive/25",
        loan.expectedReturnAt && getLoanDueStatus(loan) === "overdue" && "border-destructive/40",
      )}
    >
      <CardContent className="p-0">
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-lg font-semibold">{loan.personName}</p>
              {loan.reason && (
                <p className="text-sm text-muted-foreground mt-0.5">{loan.reason}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Since {format(new Date(loan.borrowedAt), "dd MMM yyyy")}
              </p>
              <LoanDueBadge loan={loan} direction="borrowed_by_me" className="mt-1" />
            </div>
            <div className="text-right shrink-0">
              <p className="text-2xl font-bold tabular-nums text-destructive">
                {formatINR(loan.balancePaise)}
              </p>
              <p className="text-xs text-muted-foreground">of {formatINR(loan.principalPaise)}</p>
            </div>
          </div>

          {progress > 0 && (
            <div className="mt-4 space-y-1">
              <Progress value={progress} className="h-1.5" />
              <p className="text-xs text-muted-foreground">{progress}% repaid</p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-border/50 bg-muted/30 px-4 py-3">
          <Button
            size="sm"
            className="flex-1 sm:flex-none"
            disabled={paying}
            onClick={onMarkPaid}
          >
            {paying ? "Processing…" : `Mark paid ${formatINR(loan.balancePaise)}`}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowPartial((v) => !v)}
          >
            Partial
          </Button>
          <Button size="icon" variant="ghost" onClick={onEdit} aria-label="Edit">
            <Pencil size={14} />
          </Button>
          <Button size="icon" variant="ghost" onClick={onDelete} aria-label="Delete">
            <Trash2 size={14} className="text-destructive" />
          </Button>
        </div>

        {showPartial && (
          <div className="border-t border-border/50 px-4 py-3 animate-fade-in">
            <div className="flex gap-2">
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
                disabled={paying || !partialAmount}
                onClick={() => {
                  onPartialPay(partialAmount);
                  setPartialAmount("");
                  setShowPartial(false);
                }}
              >
                Pay
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

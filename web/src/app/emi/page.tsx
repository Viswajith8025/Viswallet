"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Pencil, Trash2 } from "lucide-react";
import { PageHeader, StatCard, EmptyState, PageContainer } from "@/components/ui/page";
import { DexiePageGate } from "@/components/layout/dexie-page-gate";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { db } from "@/lib/db";
import type { Emi } from "@/lib/db/types";
import { formatINR, parseRupeeInput, parseInterestRate } from "@/lib/money";
import { Progress } from "@/components/ui/progress";
import { useInvalidateFinance, useDexieTable } from "@/hooks";
import { confirmAction } from "@/lib/store/confirm-store";
import { notifyDataMutation } from "@/lib/db/notify-mutation";
import { markEmiPaid } from "@/lib/obligations/mark-emi-paid";
import { copy } from "@/lib/ux/copy";
import { showToast } from "@/lib/store/toast-store";

export default function EmiPage() {
  const invalidate = useInvalidateFinance();
  const { data: emis = [], isPending, isError, refetch } = useDexieTable(
    "emis",
    () => db.emis.filter((e) => e.isActive).toArray(),
  );
  const [showForm, setShowForm] = useState(false);
  const [edit, setEdit] = useState<Emi | null>(null);
  const [name, setName] = useState("");
  const [lender, setLender] = useState("");
  const [principal, setPrincipal] = useState("");
  const [emiAmount, setEmiAmount] = useState("");
  const [balance, setBalance] = useState("");
  const [rate, setRate] = useState("");
  const [tenure, setTenure] = useState("");
  const [nextDue, setNextDue] = useState(format(new Date(), "yyyy-MM-dd"));
  const [saving, setSaving] = useState(false);

  const monthlyTotal = emis.reduce((s, e) => s + e.emiAmountPaise, 0);
  const totalBalance = emis.reduce((s, e) => s + e.balancePaise, 0);

  function resetForm() {
    setEdit(null);
    setName("");
    setLender("");
    setPrincipal("");
    setEmiAmount("");
    setBalance("");
    setRate("");
    setTenure("");
    setNextDue(format(new Date(), "yyyy-MM-dd"));
    setShowForm(false);
  }

  function startEdit(e: Emi) {
    setEdit(e);
    setName(e.name);
    setLender(e.lender);
    setPrincipal(String(e.principalPaise / 100));
    setEmiAmount(String(e.emiAmountPaise / 100));
    setBalance(String(e.balancePaise / 100));
    setRate(String(e.interestRate));
    setTenure(String(e.tenureMonths));
    setNextDue(format(new Date(e.nextDueAt), "yyyy-MM-dd"));
    setShowForm(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    const principalPaise = parseRupeeInput(principal);
    const emiAmountPaise = parseRupeeInput(emiAmount);
    const bal = balance.trim() ? parseRupeeInput(balance) : principalPaise;
    if (!name.trim() || !lender.trim() || emiAmountPaise <= 0) {
      if (emiAmountPaise <= 0) showToast(copy.validation.amountRequired, { tone: "error" });
      else if (!name.trim() || !lender.trim()) showToast(copy.formErrors.nameRequired, { tone: "error" });
      return;
    }
    setSaving(true);
    try {
    const now = new Date();
    const payload = {
      name: name.trim(),
      lender: lender.trim(),
      principalPaise,
      emiAmountPaise,
      balancePaise: bal,
      interestRate: parseInterestRate(rate),
      tenureMonths: Math.min(Math.max(parseInt(tenure, 10) || 12, 1), 600),
      nextDueAt: new Date(nextDue),
      isActive: true,
      updatedAt: now,
    };
    if (edit?.id) {
      await db.emis.update(edit.id, { ...payload, paidMonths: edit.paidMonths });
    } else {
      await db.emis.add({ ...payload, paidMonths: 0, createdAt: now });
    }
    resetForm();
    notifyDataMutation();
    await invalidate();
    } catch (err) {
      showToast(err instanceof Error ? err.message : copy.toast.actionFailed, { tone: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function recordPayment(id: number) {
    try {
      await markEmiPaid(id);
      showToast(copy.toast.emiPaid, { tone: "success" });
      await invalidate();
    } catch (err) {
      showToast(err instanceof Error ? err.message : copy.toast.paymentFailed, { tone: "error" });
    }
  }

  async function remove(id: number) {
    const emi = emis.find((e) => e.id === id);
    const ok = await confirmAction({
      title: copy.confirm.removeEmi,
      description: emi ? copy.confirmDesc.archiveEmi(emi.name) : undefined,
      confirmLabel: copy.confirm.archive,
      destructive: true,
    });
    if (!ok) return;
    await db.emis.update(id, { isActive: false, updatedAt: new Date() });
    notifyDataMutation();
    await invalidate();
  }

  return (
    <PageContainer className="max-w-5xl">
      <PageHeader
        title={copy.pages.emi.title}
        description={copy.pages.emi.description}
        actions={<Button onClick={() => { resetForm(); setShowForm(true); }}>{copy.buttons.addEmi}</Button>}
        mobileActions={
          <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }}>
            {copy.buttons.add}
          </Button>
        }
      />

      <DexiePageGate isPending={isPending} isError={isError} onRetry={() => refetch()} label={copy.loading.emis}>
      <div className="space-y-8">

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label={copy.labels.monthlyOutflow} value={formatINR(monthlyTotal)} tone="negative" />
        <StatCard label={copy.labels.outstandingBalance} value={formatINR(totalBalance)} />
        <StatCard label={copy.labels.activeEmis} value={emis.length} />
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-5">
            <form onSubmit={save} className="grid gap-4 md:grid-cols-2">
              <Input label={copy.forms.loanName} required value={name} onChange={(e) => setName(e.target.value)} placeholder={copy.forms.loanPlaceholder} />
              <Input label={copy.forms.lender} required value={lender} onChange={(e) => setLender(e.target.value)} placeholder={copy.forms.lenderPlaceholder} />
              <Input label={copy.forms.principal} type="number" value={principal} onChange={(e) => setPrincipal(e.target.value)} />
              <Input label={copy.forms.emiAmount} required type="number" value={emiAmount} onChange={(e) => setEmiAmount(e.target.value)} />
              <Input label={copy.forms.balanceRemaining} type="number" value={balance} onChange={(e) => setBalance(e.target.value)} hint={copy.forms.balanceHint} />
              <Input label={copy.forms.interestRate} type="number" step="0.1" value={rate} onChange={(e) => setRate(e.target.value)} />
              <Input label={copy.forms.tenureMonths} type="number" value={tenure} onChange={(e) => setTenure(e.target.value)} />
              <Input label={copy.forms.nextDueDate} type="date" value={nextDue} onChange={(e) => setNextDue(e.target.value)} />
              <div className="flex gap-2 md:col-span-2">
                <Button type="submit" disabled={saving}>
                  {saving ? copy.buttons.saving : edit ? copy.labels.update : copy.buttons.save}
                </Button>
                <Button type="button" variant="ghost" onClick={resetForm}>{copy.buttons.cancel}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {emis.length === 0 ? (
        <EmptyState title={copy.empty.noEmis.title} description={copy.empty.noEmis.description} action={<Button onClick={() => setShowForm(true)}>{copy.buttons.addEmi}</Button>} />
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {emis.map((e) => {
                const progress = e.principalPaise > 0 ? ((e.principalPaise - e.balancePaise) / e.principalPaise) * 100 : 0;
                return (
                  <li key={e.id} className="px-5 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{e.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {e.lender} · {e.interestRate}% · Due {format(new Date(e.nextDueAt), "dd MMM")}
                        </p>
                      </div>
                    <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
                        <div className="text-right">
                          <p className="font-semibold tabular-nums">{formatINR(e.emiAmountPaise)}/mo</p>
                          <p className="text-xs text-muted-foreground">{formatINR(e.balancePaise)} left</p>
                        </div>
                        <div className="flex flex-wrap items-center justify-end gap-1">
                        <Button size="sm" variant="outline" onClick={() => e.id && recordPayment(e.id)}>{copy.actionCenter.payEmi}</Button>
                        <Button size="icon" variant="ghost" onClick={() => startEdit(e)} aria-label={`Edit ${e.name}`}><Pencil size={14} /></Button>
                        <Button size="icon" variant="ghost" onClick={() => e.id && remove(e.id)} aria-label={`Delete ${e.name}`}><Trash2 size={14} className="text-destructive" /></Button>
                        </div>
                      </div>
                    </div>
                    <Progress value={progress} max={100} size="lg" className="mt-3" />
                    <p className="mt-1 text-xs text-muted-foreground">{e.paidMonths}/{e.tenureMonths} months paid</p>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}
      </div>
      </DexiePageGate>
    </PageContainer>
  );
}

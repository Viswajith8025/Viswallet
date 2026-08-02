"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Pencil, Trash2 } from "lucide-react";
import { PageHeader, StatCard, EmptyState, PageContainer } from "@/components/ui/page";
import { DexiePageGate } from "@/components/layout/dexie-page-gate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { db } from "@/lib/db";
import { getActiveTransactionsByKind } from "@/lib/db/repositories/transactions";
import type { Subscription } from "@/lib/db/types";
import { formatINR, parseRupeeInput } from "@/lib/money";
import { subscriptionMonthlyPaise } from "@/lib/money/subscription";
import { PAYMENT_METHODS } from "@/lib/categories-default";
import {
  detectSubscriptionsFromTransactions,
  formatDetectionSummary,
} from "@/lib/engines/premium/subscription-detector";
import { copy } from "@/lib/ux/copy";
import { confirmAction } from "@/lib/store/confirm-store";
import { Hint } from "@/components/ui/hint";
import { useInvalidateFinance, useAsyncAction, useDexieTable } from "@/hooks";
import { showToast } from "@/lib/store/toast-store";

export default function SubscriptionsPage() {
  const invalidate = useInvalidateFinance();
  const { loading: saving, run } = useAsyncAction();
  const { data: subs = [], isPending: subsPending, isError: subsError, refetch: refetchSubs } = useDexieTable(
    "subscriptions",
    () => db.subscriptions.filter((s) => s.isActive).toArray(),
  );
  const { data: detected = [], isPending: detectedPending, isError: detectedError, refetch: refetchDetected } = useDexieTable(
    "subscription-detected",
    async () => {
      const tx = await getActiveTransactionsByKind("expense");
      return detectSubscriptionsFromTransactions(tx).slice(0, 5);
    },
  );
  const isPending = subsPending || detectedPending;
  const isError = subsError || detectedError;
  const refetch = () => {
    void refetchSubs();
    void refetchDetected();
  };
  const [showForm, setShowForm] = useState(false);
  const [edit, setEdit] = useState<Subscription | null>(null);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [cycle, setCycle] = useState<Subscription["billingCycle"]>("monthly");
  const [paymentMethod, setPaymentMethod] = useState("Auto Debit");
  const [renewal, setRenewal] = useState("");

  const monthlyTotal = subs.reduce((s, sub) => s + subscriptionMonthlyPaise(sub), 0);

  function resetForm() {
    setEdit(null);
    setName("");
    setAmount("");
    setCycle("monthly");
    setPaymentMethod("Auto Debit");
    setRenewal("");
    setShowForm(false);
  }

  function startEdit(s: Subscription) {
    setEdit(s);
    setName(s.name);
    setAmount(String(s.amountPaise / 100));
    setCycle(s.billingCycle);
    setPaymentMethod(s.paymentMethod);
    setRenewal(s.nextRenewalAt ? format(new Date(s.nextRenewalAt), "yyyy-MM-dd") : "");
    setShowForm(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const paise = parseRupeeInput(amount);
    if (!name.trim() || paise <= 0) {
      if (!name.trim()) showToast(copy.validation.billNameRequired, { tone: "error" });
      else showToast(copy.validation.amountRequired, { tone: "error" });
      return;
    }
    await run(async () => {
      const now = new Date();
      const payload = {
        name: name.trim(),
        amountPaise: paise,
        billingCycle: cycle,
        paymentMethod,
        nextRenewalAt: renewal ? new Date(renewal) : undefined,
        isActive: true,
        updatedAt: now,
      };
      if (edit?.id) {
        await db.subscriptions.update(edit.id, payload);
      } else {
        await db.subscriptions.add({ ...payload, createdAt: now });
      }
      resetForm();
      await invalidate();
    });
  }

  async function cancel(id: number) {
    const sub = subs.find((s) => s.id === id);
    const ok = await confirmAction({
      title: copy.confirm.cancelSubscription,
      description: sub ? copy.confirmDesc.archiveSubscription(sub.name, formatINR(sub.amountPaise), sub.billingCycle) : undefined,
      confirmLabel: copy.confirm.archive,
      destructive: true,
    });
    if (!ok) return;
    await db.subscriptions.update(id, { isActive: false, updatedAt: new Date() });
    await invalidate();
  }

  return (
    <PageContainer className="max-w-5xl">
      <PageHeader
        title={copy.pages.subscriptions.title}
        description={copy.pages.subscriptions.description}
        actions={<Button onClick={() => { resetForm(); setShowForm(true); }}>{copy.buttons.addSubscription}</Button>}
        mobileActions={
          <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }}>
            {copy.buttons.add}
          </Button>
        }
      />

      <DexiePageGate isPending={isPending} isError={isError} onRetry={() => refetch()} label={copy.loading.subscriptions}>
      <div className="space-y-8">

      <div className="grid gap-4 md:grid-cols-2">
        <StatCard label={copy.labels.activeSubscriptions} value={subs.length} />
        <StatCard label={copy.labels.monthlyRunRate} value={formatINR(monthlyTotal)} hint={copy.subscriptionDetection.normalizedHint} />
      </div>

      <Hint>{copy.subscriptionDetection.hint}</Hint>

      {detected.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{copy.subscriptionDetection.detectedTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {detected.map((d) => (
              <div key={d.name + d.amountPaise} className="flex items-center justify-between rounded-xl border border-border/60 px-4 py-3 text-sm">
                <div>
                  <p className="font-medium">{d.name}</p>
                  <p className="text-xs text-muted-foreground">{formatDetectionSummary(d)} · {d.confidence}% confidence</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setName(d.name);
                    setAmount(String(d.amountPaise / 100));
                    setCycle(d.billingCycle);
                    setShowForm(true);
                  }}
                >
                  Add
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {showForm && (
        <Card>
          <CardContent className="p-5">
            <form onSubmit={save} className="grid gap-4 md:grid-cols-2">
              <Input label={copy.forms.title} required value={name} onChange={(e) => setName(e.target.value)} placeholder="Netflix" />
              <Input label={copy.forms.amountInr} required type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
              <Select label={copy.forms.billingCycle} value={cycle} onChange={(e) => setCycle(e.target.value as Subscription["billingCycle"])}>
                <option value="monthly">{copy.quickAdd.monthly}</option>
                <option value="yearly">Yearly</option>
                <option value="weekly">Weekly</option>
              </Select>
              <Select label={copy.forms.paymentMethod} value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
              </Select>
              <Input label={copy.forms.nextRenewal} type="date" value={renewal} onChange={(e) => setRenewal(e.target.value)} />
              <div className="flex items-end gap-2 md:col-span-2">
                <Button type="submit" disabled={saving}>{saving ? copy.buttons.saving : edit ? copy.labels.update : copy.buttons.save}</Button>
                <Button type="button" variant="ghost" onClick={resetForm}>{copy.buttons.cancel}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {subs.length === 0 ? (
        <EmptyState title={copy.empty.noSubscriptions.title} description={copy.empty.noSubscriptions.description} action={<Button onClick={() => setShowForm(true)}>{copy.buttons.addSubscription}</Button>} />
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {subs.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 px-5 py-4">
                  <div>
                    <p className="font-medium">{s.name}</p>
                    <p className="text-xs capitalize text-muted-foreground">
                      {s.billingCycle} · {s.paymentMethod}
                      {s.nextRenewalAt && ` · Renews ${format(new Date(s.nextRenewalAt), "dd MMM")}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="font-semibold tabular-nums">{formatINR(s.amountPaise)}</p>
                      <p className="text-xs text-muted-foreground">~{formatINR(subscriptionMonthlyPaise(s))}/mo</p>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => startEdit(s)} aria-label={`Edit ${s.name}`}><Pencil size={14} /></Button>
                    <Button size="icon" variant="ghost" onClick={() => s.id && cancel(s.id)} aria-label={`Cancel ${s.name}`}><Trash2 size={14} className="text-destructive" /></Button>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
      </div>
      </DexiePageGate>
    </PageContainer>
  );
}

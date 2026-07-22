"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Pencil, Trash2 } from "lucide-react";
import { PageHeader, StatCard, EmptyState } from "@/components/ui/page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { useDb } from "@/components/providers/db-provider";
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
import { confirmAction } from "@/lib/store/confirm-store";
import { Hint } from "@/components/ui/hint";
import { useInvalidateFinance, useAsyncAction } from "@/hooks";

export default function SubscriptionsPage() {
  const { version } = useDb();
  const invalidate = useInvalidateFinance();
  const { loading: saving, run } = useAsyncAction();
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [edit, setEdit] = useState<Subscription | null>(null);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [cycle, setCycle] = useState<Subscription["billingCycle"]>("monthly");
  const [paymentMethod, setPaymentMethod] = useState("Auto Debit");
  const [renewal, setRenewal] = useState("");
  const [detected, setDetected] = useState<ReturnType<typeof detectSubscriptionsFromTransactions>>([]);

  useEffect(() => {
    db.subscriptions.filter((s) => s.isActive).toArray().then(setSubs);
    getActiveTransactionsByKind("expense").then((tx) =>
      setDetected(detectSubscriptionsFromTransactions(tx).slice(0, 5)),
    );
  }, [version]);

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
    if (!name.trim() || paise <= 0) return;
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
      title: "Cancel subscription?",
      description: sub ? `"${sub.name}" (${formatINR(sub.amountPaise)}/${sub.billingCycle}) will be archived.` : undefined,
      confirmLabel: "Cancel subscription",
      destructive: true,
    });
    if (!ok) return;
    await db.subscriptions.update(id, { isActive: false, updatedAt: new Date() });
    await invalidate();
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <PageHeader
        title="Subscriptions"
        description="Manage recurring services and their monthly impact."
        actions={<Button onClick={() => { resetForm(); setShowForm(true); }}>Add subscription</Button>}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <StatCard label="Active subscriptions" value={subs.length} />
        <StatCard label="Monthly run rate" value={formatINR(monthlyTotal)} hint="Normalized across billing cycles" />
      </div>

      <Hint>
        Mark expenses as recurring when logging transactions — we also scan your history to suggest subscriptions you may have missed.
      </Hint>

      {detected.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Detected from transactions</CardTitle>
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
              <Input label="Name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Netflix" />
              <Input label="Amount (INR)" required type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
              <Select label="Billing cycle" value={cycle} onChange={(e) => setCycle(e.target.value as Subscription["billingCycle"])}>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="weekly">Weekly</option>
              </Select>
              <Select label="Payment method" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
              </Select>
              <Input label="Next renewal" type="date" value={renewal} onChange={(e) => setRenewal(e.target.value)} />
              <div className="flex items-end gap-2 md:col-span-2">
                <Button type="submit" disabled={saving}>{saving ? "Saving…" : edit ? "Update" : "Save"}</Button>
                <Button type="button" variant="ghost" onClick={resetForm}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {subs.length === 0 ? (
        <EmptyState title="No subscriptions" description="Track streaming, apps, and other recurring charges." action={<Button onClick={() => setShowForm(true)}>Add subscription</Button>} />
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
                    <Button size="icon" variant="ghost" onClick={() => startEdit(s)}><Pencil size={14} /></Button>
                    <Button size="icon" variant="ghost" onClick={() => s.id && cancel(s.id)}><Trash2 size={14} className="text-destructive" /></Button>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

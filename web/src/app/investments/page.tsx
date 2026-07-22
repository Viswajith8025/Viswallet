"use client";

import { useEffect, useState } from "react";
import { Pencil, Trash2, TrendingDown, TrendingUp } from "lucide-react";
import { PageHeader, StatCard, EmptyState } from "@/components/ui/page";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { useDb } from "@/components/providers/db-provider";
import { db } from "@/lib/db";
import type { Investment } from "@/lib/db/types";
import { formatINR, parseRupeeInput } from "@/lib/money";
import { useInvalidateFinance, useAsyncAction } from "@/hooks";
import { confirmAction } from "@/lib/store/confirm-store";

const TYPES: Investment["type"][] = ["mutual_fund", "stock", "fd", "gold", "crypto", "other"];

export default function InvestmentsPage() {
  const { version } = useDb();
  const invalidate = useInvalidateFinance();
  const { loading: saving, run } = useAsyncAction();
  const [items, setItems] = useState<Investment[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [edit, setEdit] = useState<Investment | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<Investment["type"]>("mutual_fund");
  const [invested, setInvested] = useState("");
  const [current, setCurrent] = useState("");
  const [platform, setPlatform] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    db.investments.toArray().then(setItems);
  }, [version]);

  const totalInvested = items.reduce((s, i) => s + i.investedPaise, 0);
  const totalCurrent = items.reduce((s, i) => s + i.currentValuePaise, 0);
  const totalGain = totalCurrent - totalInvested;
  const gainPct = totalInvested > 0 ? ((totalGain / totalInvested) * 100).toFixed(1) : "0";

  function resetForm() {
    setEdit(null);
    setName("");
    setType("mutual_fund");
    setInvested("");
    setCurrent("");
    setPlatform("");
    setNotes("");
    setShowForm(false);
  }

  function startEdit(i: Investment) {
    setEdit(i);
    setName(i.name);
    setType(i.type);
    setInvested(String(i.investedPaise / 100));
    setCurrent(String(i.currentValuePaise / 100));
    setPlatform(i.platform ?? "");
    setNotes(i.notes ?? "");
    setShowForm(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const investedPaise = parseRupeeInput(invested);
    const currentValuePaise = parseRupeeInput(current || invested);
    if (!name.trim() || investedPaise <= 0) return;
    await run(async () => {
      const now = new Date();
      const payload = {
        name: name.trim(),
        type,
        investedPaise,
        currentValuePaise,
        platform: platform.trim() || undefined,
        notes: notes.trim() || undefined,
        updatedAt: now,
      };
      if (edit?.id) {
        await db.investments.update(edit.id, payload);
      } else {
        await db.investments.add({ ...payload, createdAt: now });
      }
      resetForm();
      await invalidate();
    });
  }

  async function remove(id: number) {
    const item = items.find((i) => i.id === id);
    const ok = await confirmAction({
      title: "Delete investment?",
      description: item ? `"${item.name}" will be permanently removed.` : undefined,
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    await db.investments.delete(id);
    await invalidate();
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <PageHeader
        title="Investments"
        description="Track your portfolio value and gains."
        actions={<Button onClick={() => { resetForm(); setShowForm(true); }}>Add investment</Button>}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Current value" value={formatINR(totalCurrent)} tone="primary" />
        <StatCard label="Total invested" value={formatINR(totalInvested)} />
        <StatCard
          label="Overall gain/loss"
          value={formatINR(totalGain)}
          hint={`${gainPct}%`}
          tone={totalGain >= 0 ? "positive" : "negative"}
        />
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-5">
            <form onSubmit={save} className="grid gap-4 md:grid-cols-2">
              <Input label="Name" required value={name} onChange={(e) => setName(e.target.value)} />
              <Select label="Type" value={type} onChange={(e) => setType(e.target.value as Investment["type"])}>
                {TYPES.map((t) => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
              </Select>
              <Input label="Invested (INR)" required type="number" value={invested} onChange={(e) => setInvested(e.target.value)} />
              <Input label="Current value (INR)" type="number" value={current} onChange={(e) => setCurrent(e.target.value)} hint="Defaults to invested" />
              <Input label="Platform" value={platform} onChange={(e) => setPlatform(e.target.value)} placeholder="Zerodha, Groww..." />
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

      {items.length === 0 ? (
        <EmptyState title="No investments" description="Add stocks, mutual funds, FDs, and more." action={<Button onClick={() => setShowForm(true)}>Add investment</Button>} />
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {items.map((i) => {
                const gain = i.currentValuePaise - i.investedPaise;
                const pct = i.investedPaise > 0 ? ((gain / i.investedPaise) * 100).toFixed(1) : "0";
                const positive = gain >= 0;
                return (
                  <li key={i.id} className="flex items-center justify-between gap-3 px-5 py-4">
                    <div>
                      <p className="font-medium">{i.name}</p>
                      <p className="text-xs capitalize text-muted-foreground">
                        {i.type.replace("_", " ")}{i.platform && ` · ${i.platform}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-semibold tabular-nums">{formatINR(i.currentValuePaise)}</p>
                        <p className={`flex items-center justify-end gap-1 text-xs tabular-nums ${positive ? "text-success" : "text-destructive"}`}>
                          {positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                          {positive ? "+" : ""}{formatINR(gain)} ({pct}%)
                        </p>
                      </div>
                      <Button size="icon" variant="ghost" onClick={() => startEdit(i)}><Pencil size={14} /></Button>
                      <Button size="icon" variant="ghost" onClick={() => i.id && remove(i.id)}><Trash2 size={14} className="text-destructive" /></Button>
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

"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { PageHeader, StatCard, EmptyState, PageContainer } from "@/components/ui/page";
import { DexiePageGate } from "@/components/layout/dexie-page-gate";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { db } from "@/lib/db";
import type { WishlistItem } from "@/lib/db/types";
import { formatINR, parseRupeeInput } from "@/lib/money";
import { Progress } from "@/components/ui/progress";
import { useInvalidateFinance, useAsyncAction, useDexieTable } from "@/hooks";
import { confirmAction } from "@/lib/store/confirm-store";

export default function WishlistPage() {
  const invalidate = useInvalidateFinance();
  const { loading: saving, run } = useAsyncAction();
  const { data: items = [], isPending, isError, refetch } = useDexieTable(
    "wishlist",
    () => db.wishlistItems.filter((w) => !w.isPurchased).toArray(),
  );
  const [showForm, setShowForm] = useState(false);
  const [edit, setEdit] = useState<WishlistItem | null>(null);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [saved, setSaved] = useState("");
  const [priority, setPriority] = useState<WishlistItem["priority"]>("medium");
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");

  const totalTarget = items.reduce((s, i) => s + i.targetPaise, 0);
  const totalSaved = items.reduce((s, i) => s + i.savedPaise, 0);

  function resetForm() {
    setEdit(null);
    setName("");
    setTarget("");
    setSaved("");
    setPriority("medium");
    setUrl("");
    setNotes("");
    setShowForm(false);
  }

  function startEdit(w: WishlistItem) {
    setEdit(w);
    setName(w.name);
    setTarget(String(w.targetPaise / 100));
    setSaved(String(w.savedPaise / 100));
    setPriority(w.priority);
    setUrl(w.url ?? "");
    setNotes(w.notes ?? "");
    setShowForm(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const targetPaise = parseRupeeInput(target);
    if (!name.trim() || targetPaise <= 0) return;
    await run(async () => {
      const now = new Date();
      const payload = {
        name: name.trim(),
        targetPaise,
        savedPaise: parseRupeeInput(saved),
        priority,
        url: url.trim() || undefined,
        notes: notes.trim() || undefined,
        isPurchased: false,
        updatedAt: now,
      };
      if (edit?.id) {
        await db.wishlistItems.update(edit.id, payload);
      } else {
        await db.wishlistItems.add({ ...payload, createdAt: now });
      }
      resetForm();
      await invalidate();
    });
  }

  async function markPurchased(id: number) {
    await db.wishlistItems.update(id, { isPurchased: true, updatedAt: new Date() });
    await invalidate();
  }

  async function remove(id: number) {
    const item = items.find((w) => w.id === id);
    const ok = await confirmAction({
      title: "Remove wishlist item?",
      description: item ? `"${item.name}" will be deleted.` : undefined,
      confirmLabel: "Remove",
      destructive: true,
    });
    if (!ok) return;
    await db.wishlistItems.delete(id);
    await invalidate();
  }

  return (
    <PageContainer className="max-w-5xl">
      <PageHeader
        title="Wishlist"
        description="Save up for things you want without impulse buying."
        actions={<Button onClick={() => { resetForm(); setShowForm(true); }}>Add item</Button>}
      />

      <DexiePageGate isPending={isPending} isError={isError} onRetry={() => refetch()} label="Loading wishlist…">
      <div className="space-y-8">

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Items" value={items.length} />
        <StatCard label="Total target" value={formatINR(totalTarget)} />
        <StatCard label="Saved so far" value={formatINR(totalSaved)} tone="positive" />
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-5">
            <form onSubmit={save} className="grid gap-4 md:grid-cols-2">
              <Input label="Item name" required value={name} onChange={(e) => setName(e.target.value)} />
              <Input label="Target price (INR)" required type="number" value={target} onChange={(e) => setTarget(e.target.value)} />
              <Input label="Saved (INR)" type="number" value={saved} onChange={(e) => setSaved(e.target.value)} />
              <Select label="Priority" value={priority} onChange={(e) => setPriority(e.target.value as WishlistItem["priority"])}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </Select>
              <Input label="URL" type="url" value={url} onChange={(e) => setUrl(e.target.value)} className="md:col-span-2" />
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
        <EmptyState title="Wishlist is empty" description="Add something you're saving for." action={<Button onClick={() => setShowForm(true)}>Add item</Button>} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((w) => {
            const pct = w.targetPaise > 0 ? Math.min(100, (w.savedPaise / w.targetPaise) * 100) : 0;
            return (
              <Card key={w.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{w.name}</p>
                      <p className="text-xs capitalize text-muted-foreground">{w.priority} priority</p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => startEdit(w)} aria-label={`Edit ${w.name}`}><Pencil size={14} /></Button>
                      <Button size="icon" variant="ghost" onClick={() => w.id && remove(w.id)} aria-label={`Delete ${w.name}`}><Trash2 size={14} className="text-destructive" /></Button>
                    </div>
                  </div>
                  <p className="mt-2 text-sm tabular-nums">{formatINR(w.savedPaise)} / {formatINR(w.targetPaise)}</p>
                  <Progress value={pct} max={100} size="md" className="mt-2" />
                  {w.url && (
                    <a href={w.url} target="_blank" rel="noopener noreferrer" className="mt-2 block truncate text-xs text-primary">
                      {w.url}
                    </a>
                  )}
                  <Button size="sm" variant="outline" className="mt-3 w-full" onClick={() => w.id && markPurchased(w.id)}>
                    Mark purchased
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      </div>
      </DexiePageGate>
    </PageContainer>
  );
}

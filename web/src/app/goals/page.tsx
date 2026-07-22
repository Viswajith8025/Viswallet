"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { PageHeader, StatCard, EmptyState } from "@/components/ui/page";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDb } from "@/components/providers/db-provider";
import { db } from "@/lib/db";
import type { SavingsGoal } from "@/lib/db/types";
import { formatINR, parseRupeeInput } from "@/lib/money";
import { projectSavingsGoal } from "@/lib/engines/premium/savings-projection";
import { confirmAction } from "@/lib/store/confirm-store";
import { showToast } from "@/lib/store/toast-store";
import { Progress } from "@/components/ui/progress";
import { Hint } from "@/components/ui/hint";
import { useInvalidateFinance, useAsyncAction } from "@/hooks";

export default function GoalsPage() {
  const { version } = useDb();
  const invalidate = useInvalidateFinance();
  const { loading: saving, run } = useAsyncAction();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [edit, setEdit] = useState<SavingsGoal | null>(null);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [saved, setSaved] = useState("");
  const [monthly, setMonthly] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [fundGoalId, setFundGoalId] = useState<number | null>(null);
  const [fundAmount, setFundAmount] = useState("");

  useEffect(() => {
    db.savingsGoals.filter((g) => g.isActive).toArray().then(setGoals);
  }, [version]);

  const totalSaved = goals.reduce((s, g) => s + g.savedPaise, 0);
  const totalTarget = goals.reduce((s, g) => s + g.targetPaise, 0);

  function resetForm() {
    setEdit(null);
    setName("");
    setTarget("");
    setSaved("");
    setMonthly("");
    setTargetDate("");
    setShowForm(false);
  }

  function startEdit(g: SavingsGoal) {
    setEdit(g);
    setName(g.name);
    setTarget(String(g.targetPaise / 100));
    setSaved(String(g.savedPaise / 100));
    setMonthly(String(g.monthlyContributionPaise / 100));
    setTargetDate(g.targetDate ? format(new Date(g.targetDate), "yyyy-MM-dd") : "");
    setShowForm(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const targetPaise = parseRupeeInput(target);
    const savedPaise = parseRupeeInput(saved);
    if (!name.trim() || targetPaise <= 0) return;
    await run(async () => {
      const now = new Date();
      const payload = {
        name: name.trim(),
        targetPaise,
        savedPaise,
        monthlyContributionPaise: parseRupeeInput(monthly),
        targetDate: targetDate ? new Date(targetDate) : undefined,
        isActive: true,
        updatedAt: now,
      };
      if (edit?.id) {
        await db.savingsGoals.update(edit.id, payload);
      } else {
        await db.savingsGoals.add({ ...payload, createdAt: now });
      }
      resetForm();
      await invalidate();
    });
  }

  async function addFunds(e: React.FormEvent) {
    e.preventDefault();
    if (!fundGoalId) return;
    const paise = parseRupeeInput(fundAmount);
    if (paise <= 0) return;
    await run(async () => {
      const goal = await db.savingsGoals.get(fundGoalId);
      if (!goal) return;
      await db.savingsGoals.update(fundGoalId, {
        savedPaise: goal.savedPaise + paise,
        updatedAt: new Date(),
      });
      setFundGoalId(null);
      setFundAmount("");
      await invalidate();
    });
  }

  async function remove(id: number) {
    const goal = goals.find((g) => g.id === id);
    const ok = await confirmAction({
      title: "Delete goal?",
      description: goal ? `"${goal.name}" and its progress will be archived.` : undefined,
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    await db.savingsGoals.update(id, { isActive: false, updatedAt: new Date() });
    await invalidate();
    showToast("Goal removed", {
      undo: async () => {
        await db.savingsGoals.update(id, { isActive: true, updatedAt: new Date() });
        await invalidate();
      },
    });
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <PageHeader
        title="Savings Goals"
        description="Set targets and watch your progress grow."
        actions={<Button onClick={() => { resetForm(); setShowForm(true); }}>Add goal</Button>}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Total saved" value={formatINR(totalSaved)} tone="positive" />
        <StatCard label="Combined target" value={formatINR(totalTarget)} />
        <StatCard label="Active goals" value={goals.length} />
      </div>

      <Hint>
        Set a monthly contribution to see when you will reach each target. Use Fund to log one-off deposits.
      </Hint>

      {showForm && (
        <Card>
          <CardContent className="p-5">
            <form onSubmit={save} className="grid gap-4 md:grid-cols-2">
              <Input label="Goal name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Emergency fund" />
              <Input label="Target (INR)" required type="number" value={target} onChange={(e) => setTarget(e.target.value)} />
              <Input label="Already saved (INR)" type="number" value={saved} onChange={(e) => setSaved(e.target.value)} />
              <Input label="Monthly contribution (INR)" type="number" value={monthly} onChange={(e) => setMonthly(e.target.value)} />
              <Input label="Target date" type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
              <div className="flex gap-2 md:col-span-2">
                <Button type="submit" disabled={saving}>{saving ? "Saving…" : edit ? "Update" : "Save"}</Button>
                <Button type="button" variant="ghost" onClick={resetForm}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {fundGoalId && (
        <Card>
          <CardContent className="p-5">
            <form onSubmit={addFunds} className="flex flex-wrap items-end gap-3">
              <Input label="Add funds (INR)" type="number" value={fundAmount} onChange={(e) => setFundAmount(e.target.value)} />
              <Button type="submit" disabled={saving}>{saving ? "Adding…" : "Add"}</Button>
              <Button type="button" variant="ghost" onClick={() => setFundGoalId(null)}>Cancel</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {goals.length === 0 ? (
        <EmptyState title="No goals yet" description="Create a savings goal to stay motivated." illustration="goals" action={<Button onClick={() => setShowForm(true)}>Add goal</Button>} />
      ) : (
        <div className="space-y-4">
          {goals.map((g) => {
            const pct = g.targetPaise > 0 ? Math.min(100, (g.savedPaise / g.targetPaise) * 100) : 0;
            const projection = projectSavingsGoal(
              g.savedPaise,
              g.targetPaise,
              g.monthlyContributionPaise,
              g.targetDate,
            );
            return (
              <Card key={g.id}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{g.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatINR(g.savedPaise)} of {formatINR(g.targetPaise)}
                        {g.targetDate && ` · Target ${format(new Date(g.targetDate), "MMM yyyy")}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => setFundGoalId(g.id!)}>
                        <Plus size={14} /> Fund
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => startEdit(g)}><Pencil size={14} /></Button>
                      <Button size="icon" variant="ghost" onClick={() => g.id && remove(g.id)}><Trash2 size={14} className="text-destructive" /></Button>
                    </div>
                  </div>
                  <Progress value={pct} max={100} size="lg" color="var(--success)" className="mt-3" />
                  <p className="mt-1 text-xs text-muted-foreground">
                    {Math.round(pct)}% complete · {formatINR(g.monthlyContributionPaise)}/mo planned
                    {projection.monthsToTarget < 999 && (
                      <> · Reach target in ~{projection.monthsToTarget} mo ({format(projection.projectedDate, "MMM yyyy")})</>
                    )}
                    {!projection.onTrack && g.targetDate && (
                      <> · Need {formatINR(projection.monthlyNeededPaise)}/mo to hit date</>
                    )}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Wallet, Star } from "lucide-react";
import { PageHeader, PageContainer, EmptyState } from "@/components/ui/page";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { db } from "@/lib/db";
import type { Account, AccountType } from "@/lib/db/types";
import { formatINR, parseRupeeInput } from "@/lib/money";
import { useAsyncAction } from "@/hooks";

const ACCOUNT_TYPES: AccountType[] = ["cash", "bank", "wallet", "credit", "investment", "other"];

export default function AccountsPage() {
  const qc = useQueryClient();
  const { loading: saving, run } = useAsyncAction();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("bank");
  const [balance, setBalance] = useState("");

  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts"],
    queryFn: () => db.accounts.filter((a) => a.isActive).toArray(),
  });

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    await run(async () => {
      const now = new Date();
      await db.accounts.add({
        name: name.trim(),
        type,
        balancePaise: parseRupeeInput(balance),
        color: "#0c4a6e",
        iconName: "Wallet",
        isDefault: accounts.length === 0,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      setName("");
      setBalance("");
      setShowForm(false);
      qc.invalidateQueries({ queryKey: ["accounts"] });
    });
  }

  async function setDefault(account: Account) {
    await db.transaction("rw", db.accounts, async () => {
      const all = await db.accounts.toArray();
      for (const a of all) {
        if (a.id) await db.accounts.update(a.id, { isDefault: a.id === account.id });
      }
    });
    qc.invalidateQueries({ queryKey: ["accounts"] });
  }

  const total = accounts.reduce((s, a) => s + a.balancePaise, 0);

  return (
    <PageContainer className="max-w-4xl">
      <PageHeader
        eyebrow="Wealth"
        title="Accounts & Wallets"
        description="Manage multiple bank accounts, wallets, and cash holdings."
        actions={
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus size={16} className="mr-1.5" />
            Add account
          </Button>
        }
      />

      <Card>
        <CardContent className="flex items-center justify-between p-6">
          <div>
            <p className="text-sm text-muted-foreground">Total across accounts</p>
            <p className="text-3xl font-semibold tabular-nums">{formatINR(total)}</p>
          </div>
          <Wallet size={32} className="text-primary opacity-60" />
        </CardContent>
      </Card>

      {showForm && (
        <Card>
          <CardContent className="p-5">
            <form onSubmit={handleAdd} className="grid gap-3 sm:grid-cols-2">
              <Input placeholder="Account name" value={name} onChange={(e) => setName(e.target.value)} required />
              <Select value={type} onChange={(e) => setType(e.target.value as AccountType)}>
                {ACCOUNT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </Select>
              <Input
                type="number"
                placeholder="Opening balance (₹)"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
              />
              <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save account"}</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {accounts.length === 0 ? (
        <EmptyState title="No accounts yet" description="Add your first wallet or bank account." />
      ) : (
        <div className="space-y-2">
          {accounts.map((a) => (
            <Card key={a.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{a.name}</p>
                    {a.isDefault && (
                      <span className="flex items-center gap-1 text-xs text-primary">
                        <Star size={12} /> Default
                      </span>
                    )}
                  </div>
                  <p className="text-xs capitalize text-muted-foreground">{a.type}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold tabular-nums">{formatINR(a.balancePaise)}</span>
                  {!a.isDefault && (
                    <Button size="sm" variant="outline" onClick={() => setDefault(a)}>
                      Set default
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageContainer>
  );
}

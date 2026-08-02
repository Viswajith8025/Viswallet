"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeftRight,
  Plus,
  PiggyBank,
  RefreshCw,
  Shield,
  Star,
  Wallet,
} from "lucide-react";
import { PageHeader, PageContainer, EmptyState, LoadingState } from "@/components/ui/page";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Hint } from "@/components/ui/hint";
import { WalletTransferModal } from "@/components/accounts/wallet-transfer-modal";
import { db } from "@/lib/db";
import type { Account, AccountRole, AccountType } from "@/lib/db/types";
import { formatINR, parseRupeeInput } from "@/lib/money";
import { useAsyncAction } from "@/hooks";
import { sanitizeName } from "@/lib/security";
import {
  ACCOUNT_ROLE_HINTS,
  ACCOUNT_ROLE_LABELS,
  WALLET_PRESETS,
} from "@/lib/accounts/wallet-presets";
import { setupWalletPresets } from "@/lib/accounts/setup-wallet-presets";
import { reconcileAccountBalance } from "@/lib/accounts/reconcile-account-balance";
import { showToast } from "@/lib/store/toast-store";
import { useInvalidateFinance } from "@/hooks/use-invalidate-finance";

const ROLES: AccountRole[] = ["primary", "backup_wallet", "pot"];

function groupAccounts(accounts: Account[]) {
  return {
    primary: accounts.filter((a) => a.role === "primary" || (!a.role && a.isDefault)),
    backup: accounts.filter((a) => a.role === "backup_wallet"),
    pots: accounts.filter((a) => a.role === "pot"),
    other: accounts.filter(
      (a) =>
        a.role &&
        a.role !== "primary" &&
        a.role !== "backup_wallet" &&
        a.role !== "pot",
    ),
  };
}

function AccountRow({
  account,
  onTransferFrom,
  onReconcile,
  onSetDefault,
}: {
  account: Account;
  onTransferFrom: (id: number) => void;
  onReconcile: (account: Account) => void;
  onSetDefault: (account: Account) => void;
}) {
  const roleLabel = account.role ? ACCOUNT_ROLE_LABELS[account.role] : account.type;

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{account.name}</p>
            {account.isDefault && (
              <span className="flex items-center gap-1 text-xs text-primary">
                <Star size={12} /> Default
              </span>
            )}
            {account.institution && account.institution !== account.name && (
              <span className="text-xs text-muted-foreground">{account.institution}</span>
            )}
          </div>
          <p className="text-xs capitalize text-muted-foreground">{roleLabel}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <span className="text-lg font-semibold tabular-nums sm:mr-2">{formatINR(account.balancePaise)}</span>
          <Button size="sm" variant="outline" onClick={() => onTransferFrom(account.id!)}>
            Transfer
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onReconcile(account)}>
            Update balance
          </Button>
          {!account.isDefault && account.role === "primary" && (
            <Button size="sm" variant="ghost" onClick={() => onSetDefault(account)}>
              Set default
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function AccountsPage() {
  const qc = useQueryClient();
  const invalidateFinance = useInvalidateFinance();
  const { loading: saving, run } = useAsyncAction();
  const [showForm, setShowForm] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferFrom, setTransferFrom] = useState<number | undefined>();
  const [transferTo, setTransferTo] = useState<number | undefined>();
  const [name, setName] = useState("");
  const [role, setRole] = useState<AccountRole>("backup_wallet");
  const [institution, setInstitution] = useState("");
  const [balance, setBalance] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const { data: accounts = [], isPending } = useQuery({
    queryKey: ["accounts"],
    queryFn: () => db.accounts.filter((a) => a.isActive).toArray(),
  });

  const { data: transfers = [] } = useQuery({
    queryKey: ["account-transfers"],
    queryFn: () => db.accountTransfers.orderBy("transferredAt").reverse().limit(8).toArray(),
  });

  const grouped = useMemo(() => groupAccounts(accounts), [accounts]);
  const backupTotal = grouped.backup.reduce((s, a) => s + a.balancePaise, 0);
  const potsTotal = grouped.pots.reduce((s, a) => s + a.balancePaise, 0);
  const total = accounts.reduce((s, a) => s + a.balancePaise, 0);

  async function refresh() {
    await qc.invalidateQueries({ queryKey: ["accounts"] });
    await qc.invalidateQueries({ queryKey: ["account-transfers"] });
    await invalidateFinance();
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!name.trim()) {
      setFormError("Enter a name.");
      return;
    }
    await run(async () => {
      const now = new Date();
      const type: AccountType = role === "primary" ? "bank" : "wallet";
      await db.accounts.add({
        name: sanitizeName(name),
        type,
        role,
        institution: institution.trim() ? sanitizeName(institution) : undefined,
        balancePaise: parseRupeeInput(balance),
        color: role === "pot" ? "#5f4a8b" : "#7560a0",
        iconName: role === "pot" ? "PiggyBank" : "Wallet",
        isDefault: accounts.length === 0 && role === "primary",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      setName("");
      setInstitution("");
      setBalance("");
      setShowForm(false);
      await refresh();
      showToast("Account added", { tone: "success" });
    });
  }

  async function handleSetupPresets() {
    await run(async () => {
      const added = await setupWalletPresets();
      await refresh();
      showToast(
        added > 0 ? `Added ${added} wallets & pots` : "All presets already exist",
        { tone: added > 0 ? "success" : "default" },
      );
    });
  }

  async function setDefault(account: Account) {
    await db.transaction("rw", db.accounts, async () => {
      const all = await db.accounts.toArray();
      for (const a of all) {
        if (a.id) await db.accounts.update(a.id, { isDefault: a.id === account.id });
      }
    });
    await refresh();
  }

  async function handleReconcile(account: Account) {
    const input = prompt(
      `Current balance in ${account.name} (₹)?`,
      String(account.balancePaise / 100),
    );
    if (input == null) return;
    const paise = parseRupeeInput(input);
    await run(async () => {
      await reconcileAccountBalance(account.id!, paise);
      await refresh();
      showToast(`${account.name} updated to ${formatINR(paise)}`, { tone: "success" });
    });
  }

  function openTransfer(fromId?: number, toId?: number) {
    setTransferFrom(fromId);
    setTransferTo(toId);
    setTransferOpen(true);
  }

  const accountName = (id: number) => accounts.find((a) => a.id === id)?.name ?? "Account";

  return (
    <PageContainer className="max-w-4xl">
      <PageHeader
        eyebrow="Wealth"
        title="Wallets & pots"
        description="Track money in your bank, backup wallets (Amazon Pay, Slice, Mobikwik), and Jupiter savings pots."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => openTransfer()}>
              <ArrowLeftRight size={16} className="mr-1.5" />
              Transfer
            </Button>
            <Button onClick={() => setShowForm(!showForm)}>
              <Plus size={16} className="mr-1.5" />
              Add
            </Button>
          </div>
        }
      />

      <Hint className="mb-6">
        <strong>Workflow:</strong> Salary stays in your main bank → transfer to backup wallets when you load Amazon Pay / Slice / Mobikwik → move spare cash into Jupiter pots for savings. Spending from a wallet does not remove money from your wealth — only when you buy something.
      </Hint>

      {isPending ? (
        <LoadingState label="Loading accounts…" />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Backup wallets</p>
                <p className="text-xl font-semibold tabular-nums">{formatINR(backupTotal)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Savings pots</p>
                <p className="text-xl font-semibold tabular-nums">{formatINR(potsTotal)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-xs text-muted-foreground">All accounts</p>
                  <p className="text-xl font-semibold tabular-nums">{formatINR(total)}</p>
                </div>
                <Wallet size={24} className="text-primary opacity-60" />
              </CardContent>
            </Card>
          </div>

          {accounts.length <= 1 && (
            <Card className="border-primary/20 bg-primary-muted/30">
              <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">Quick setup</p>
                  <p className="text-sm text-muted-foreground">
                    Add Amazon Pay, Slice, Mobikwik, and a Jupiter pot template in one tap.
                  </p>
                </div>
                <Button onClick={() => void handleSetupPresets()} disabled={saving}>
                  <RefreshCw size={16} className="mr-1.5" />
                  Add my wallets
                </Button>
              </CardContent>
            </Card>
          )}

          {showForm && (
            <Card>
              <CardContent className="p-5">
                <form onSubmit={handleAdd} className="grid gap-3 sm:grid-cols-2">
                  <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Vacation pot, HDFC…" />
                  <Select label="Purpose" value={role} onChange={(e) => setRole(e.target.value as AccountRole)}>
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{ACCOUNT_ROLE_LABELS[r]}</option>
                    ))}
                  </Select>
                  <Input label="App / bank (optional)" value={institution} onChange={(e) => setInstitution(e.target.value)} placeholder="Jupiter, Amazon Pay…" />
                  <Input label="Current balance (₹)" type="number" value={balance} onChange={(e) => setBalance(e.target.value)} placeholder="0" />
                  <p className="sm:col-span-2 text-xs text-muted-foreground">{ACCOUNT_ROLE_HINTS[role]}</p>
                  {formError && <p className="sm:col-span-2 text-sm text-destructive">{formError}</p>}
                  <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
                  <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
                </form>
              </CardContent>
            </Card>
          )}

          {accounts.length === 0 ? (
            <EmptyState
              title="No accounts yet"
              description="Add your bank and backup wallets, or use quick setup."
              action={<Button onClick={() => void handleSetupPresets()}>Add my wallets</Button>}
            />
          ) : (
            <div className="space-y-8">
              {grouped.primary.length > 0 && (
                <section className="space-y-2">
                  <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                    <Shield size={16} /> Main bank
                  </h2>
                  {grouped.primary.map((a) => (
                    <AccountRow
                      key={a.id}
                      account={a}
                      onTransferFrom={(id) => openTransfer(id)}
                      onReconcile={handleReconcile}
                      onSetDefault={setDefault}
                    />
                  ))}
                </section>
              )}

              <section className="space-y-2">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <Wallet size={16} /> Backup wallets
                </h2>
                {grouped.backup.length === 0 ? (
                  <p className="text-sm text-muted-foreground px-1">
                    No backup wallets yet. Quick add: {WALLET_PRESETS.filter((p) => p.role === "backup_wallet").map((p) => p.name).join(", ")}.
                  </p>
                ) : (
                  grouped.backup.map((a) => (
                    <AccountRow
                      key={a.id}
                      account={a}
                      onTransferFrom={(id) => openTransfer(id)}
                      onReconcile={handleReconcile}
                      onSetDefault={setDefault}
                    />
                  ))
                )}
              </section>

              <section className="space-y-2">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <PiggyBank size={16} /> Savings pots
                </h2>
                {grouped.pots.length === 0 ? (
                  <p className="text-sm text-muted-foreground px-1">
                    Add Jupiter pots (Emergency, Travel, etc.) — each pot is a separate savings bucket.
                  </p>
                ) : (
                  grouped.pots.map((a) => (
                    <AccountRow
                      key={a.id}
                      account={a}
                      onTransferFrom={(id) => openTransfer(id)}
                      onReconcile={handleReconcile}
                      onSetDefault={setDefault}
                    />
                  ))
                )}
              </section>
            </div>
          )}

          {transfers.length > 0 && (
            <Card>
              <CardContent className="p-5">
                <h2 className="mb-3 text-sm font-semibold">Recent transfers</h2>
                <ul className="space-y-2 text-sm">
                  {transfers.map((t) => (
                    <li key={t.id} className="flex justify-between gap-2 text-muted-foreground">
                      <span>
                        {accountName(t.fromAccountId)} → {accountName(t.toAccountId)}
                        {t.note ? ` · ${t.note}` : ""}
                      </span>
                      <span className="tabular-nums text-foreground">{formatINR(t.amountPaise)}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <WalletTransferModal
        open={transferOpen}
        onClose={() => setTransferOpen(false)}
        accounts={accounts}
        defaultFromId={transferFrom}
        defaultToId={transferTo}
        onSuccess={() => void refresh()}
      />
    </PageContainer>
  );
}

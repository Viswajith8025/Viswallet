"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { db } from "@/lib/db";
import type { AccountRole } from "@/lib/db/types";
import { formatINR, parseRupeeInput } from "@/lib/money";
import { sanitizeName } from "@/lib/security";
import { ACCOUNT_ROLE_LABELS } from "@/lib/accounts/wallet-presets";
import { loadWalletFromSalary } from "@/lib/accounts/load-wallet-from-salary";
import { useInvalidateFinance } from "@/hooks/use-invalidate-finance";
import { useAsyncAction } from "@/hooks";
import { showToast } from "@/lib/store/toast-store";

function isUserWallet(a: { role?: AccountRole; isDefault?: boolean }) {
  return a.role === "backup_wallet" || a.role === "pot";
}

export function MoreWalletsSection() {
  const qc = useQueryClient();
  const invalidate = useInvalidateFinance();
  const { loading, run } = useAsyncAction();
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState<AccountRole>("backup_wallet");
  const [loadAmounts, setLoadAmounts] = useState<Record<number, string>>({});

  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts"],
    queryFn: () => db.accounts.filter((a) => a.isActive).toArray(),
  });

  const wallets = accounts.filter(isUserWallet);

  async function refresh() {
    await qc.invalidateQueries({ queryKey: ["accounts"] });
    await invalidate();
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    await run(async () => {
      const now = new Date();
      await db.accounts.add({
        name: sanitizeName(name),
        type: "wallet",
        role,
        balancePaise: 0,
        color: role === "pot" ? "#5f4a8b" : "#7560a0",
        iconName: "Wallet",
        isDefault: false,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      setName("");
      setShowAdd(false);
      await refresh();
      showToast("Wallet added", { tone: "success" });
    });
  }

  async function handleLoad(walletId: number) {
    const raw = loadAmounts[walletId] ?? "";
    const paise = parseRupeeInput(raw);
    if (paise <= 0) {
      showToast("Enter an amount", { tone: "error" });
      return;
    }
    await run(async () => {
      const wallet = wallets.find((w) => w.id === walletId);
      await loadWalletFromSalary(walletId, paise);
      setLoadAmounts((prev) => ({ ...prev, [walletId]: "" }));
      await refresh();
      showToast(`₹${(paise / 100).toFixed(0)} moved to ${wallet?.name ?? "wallet"}`, {
        tone: "success",
      });
    }, { errorMessage: "Could not load wallet. Check your salary balance." });
  }

  return (
    <section className="mx-4 mb-4 rounded-xl border border-border/60 bg-muted/20 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Wallet size={16} className="text-muted-foreground" />
          Your wallets
        </div>
        <button
          type="button"
          onClick={() => setShowAdd((v) => !v)}
          className="text-xs font-medium text-primary"
        >
          {showAdd ? "Cancel" : "+ Add"}
        </button>
      </div>

      <p className="mb-3 text-[11px] leading-relaxed text-muted-foreground">
        Load money from your salary into a wallet or pot. It deducts from what&apos;s available this cycle.
      </p>

      {showAdd && (
        <form onSubmit={handleAdd} className="mb-3 space-y-2 border-b border-border/40 pb-3">
          <Input
            placeholder="Wallet name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Select value={role} onChange={(e) => setRole(e.target.value as AccountRole)}>
            <option value="backup_wallet">{ACCOUNT_ROLE_LABELS.backup_wallet}</option>
            <option value="pot">{ACCOUNT_ROLE_LABELS.pot}</option>
          </Select>
          <Button type="submit" size="sm" disabled={loading} className="w-full">
            Create wallet
          </Button>
        </form>
      )}

      {wallets.length === 0 ? (
        <p className="text-xs text-muted-foreground">No wallets yet. Add one above.</p>
      ) : (
        <ul className="space-y-2">
          {wallets.map((w) => (
            <li key={w.id} className="rounded-lg bg-background/80 px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{w.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {w.role ? ACCOUNT_ROLE_LABELS[w.role] : "Wallet"} · {formatINR(w.balancePaise)}
                  </p>
                </div>
              </div>
              <div className="mt-2 flex gap-2">
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="₹ from salary"
                  value={loadAmounts[w.id!] ?? ""}
                  onChange={(e) =>
                    setLoadAmounts((prev) => ({ ...prev, [w.id!]: e.target.value }))
                  }
                  className="min-w-0 flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-primary/40"
                  aria-label={`Amount to load into ${w.name}`}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={loading}
                  onClick={() => void handleLoad(w.id!)}
                >
                  Load
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

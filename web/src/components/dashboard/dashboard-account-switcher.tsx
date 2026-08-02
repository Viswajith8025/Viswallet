"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Landmark } from "lucide-react";
import { db } from "@/lib/db";
import type { Account } from "@/lib/db/types";
import { formatINR } from "@/lib/money";
import { useFilterStore } from "@/lib/store/filter-store";
import { ACCOUNT_ROLE_LABELS } from "@/lib/accounts/wallet-presets";
import { cn } from "@/lib/design/cn";

function accountSubtitle(account: Account): string {
  const role = account.role ? ACCOUNT_ROLE_LABELS[account.role] : account.type;
  return `${role} · ${formatINR(account.balancePaise)}`;
}

export function DashboardAccountSwitcher() {
  const accountId = useFilterStore((s) => s.accountId);
  const setAccountId = useFilterStore((s) => s.setAccountId);

  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts"],
    queryFn: () => db.accounts.filter((a) => a.isActive).toArray(),
  });

  if (accounts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        <p>Track money across bank, wallets, and pots.</p>
        <Link href="/accounts" className="mt-1 font-medium text-primary hover:underline">
          Set up accounts in More → Accounts
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Viewing</p>
        <Link
          href="/accounts"
          className="text-xs font-medium text-primary hover:underline"
        >
          Manage accounts
        </Link>
      </div>
      <div className="scroll-premium -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        <button
          type="button"
          onClick={() => setAccountId(null)}
          className={cn(
            "shrink-0 rounded-full border px-3 py-2 text-left transition-colors",
            accountId == null
              ? "border-primary bg-primary-muted text-foreground shadow-sm"
              : "border-border bg-background text-muted-foreground hover:border-border-strong hover:text-foreground",
          )}
          aria-pressed={accountId == null}
        >
          <span className="block text-sm font-medium">All accounts</span>
          <span className="block text-[10px] opacity-80">Full dashboard</span>
        </button>
        {accounts.map((account) => {
          if (account.id == null) return null;
          const active = accountId === account.id;
          return (
            <button
              key={account.id}
              type="button"
              onClick={() => setAccountId(account.id!)}
              className={cn(
                "shrink-0 max-w-[9rem] rounded-full border px-3 py-2 text-left transition-colors",
                active
                  ? "border-primary bg-primary-muted text-foreground shadow-sm"
                  : "border-border bg-background text-muted-foreground hover:border-border-strong hover:text-foreground",
              )}
              aria-pressed={active}
            >
              <span className="block truncate text-sm font-medium">{account.name}</span>
              <span className="block truncate text-[10px] opacity-80">{accountSubtitle(account)}</span>
            </button>
          );
        })}
        <Link
          href="/accounts"
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-dashed border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
        >
          <Landmark size={14} />
          More
        </Link>
      </div>
    </div>
  );
}

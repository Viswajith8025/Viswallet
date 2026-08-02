"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Dialog, Sheet } from "@/components/ui/dialog";
import type { Account } from "@/lib/db/types";
import { recordAccountTransfer } from "@/lib/accounts/record-account-transfer";
import { parseRupeeInput, formatINR } from "@/lib/money";
import { showToast } from "@/lib/store/toast-store";
import { ACCOUNT_ROLE_LABELS } from "@/lib/accounts/wallet-presets";

function accountLabel(a: Account): string {
  const role = a.role ? ACCOUNT_ROLE_LABELS[a.role] : a.type;
  return `${a.name} (${role}) — ${formatINR(a.balancePaise)}`;
}

function TransferForm({
  accounts,
  defaultFromId,
  defaultToId,
  onClose,
  onSuccess,
}: {
  accounts: Account[];
  defaultFromId?: number;
  defaultToId?: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [fromId, setFromId] = useState(defaultFromId ? String(defaultFromId) : "");
  const [toId, setToId] = useState(defaultToId ? String(defaultToId) : "");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fromAccount = accounts.find((a) => a.id === Number(fromId));
  const toAccount = accounts.find((a) => a.id === Number(toId));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const paise = parseRupeeInput(amount);
      await recordAccountTransfer(Number(fromId), Number(toId), paise, note);
      showToast(`Moved ${formatINR(paise)}`, { tone: "success" });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transfer failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Move money between your bank, backup wallets, and savings pots. This does not count as spending.
      </p>
      <Select
        label="From"
        required
        value={fromId}
        onChange={(e) => setFromId(e.target.value)}
      >
        <option value="">Select account</option>
        {accounts.map((a) => (
          <option key={a.id} value={a.id}>{accountLabel(a)}</option>
        ))}
      </Select>
      <div className="flex justify-center">
        <ArrowRight size={18} className="text-muted-foreground" />
      </div>
      <Select
        label="To"
        required
        value={toId}
        onChange={(e) => setToId(e.target.value)}
      >
        <option value="">Select account</option>
        {accounts.map((a) => (
          <option key={a.id} value={a.id}>{accountLabel(a)}</option>
        ))}
      </Select>
      <Input
        label="Amount (₹)"
        required
        type="number"
        inputMode="decimal"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="0"
      />
      <Input
        label="Note (optional)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="e.g. Monthly Amazon Pay top-up"
      />
      {fromAccount && toAccount && (
        <p className="text-xs text-muted-foreground">
          {fromAccount.role === "primary" && toAccount.role === "pot"
            ? "Saving into a pot — great for building reserves."
            : fromAccount.role === "backup_wallet" || toAccount.role === "backup_wallet"
              ? "Backup wallet move — use when you load Amazon Pay / Slice / Mobikwik."
              : "Internal move — your total wealth stays the same."}
        </p>
      )}
      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
      <div className="flex gap-2 pt-1">
        <Button type="submit" disabled={saving || !fromId || !toId}>
          {saving ? "Moving…" : "Transfer"}
        </Button>
        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
      </div>
    </form>
  );
}

export function WalletTransferModal({
  open,
  onClose,
  accounts,
  defaultFromId,
  defaultToId,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  accounts: Account[];
  defaultFromId?: number;
  defaultToId?: number;
  onSuccess: () => void;
}) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const formKey = `${defaultFromId ?? "none"}-${defaultToId ?? "none"}`;
  const form = open ? (
    <TransferForm
      key={formKey}
      accounts={accounts}
      defaultFromId={defaultFromId}
      defaultToId={defaultToId}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  ) : null;

  if (isMobile) {
    return (
      <Sheet open={open} onClose={onClose} labelledBy="transfer-title">
        <div className="px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2">
          <h2 id="transfer-title" className="text-lg font-semibold">Transfer money</h2>
          <div className="mt-4">{form}</div>
        </div>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} labelledBy="transfer-title-desktop" size="md">
      <div className="p-6">
        <h2 id="transfer-title-desktop" className="text-lg font-semibold">Transfer money</h2>
        <div className="mt-4">{form}</div>
      </div>
    </Dialog>
  );
}

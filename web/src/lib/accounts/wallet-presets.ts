import type { AccountRole, AccountType } from "@/lib/db/types";

export type WalletPreset = {
  name: string;
  institution: string;
  role: AccountRole;
  type: AccountType;
  iconName: string;
  color: string;
};

export const WALLET_PRESETS: WalletPreset[] = [
  {
    name: "Amazon Pay",
    institution: "Amazon Pay",
    role: "backup_wallet",
    type: "wallet",
    iconName: "ShoppingBag",
    color: "#ff9900",
  },
  {
    name: "Slice",
    institution: "Slice",
    role: "backup_wallet",
    type: "wallet",
    iconName: "CreditCard",
    color: "#8b5cf6",
  },
  {
    name: "Mobikwik",
    institution: "Mobikwik",
    role: "backup_wallet",
    type: "wallet",
    iconName: "Wallet",
    color: "#0ea5e9",
  },
  {
    name: "Jupiter Pot",
    institution: "Jupiter",
    role: "pot",
    type: "wallet",
    iconName: "PiggyBank",
    color: "#5f4a8b",
  },
];

export const ACCOUNT_ROLE_LABELS: Record<AccountRole, string> = {
  primary: "Main bank",
  backup_wallet: "Backup wallet",
  pot: "Savings pot",
};

export const ACCOUNT_ROLE_HINTS: Record<AccountRole, string> = {
  primary: "Salary lands here — your main spending account",
  backup_wallet: "Amazon Pay, Slice, Mobikwik — money parked for quick use",
  pot: "Jupiter pots — locked savings, not for daily spending",
};

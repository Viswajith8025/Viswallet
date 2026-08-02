import type { AccountRole } from "@/lib/db/types";

export const ACCOUNT_ROLE_LABELS: Record<AccountRole, string> = {
  primary: "Main bank",
  backup_wallet: "Backup wallet",
  pot: "Savings pot",
};

export const ACCOUNT_ROLE_HINTS: Record<AccountRole, string> = {
  primary: "Salary lands here — your main spending account",
  backup_wallet: "Money parked for quick use outside your main bank",
  pot: "Locked savings — not for daily spending",
};

import { db } from "@/lib/db";
import { emitDbDataChanged } from "@/lib/notifications/bus";
import { WALLET_PRESETS } from "@/lib/accounts/wallet-presets";

/** Add common Indian backup wallets and Jupiter pot templates if missing. */
export async function setupWalletPresets(): Promise<number> {
  const existing = await db.accounts.filter((a) => a.isActive).toArray();
  const keys = new Set(
    existing.map((a) => `${a.institution ?? a.name}|${a.role ?? "primary"}`),
  );

  const now = new Date();
  let added = 0;

  for (const preset of WALLET_PRESETS) {
    const key = `${preset.institution}|${preset.role}`;
    if (keys.has(key)) continue;

    await db.accounts.add({
      name: preset.name,
      type: preset.type,
      institution: preset.institution,
      role: preset.role,
      balancePaise: 0,
      color: preset.color,
      iconName: preset.iconName,
      isDefault: false,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
    keys.add(key);
    added += 1;
  }

  if (added > 0) emitDbDataChanged();
  return added;
}

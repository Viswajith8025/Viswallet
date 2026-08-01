"use client";

import { useEffect, useRef, useState } from "react";
import { PageHeader, PageContainer, SuccessBanner } from "@/components/ui/page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { useDb } from "@/components/providers/db-provider";
import {
  db,
  exportAllData,
  importAllData,
  updateSettings,
  getSettings,
  getActiveCategories,
  getActiveTransactions,
} from "@/lib/db";
import { addTransaction } from "@/lib/db/repositories/transactions";
import { getMonthKey } from "@/lib/salary-cycle";
import {
  transactionsToCsv,
  downloadCsv,
  downloadExcel,
  parseCsvTransactions,
} from "@/lib/export/csv";
import { categoryMap } from "@/lib/engines/finance-snapshot";
import { getCurrentCycleKey } from "@/lib/salary-cycle";
import { applyAccentColor } from "@/lib/theme/accent";
import { useAuth } from "@/components/providers/auth-provider";
import { useUIStore } from "@/lib/store/ui-store";
import { applyThemeMode } from "@/lib/theme/resolve";
import type { AccentColor, DashboardWidgetId } from "@/lib/db/types";
import { DEFAULT_DASHBOARD_WIDGETS, DASHBOARD_WIDGET_LABELS } from "@/lib/db/types";
import {
  toSecureMessage,
  wrapEncryptedExport,
  readBackupFile,
  checkRateLimit,
  RESET_RATE_LIMIT,
  logAudit,
  pinSchema,
  SECURE_ERRORS,
} from "@/lib/security";
import { enableAppLock, disableAppLock } from "@/lib/security/pin";
import { useSecurityStore } from "@/lib/store/security-store";
import { confirmAction } from "@/lib/store/confirm-store";
import { Hint } from "@/components/ui/hint";
import { Checkbox } from "@/components/ui/checkbox";
import { useAiFeatures } from "@/hooks/use-ai-features";

export default function SettingsPage() {
  const { refresh } = useDb();
  const { configured } = useAuth();
  const setStatementImportOpen = useUIStore((s) => s.setStatementImportOpen);
  const lock = useSecurityStore((s) => s.lock);
  const fileRef = useRef<HTMLInputElement>(null);
  const csvRef = useRef<HTMLInputElement>(null);
  const [theme, setTheme] = useState<"system" | "light" | "dark">("system");
  const [accent, setAccent] = useState<AccentColor>("violet");
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [widgets, setWidgets] = useState<DashboardWidgetId[]>(DEFAULT_DASHBOARD_WIDGETS);
  const [resetting, setResetting] = useState(false);
  const [appLockEnabled, setAppLockEnabled] = useState(false);
  const [autoLockMinutes, setAutoLockMinutes] = useState("15");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [disablePin, setDisablePin] = useState("");
  const [exportPassphrase, setExportPassphrase] = useState("");
  const [importPassphrase, setImportPassphrase] = useState("");
  const [encryptedExport, setEncryptedExport] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [aiFeaturesEnabled, setAiFeaturesEnabled] = useState(false);
  const aiFeatures = useAiFeatures();

  useEffect(() => {
    Promise.all([getSettings()])
      .then(([s]) => {
        setTheme(s.themeMode);
        setAccent(s.accentColor ?? "violet");
        setBiometricEnabled(s.biometricEnabled ?? false);
        setWidgets(s.dashboardWidgets ?? DEFAULT_DASHBOARD_WIDGETS);
        setAppLockEnabled(s.appLockEnabled);
        setAutoLockMinutes(String(s.autoLockMinutes ?? 15));
        setAiFeaturesEnabled(s.aiFeaturesEnabled ?? false);
      })
      .catch(() => setError("Could not load settings."))
      .finally(() => setSettingsLoaded(true));
  }, []);

  function flash(msg: string) {
    setSuccess(msg);
    setError("");
    setTimeout(() => setSuccess(""), 4000);
  }

  async function handleThemeChange(value: string) {
    const mode = value as "system" | "light" | "dark";
    setTheme(mode);
    await updateSettings({ themeMode: mode });
    applyThemeMode(mode);
    applyAccentColor(accent);
    await logAudit("settings.update", { success: true, detail: "theme" });
    refresh();
  }

  async function handleAccentChange(value: string) {
    const color = value as AccentColor;
    setAccent(color);
    await updateSettings({ accentColor: color });
    applyAccentColor(color);
    flash("Accent color updated.");
  }

  async function handleBiometricToggle(enabled: boolean) {
    setBiometricEnabled(enabled);
    await updateSettings({ biometricEnabled: enabled });
    flash(enabled ? "Biometric unlock enabled." : "Biometric unlock disabled.");
  }

  async function handleAiToggle(enabled: boolean) {
    setAiFeaturesEnabled(enabled);
    await updateSettings({ aiFeaturesEnabled: enabled });
    flash(enabled ? "AI features enabled." : "AI features disabled.");
  }

  async function toggleWidget(id: DashboardWidgetId) {
    const next = widgets.includes(id) ? widgets.filter((w) => w !== id) : [...widgets, id];
    setWidgets(next);
    await updateSettings({ dashboardWidgets: next });
  }

  async function handleExport() {
    setError("");
    try {
      const json = await exportAllData();
      let payload = json;
      if (encryptedExport) {
        if (exportPassphrase.length < 8) {
          setError("Passphrase must be at least 8 characters for encrypted export.");
          return;
        }
        payload = await wrapEncryptedExport(json, exportPassphrase);
        await logAudit("backup.export_encrypted", { success: true });
      }
      const blob = new Blob([payload], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `viswallet-backup-${new Date().toISOString().slice(0, 10)}.${encryptedExport ? "vwbackup" : "json"}`;
      a.click();
      URL.revokeObjectURL(url);
      await updateSettings({ lastBackupAt: new Date() });
      flash("Backup exported successfully.");
    } catch (err) {
      setError(toSecureMessage(err));
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    const ok = await confirmAction({
      title: "Replace all data?",
      description: `Importing "${file.name}" will overwrite every transaction, budget, and setting on this device. Export a backup first if you need one.`,
      confirmLabel: "Import backup",
      destructive: true,
    });
    if (!ok) {
      e.target.value = "";
      return;
    }
    try {
      const text = await readBackupFile(file, importPassphrase || undefined);
      await importAllData(text);
      refresh();
      flash("Backup imported successfully.");
      window.location.reload();
    } catch (err) {
      setError(toSecureMessage(err));
    } finally {
      e.target.value = "";
    }
  }

  async function handleCsvExport() {
    const [txns, categories, settings] = await Promise.all([
      getActiveTransactions(),
      getActiveCategories(),
      getSettings(),
    ]);
    const csv = transactionsToCsv(txns, categoryMap(categories));
    downloadCsv(`viswallet-transactions-${getCurrentCycleKey(settings.salaryDay)}.csv`, csv);
    downloadExcel(`viswallet-transactions-${getCurrentCycleKey(settings.salaryDay)}.xls`, csv);
    flash("CSV and Excel exports downloaded.");
  }

  async function handleCsvImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    try {
      const text = await file.text();
      const rows = parseCsvTransactions(text);
      const categories = await getActiveCategories();
      const settings = await getSettings();
      const slugMap = Object.fromEntries(categories.map((c) => [c.name.toLowerCase(), c.id!]));
      const miscId = categories.find((c) => c.slug === "misc")?.id ?? categories[0]?.id;
      let imported = 0;
      for (const row of rows) {
        const categoryId = slugMap[row.categoryName.toLowerCase()] ?? miscId;
        if (!categoryId) continue;
        const monthKey = getMonthKey(row.occurredAt, settings.salaryDay);
        await addTransaction(
          {
            kind: row.kind,
            title: row.title,
            amountPaise: row.amountPaise,
            categoryId,
            occurredAt: row.occurredAt,
            monthKey,
            paymentMethod: row.paymentMethod,
            tags: [],
            notes: row.notes,
            isRecurring: false,
          },
          { allowDuplicate: true },
        );
        imported += 1;
      }
      await refresh();
      flash(`Imported ${imported} transactions from CSV.`);
    } catch (err) {
      setError(toSecureMessage(err));
    } finally {
      e.target.value = "";
    }
  }

  async function handleEnableLock(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      pinSchema.parse(newPin);
      if (newPin !== confirmPin) {
        setError(SECURE_ERRORS.PIN_MISMATCH);
        return;
      }
      await enableAppLock(newPin);
      await updateSettings({ autoLockMinutes: parseInt(autoLockMinutes, 10) || 15 });
      setAppLockEnabled(true);
      useSecurityStore.setState({ appLockEnabled: true, unlocked: true, autoLockMinutes: parseInt(autoLockMinutes, 10) || 15 });
      setNewPin("");
      setConfirmPin("");
      flash("App lock enabled.");
    } catch (err) {
      setError(toSecureMessage(err));
    }
  }

  async function handleDisableLock(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await disableAppLock(disablePin);
      setAppLockEnabled(false);
      useSecurityStore.setState({ appLockEnabled: false, unlocked: true });
      setDisablePin("");
      flash("App lock disabled.");
    } catch (err) {
      setError(toSecureMessage(err));
    }
  }

  async function handleAutoLockChange(value: string) {
    setAutoLockMinutes(value);
    const mins = Math.min(120, Math.max(1, parseInt(value, 10) || 15));
    await updateSettings({ autoLockMinutes: mins });
    useSecurityStore.setState({ autoLockMinutes: mins });
  }

  async function handleReset() {
    const { allowed } = checkRateLimit("data-reset", RESET_RATE_LIMIT.maxAttempts, RESET_RATE_LIMIT.windowMs);
    if (!allowed) {
      setError("Too many reset attempts. Please wait.");
      return;
    }
    const ok = await confirmAction({
      title: "Delete all data?",
      description: "This permanently removes all transactions, goals, and settings from this device. This cannot be undone.",
      confirmLabel: "Delete everything",
      destructive: true,
    });
    if (!ok) return;
    setResetting(true);
    try {
      await logAudit("data.reset", { success: true });
      await db.delete();
      window.location.href = "/onboarding";
    } catch {
      setError("Reset failed. Please try again.");
      setResetting(false);
    }
  }

  return (
    <PageContainer className="max-w-5xl">
      <PageHeader title="Settings" description="Appearance, security, and your data." />

      {!settingsLoaded ? (
        <p className="text-sm text-muted-foreground">Loading settings…</p>
      ) : (
      <>

      {success && <SuccessBanner message={success} />}
      {error && (
        <p className="rounded-xl border border-destructive/20 bg-[var(--destructive-muted)] px-4 py-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      {configured && (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0 text-sm text-muted-foreground">
          <p>Signed in — your data is available on any device with the same login.</p>
          <p>PIN and app lock never leave this device.</p>
        </CardContent>
      </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-0">
          {!appLockEnabled ? (
            <form onSubmit={handleEnableLock} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Protect your financial data with a PIN. Locks automatically after inactivity.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="New PIN (4–8 digits)"
                  type="password"
                  inputMode="numeric"
                  maxLength={8}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                />
                <Input
                  label="Confirm PIN"
                  type="password"
                  inputMode="numeric"
                  maxLength={8}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                />
              </div>
              <Select label="Auto-lock after (minutes)" value={autoLockMinutes} onChange={(e) => handleAutoLockChange(e.target.value)}>
                <option value="5">5 minutes</option>
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="60">60 minutes</option>
              </Select>
              <Button type="submit">Enable app lock</Button>
            </form>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-success">App lock is enabled.</p>
              <Select label="Auto-lock after (minutes)" value={autoLockMinutes} onChange={(e) => handleAutoLockChange(e.target.value)}>
                <option value="5">5 minutes</option>
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="60">60 minutes</option>
              </Select>
              <Button variant="outline" onClick={() => lock()}>
                Lock now
              </Button>
              <form onSubmit={handleDisableLock} className="flex flex-wrap items-end gap-3 border-t border-border pt-4">
                <Input
                  label="PIN to disable lock"
                  type="password"
                  inputMode="numeric"
                  maxLength={8}
                  value={disablePin}
                  onChange={(e) => setDisablePin(e.target.value.replace(/\D/g, ""))}
                  className="max-w-xs"
                />
                <Button type="submit" variant="destructive">
                  Disable app lock
                </Button>
              </form>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Smart features</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <Checkbox
            label="AI features (natural-language add, smart categories, coach)"
            checked={aiFeaturesEnabled}
            onChange={(e) => void handleAiToggle(e.target.checked)}
            disabled={!aiFeatures.available}
          />
          {aiFeatures.available ? (
            <p className="text-sm text-muted-foreground">
              Powered by Groq on our server — only cycle summaries and your typed phrases are sent, never your full vault.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Add <code className="text-xs">GROQ_API_KEY</code> in Vercel (Settings → Environment Variables, server-only) then redeploy.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <Select label="Theme" value={theme} onChange={(e) => handleThemeChange(e.target.value)}>
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </Select>
          <Select label="Accent color" value={accent} onChange={(e) => handleAccentChange(e.target.value)}>
            <option value="violet">Violet</option>
            <option value="ocean">Classic</option>
            <option value="emerald">Emerald</option>
            <option value="rose">Rose</option>
            <option value="amber">Amber</option>
            <option value="slate">Slate</option>
          </Select>
          <Checkbox
            label="Unlock with Face ID or fingerprint"
            checked={biometricEnabled}
            onChange={(e) => handleBiometricToggle(e.target.checked)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dashboard widgets</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 pt-0 sm:grid-cols-2">
          {DEFAULT_DASHBOARD_WIDGETS.map((id) => (
            <Checkbox
              key={id}
              label={DASHBOARD_WIDGET_LABELS[id]}
              checked={widgets.includes(id)}
              onChange={() => toggleWidget(id)}
              className="rounded-lg border border-border/60 px-3 py-2"
            />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Export & import</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <Hint>Export transactions as a spreadsheet, or import from CSV or a bank statement.</Hint>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleCsvExport}>Export CSV / Excel</Button>
            <Button variant="outline" onClick={() => csvRef.current?.click()}>Import CSV</Button>
            <Button variant="outline" onClick={() => setStatementImportOpen(true)}>Import bank statement</Button>
            <input ref={csvRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleCsvImport} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Backups</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <Hint>
            Download a full copy of your data, or restore from a file you exported earlier.
          </Hint>
          <Checkbox
            label="Password-protect export file"
            checked={encryptedExport}
            onChange={(e) => setEncryptedExport(e.target.checked)}
          />
          {encryptedExport && (
            <Input
              label="Export passphrase (min 8 characters)"
              type="password"
              value={exportPassphrase}
              onChange={(e) => setExportPassphrase(e.target.value)}
              autoComplete="new-password"
            />
          )}
          <Input
            label="Import passphrase (if backup is encrypted)"
            type="password"
            value={importPassphrase}
            onChange={(e) => setImportPassphrase(e.target.value)}
            autoComplete="off"
          />
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleExport}>
              Export backup
            </Button>
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              Import backup
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".json,.vwbackup,application/json"
              className="hidden"
              onChange={handleImport}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">Danger zone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <p className="text-sm text-muted-foreground">
            Permanently delete all Viswallet data on this device.
          </p>
          <Button variant="destructive" onClick={handleReset} disabled={resetting}>
            {resetting ? "Resetting..." : "Reset all data"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">About & legal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0 text-sm text-muted-foreground">
          <p>
            Viswallet v{process.env.NEXT_PUBLIC_APP_VERSION ?? "1.0.0"} — personal finance, built to stay private.
          </p>
          <div className="flex flex-wrap gap-3">
            <a href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </a>
            <a href="/terms" className="text-primary hover:underline">
              Terms of Service
            </a>
            <a href="/licenses" className="text-primary hover:underline">
              Open Source Licenses
            </a>
          </div>
        </CardContent>
      </Card>
      </>
      )}
    </PageContainer>
  );
}

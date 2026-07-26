"use client";

import { useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { FileUp, Upload, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Hint } from "@/components/ui/hint";
import { Badge } from "@/components/ui/badge";
import { useUIStore } from "@/lib/store/ui-store";
import { useCategories } from "@/lib/queries/use-finance";
import { useInvalidateFinance } from "@/hooks/use-invalidate-finance";
import { getSettings, db } from "@/lib/db";
import { parseStatementFile } from "@/lib/import/parse-statement";
import { bulkImportStatementRows, markDuplicateRows } from "@/lib/import/bulk-import";
import type { ParsedStatementRow } from "@/lib/import/types";
import { STATEMENT_ACCEPT } from "@/lib/import/types";
import { formatINR } from "@/lib/money";
import { showToast } from "@/lib/store/toast-store";

export function StatementImportModal() {
  const open = useUIStore((s) => s.statementImportOpen);
  const setOpen = useUIStore((s) => s.setStatementImportOpen);
  const invalidate = useInvalidateFinance();
  const categories = useCategories();
  const fileRef = useRef<HTMLInputElement>(null);

  const [rows, setRows] = useState<ParsedStatementRow[]>([]);
  const [accountId, setAccountId] = useState("");
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");

  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts", "active"],
    queryFn: () => db.accounts.filter((a) => a.isActive).toArray(),
    enabled: open,
  });

  const selectedCount = useMemo(() => rows.filter((row) => row.selected).length, [rows]);
  const duplicateCount = useMemo(() => rows.filter((row) => row.isDuplicate).length, [rows]);

  function reset() {
    setRows([]);
    setAccountId("");
    setError("");
    setParsing(false);
    setImporting(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  function close() {
    setOpen(false);
    reset();
  }

  async function handleFile(file: File) {
    setParsing(true);
    setError("");
    try {
      const parsed = await parseStatementFile(file);
      const settings = await getSettings();
      const withDuplicates = await markDuplicateRows(parsed, {
        categories,
        salaryDay: settings.salaryDay,
      });
      setRows(withDuplicates);
      if (withDuplicates.length === 0) {
        setError("No transactions found in this file.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read this statement.");
      setRows([]);
    } finally {
      setParsing(false);
    }
  }

  async function handleImport() {
    if (rows.length === 0) return;
    setImporting(true);
    setError("");
    try {
      const settings = await getSettings();
      const result = await bulkImportStatementRows(rows, {
        categories,
        salaryDay: settings.salaryDay,
        accountId: accountId ? Number(accountId) : undefined,
        skipDuplicates: true,
      });
      await invalidate();
      showToast(`Imported ${result.imported} transactions`, {
        tone: result.imported > 0 ? "success" : "default",
      });
      if (result.duplicates > 0) {
        showToast(`Skipped ${result.duplicates} duplicates already in your ledger`, { tone: "default" });
      }
      close();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed.");
    } finally {
      setImporting(false);
    }
  }

  function updateRow(id: string, patch: Partial<ParsedStatementRow>) {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  return (
    <Dialog open={open} onClose={close} labelledBy="statement-import-title" size="lg">
      <DialogBody className="max-h-[85vh] space-y-4 overflow-y-auto">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="statement-import-title" className="text-lg font-semibold">
              Import bank statement
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Upload a PDF or CSV from your bank. We read dates, amounts, and descriptions — then you review before saving.
            </p>
          </div>
          <button type="button" onClick={close} className="rounded-md p-1 text-muted-foreground hover:bg-foreground/5" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <Hint>
          Best results: export CSV from HDFC, ICICI, SBI, Axis, or Kotak apps. PDF statements work when they contain readable text (not scanned images).
        </Hint>

        <div className="rounded-xl border border-dashed border-border bg-background/60 p-5">
          <input
            ref={fileRef}
            type="file"
            accept={STATEMENT_ACCEPT}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
              e.target.value = "";
            }}
          />
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-muted text-primary">
              <Upload size={20} />
            </span>
            <div>
              <p className="font-medium">Drop a statement file here</p>
              <p className="text-sm text-muted-foreground">PDF, CSV, or TXT · up to 10 MB</p>
            </div>
            <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={parsing}>
              <FileUp size={16} />
              {parsing ? "Reading file…" : "Choose file"}
            </Button>
          </div>
        </div>

        {accounts.length > 0 ? (
          <Select
            label="Link to account (optional)"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
          >
            <option value="">No account</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </Select>
        ) : null}

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        {rows.length > 0 ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="primary">{rows.length} found</Badge>
              <Badge variant="outline">{selectedCount} selected</Badge>
              {duplicateCount > 0 ? <Badge variant="warning">{duplicateCount} possible duplicates</Badge> : null}
            </div>

            <div className="scroll-premium max-h-80 overflow-auto rounded-xl border border-border">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="sticky top-0 bg-elevated text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="px-3 py-2">Use</th>
                    <th className="px-3 py-2">Date & time</th>
                    <th className="px-3 py-2">Description</th>
                    <th className="px-3 py-2">Amount</th>
                    <th className="px-3 py-2">Category</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-b border-border-light align-top">
                      <td className="px-3 py-2">
                        <Checkbox
                          checked={row.selected}
                          onChange={(e) => updateRow(row.id, { selected: e.target.checked })}
                          aria-label={`Include ${row.title}`}
                        />
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-muted-foreground">
                        {format(row.occurredAt, "dd MMM yyyy")}
                        <br />
                        {format(row.occurredAt, "HH:mm")}
                      </td>
                      <td className="px-3 py-2">
                        <p className="font-medium">{row.title}</p>
                        <p className="text-xs text-muted-foreground">{row.kind === "income" ? "Income" : "Expense"} · {row.paymentMethod}</p>
                        {row.isDuplicate ? <p className="text-xs text-warning">Already logged</p> : null}
                      </td>
                      <td className="px-3 py-2 font-medium tabular-nums">{formatINR(row.amountPaise)}</td>
                      <td className="px-3 py-2">
                        <Select
                          value={row.categorySlug}
                          onChange={(e) => updateRow(row.id, { categorySlug: e.target.value })}
                          className="min-w-[9rem]"
                          aria-label={`Category for ${row.title}`}
                        >
                          {categories.map((category) => (
                            <option key={category.id} value={category.slug}>
                              {category.name}
                            </option>
                          ))}
                        </Select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </DialogBody>

      <DialogFooter>
        <Button variant="ghost" onClick={close}>
          Cancel
        </Button>
        <Button onClick={() => void handleImport()} disabled={importing || selectedCount === 0}>
          {importing ? "Importing…" : `Import ${selectedCount || ""} transactions`}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

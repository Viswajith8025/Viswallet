"use client";

import { useMemo, useState } from "react";
import Fuse from "fuse.js";
import { Search, AlertTriangle } from "lucide-react";
import { PageHeader, EmptyState, PageContainer } from "@/components/ui/page";
import { DexiePageGate } from "@/components/layout/dexie-page-gate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TransactionRow } from "@/components/shared/transaction-row";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { GlobalFilterBar } from "@/components/filters/global-filter-bar";
import { useCategories } from "@/lib/queries/use-finance";
import { categoryMap } from "@/lib/engines/finance-snapshot";
import { findDuplicateTransactions } from "@/lib/engines/premium/duplicate-detector";
import { getActiveTransactions } from "@/lib/db";
import { useDexieTable, useDebounce, usePagination } from "@/hooks";
import { TabBar } from "@/components/ui/tab-bar";
import { selectCategoryId, selectAmountRange, useFilterStore } from "@/lib/store/filter-store";
import { copy } from "@/lib/ux/copy";
import { formatINR, parseRupeeInput } from "@/lib/money";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [kindFilter, setKindFilter] = useState<"all" | "expense" | "income">("all");
  const debouncedQuery = useDebounce(query, 250);
  const categories = useCategories();
  const cats = categoryMap(categories);
  const categoryId = useFilterStore(selectCategoryId);
  const { min: minAmount, max: maxAmount } = useFilterStore(selectAmountRange);

  const { data: transactions = [], isPending, isError, refetch } = useDexieTable("transactions-search", () =>
    getActiveTransactions(5000),
  );

  const fuse = useMemo(
    () =>
      new Fuse(transactions, {
        keys: ["title", "notes", "paymentMethod", "tags"],
        threshold: 0.35,
      }),
    [transactions],
  );

  const filtered = useMemo(() => {
    let base = transactions;
    if (kindFilter !== "all") base = base.filter((t) => t.kind === kindFilter);
    if (categoryId) base = base.filter((t) => t.categoryId === categoryId);
    if (minAmount != null) base = base.filter((t) => t.amountPaise >= minAmount);
    if (maxAmount != null) base = base.filter((t) => t.amountPaise <= maxAmount);
    if (!debouncedQuery.trim()) return base;
    const ids = new Set(base.map((t) => t.id));
    return fuse
      .search(debouncedQuery.trim())
      .map((r) => r.item)
      .filter((t) => ids.has(t.id));
  }, [transactions, kindFilter, categoryId, minAmount, maxAmount, debouncedQuery, fuse]);

  const duplicates = useMemo(() => findDuplicateTransactions(transactions).slice(0, 5), [transactions]);
  const pagination = usePagination(filtered, 25);

  return (
    <DexiePageGate isPending={isPending} isError={isError} onRetry={() => refetch()}>
    <PageContainer className="max-w-5xl">
      <PageHeader title={copy.search.advancedTitle} description={copy.search.advancedDescription} />
      <GlobalFilterBar />

      <TabBar
        className="lg:hidden"
        options={[
          { value: "all", label: copy.labels.all },
          { value: "expense", label: copy.labels.spent },
          { value: "income", label: copy.labels.earned },
        ]}
        value={kindFilter}
        onChange={(v) => {
          setKindFilter(v as "all" | "expense" | "income");
          pagination.reset();
        }}
        aria-label={copy.forms.filterByType}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="relative sm:col-span-2">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            className="pl-10"
            placeholder={copy.forms.searchPlaceholder}
            value={query}
            onChange={(e) => { setQuery(e.target.value); pagination.reset(); }}
            autoFocus
            aria-label={copy.forms.searchTransactions}
          />
        </div>
        <Input
          type="number"
          label={copy.forms.minAmount}
          placeholder={copy.forms.minAmountPlaceholder}
          aria-label={copy.forms.minAmountAria}
          onChange={(e) => {
            const raw = e.target.value;
            const paise = raw.trim() ? parseRupeeInput(raw) : null;
            useFilterStore.getState().setAmountRange(paise && paise > 0 ? paise : null, maxAmount);
            pagination.reset();
          }}
        />
      </div>

      {duplicates.length > 0 && (
        <Card className="border-warning/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle size={16} className="text-warning" />
              {copy.searchPage.duplicatesTitle}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {duplicates.map((group, i) => (
              <div key={i} className="rounded-lg bg-muted/40 px-3 py-2 text-sm">
                <p className="font-medium">{group.reason}</p>
                <p className="text-xs text-muted-foreground">
                  {group.transactions.map((t) => `${t.title} (${formatINR(t.amountPaise)})`).join(" · ")}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          title={debouncedQuery ? copy.empty.noMatches.title : copy.search.startTyping}
          description={debouncedQuery ? copy.empty.noMatches.description(debouncedQuery) : copy.search.searchHistory}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y divide-border/60">
              {pagination.items.map((t) => (
                <TransactionRow
                  key={t.id}
                  transaction={t}
                  categoryName={cats.get(t.categoryId)?.name}
                  categoryColor={cats.get(t.categoryId)?.color}
                  categoryIconName={cats.get(t.categoryId)?.iconName}
                  compact
                />
              ))}
            </ul>
            <PaginationControls
              page={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalItems}
              pageSize={pagination.pageSize}
              hasPrev={pagination.hasPrev}
              hasNext={pagination.hasNext}
              onPrev={pagination.prev}
              onNext={pagination.next}
            />
          </CardContent>
        </Card>
      )}
    </PageContainer>
    </DexiePageGate>
  );
}

"use client";

import { useCallback, useMemo, useState } from "react";

export function usePagination<T>(items: T[], pageSize = 50) {
  const [page, setPage] = useState(0);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  const safePage = Math.min(page, totalPages - 1);

  const slice = useMemo(() => {
    const start = safePage * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, safePage, pageSize]);

  const reset = useCallback(() => setPage(0), []);

  const next = useCallback(() => setPage((p) => Math.min(p + 1, totalPages - 1)), [totalPages]);
  const prev = useCallback(() => setPage((p) => Math.max(p - 1, 0)), []);

  return {
    page: safePage,
    pageSize,
    totalPages,
    totalItems: items.length,
    items: slice,
    hasNext: safePage < totalPages - 1,
    hasPrev: safePage > 0,
    next,
    prev,
    setPage,
    reset,
  };
}

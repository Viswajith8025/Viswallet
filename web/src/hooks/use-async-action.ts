"use client";

import { useCallback, useRef, useState } from "react";

/** Prevents double-submit on async form handlers. */
export function useAsyncAction() {
  const [loading, setLoading] = useState(false);
  const busy = useRef(false);

  const run = useCallback(async <T,>(fn: () => Promise<T>): Promise<T | undefined> => {
    if (busy.current) return undefined;
    busy.current = true;
    setLoading(true);
    try {
      return await fn();
    } finally {
      busy.current = false;
      setLoading(false);
    }
  }, []);

  return { loading, run };
}

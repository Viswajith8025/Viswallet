"use client";

import { useCallback, useRef, useState } from "react";
import { reportError } from "@/lib/monitoring/report";
import { showToast } from "@/lib/store/toast-store";
import { errorFeedback } from "@/lib/ux/feedback";

type AsyncActionOptions = {
  errorMessage?: string;
  silent?: boolean;
};

/** Prevents double-submit on async form handlers. */
export function useAsyncAction() {
  const [loading, setLoading] = useState(false);
  const busy = useRef(false);

  const run = useCallback(
    async <T,>(fn: () => Promise<T>, options?: AsyncActionOptions): Promise<T | undefined> => {
      if (busy.current) return undefined;
      busy.current = true;
      setLoading(true);
      try {
        return await fn();
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        reportError(error, "async-action");
        if (!options?.silent) {
          errorFeedback();
          showToast(options?.errorMessage ?? "Something went wrong. Please try again.", {
            tone: "error",
          });
        }
        return undefined;
      } finally {
        busy.current = false;
        setLoading(false);
      }
    },
    [],
  );

  return { loading, run };
}

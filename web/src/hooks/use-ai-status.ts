"use client";

import { useEffect, useState } from "react";
import { fetchAiStatus, type AiStatus } from "@/lib/ai/client";

export function useAiStatus(): AiStatus | null {
  const [status, setStatus] = useState<AiStatus | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchAiStatus().then((s) => {
      if (!cancelled) setStatus(s);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return status;
}

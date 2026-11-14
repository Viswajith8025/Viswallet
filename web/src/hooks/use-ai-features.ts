"use client";

import { useEffect, useState } from "react";
import { useDb } from "@/components/providers/db-provider";
import { getSettings } from "@/lib/db";
import { loadAiSession, shouldShowAiEntry, type AiStatus } from "@/lib/ai/client";

export type AiFeaturesState = {
  /** Groq API key is configured on the server */
  available: boolean;
  /** User opted in via Settings */
  enabled: boolean;
  /** Both available and enabled — safe to call AI APIs */
  active: boolean;
  status: AiStatus | null;
  loaded: boolean;
};

export function useAiFeatures(): AiFeaturesState {
  const { version } = useDb();
  const [status, setStatus] = useState<AiStatus | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void loadAiSession().then((ai) => {
      if (!cancelled) setStatus(ai);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void getSettings().then((settings) => {
      if (cancelled) return;
      setEnabled(settings.aiFeaturesEnabled ?? true);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [version]);

  const available = shouldShowAiEntry(status);
  return {
    available,
    enabled,
    active: available && enabled,
    status,
    loaded,
  };
}

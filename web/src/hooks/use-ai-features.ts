"use client";

import { useEffect, useState } from "react";
import { getSettings } from "@/lib/db";
import { fetchAiStatus, type AiStatus } from "@/lib/ai/client";

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
  const [status, setStatus] = useState<AiStatus | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([fetchAiStatus(), getSettings()]).then(([ai, settings]) => {
      if (cancelled) return;
      setStatus(ai);
      setEnabled(Boolean(settings.aiFeaturesEnabled));
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const available = Boolean(status?.groq);
  return {
    available,
    enabled,
    active: available && enabled,
    status,
    loaded,
  };
}

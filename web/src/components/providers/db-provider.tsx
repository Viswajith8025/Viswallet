"use client";

import { useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { financeKeys } from "@/lib/queries/use-finance";
import { onNotificationsChanged, onDbDataChanged } from "@/lib/notifications/bus";
import { scheduleNotificationSync } from "@/lib/notifications/sync";
import { scheduleCloudSync, shouldAutoCloudSync } from "@/lib/supabase/cloud-sync";
import { getAuthUser } from "@/lib/supabase/auth";

type DbContextValue = {
  version: number;
  refresh: () => Promise<void>;
};

const DbContext = createContext<DbContextValue | null>(null);

export function DbProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [version, setVersion] = useState(0);

  const invalidateAll = useCallback(() => {
    void Promise.all([
      queryClient.invalidateQueries({ queryKey: financeKeys.all }),
      queryClient.invalidateQueries({ queryKey: ["categories"] }),
      queryClient.invalidateQueries({ queryKey: ["dexie"] }),
      queryClient.invalidateQueries({ queryKey: financeKeys.notificationsUnread }),
      queryClient.invalidateQueries({ queryKey: ["accounts"] }),
      queryClient.invalidateQueries({ queryKey: ["account-transfers"] }),
    ]);
    setVersion((v) => v + 1);
  }, [queryClient]);

  const refresh = useCallback(async () => {
    scheduleNotificationSync();
    const user = await getAuthUser();
    if (user && shouldAutoCloudSync()) scheduleCloudSync();
    invalidateAll();
  }, [invalidateAll]);

  useEffect(() => {
    const invalidateNotifications = () => {
      void queryClient.invalidateQueries({ queryKey: financeKeys.notificationsUnread });
    };
    const onDataChanged = () => {
      invalidateAll();
      void getAuthUser().then((user) => {
        if (user && shouldAutoCloudSync()) scheduleCloudSync();
      });
    };
    const offNotifications = onNotificationsChanged(invalidateNotifications);
    const offDb = onDbDataChanged(onDataChanged);
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void getAuthUser().then((user) => {
          if (user && shouldAutoCloudSync()) scheduleCloudSync();
        });
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      offNotifications();
      offDb();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [invalidateAll, queryClient]);

  const value = useMemo(() => ({ version, refresh }), [version, refresh]);

  return <DbContext.Provider value={value}>{children}</DbContext.Provider>;
}

export function useDb(): DbContextValue {
  const ctx = useContext(DbContext);
  if (!ctx) {
    throw new Error("useDb must be used within DbProvider");
  }
  return ctx;
}

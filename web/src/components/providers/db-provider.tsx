"use client";

import { useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { financeKeys } from "@/lib/queries/use-finance";
import { onNotificationsChanged, onDbDataChanged } from "@/lib/notifications/bus";
import { scheduleNotificationSync } from "@/lib/notifications/sync";
import { scheduleCloudSync, canSyncCloudVault } from "@/lib/supabase/cloud-sync";
import { getAuthUser } from "@/lib/supabase/auth";

type DbContextValue = {
  /** Bumps when local IndexedDB data changes — drives useDexieTable refetch. */
  version: number;
  /** Invalidate finance queries + all Dexie table caches. */
  refresh: () => Promise<void>;
};

const DbContext = createContext<DbContextValue | null>(null);

export function DbProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [version, setVersion] = useState(0);

  const refresh = useCallback(async () => {
    scheduleNotificationSync();
    const user = await getAuthUser();
    if (user && canSyncCloudVault()) scheduleCloudSync();
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: financeKeys.all }),
      queryClient.invalidateQueries({ queryKey: ["dexie"] }),
      queryClient.invalidateQueries({ queryKey: financeKeys.notificationsUnread }),
    ]);
    setVersion((v) => v + 1);
  }, [queryClient]);

  useEffect(() => {
    const invalidateNotifications = () => {
      void queryClient.invalidateQueries({ queryKey: financeKeys.notificationsUnread });
    };
    const invalidateAll = () => {
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: financeKeys.all }),
        queryClient.invalidateQueries({ queryKey: ["dexie"] }),
        queryClient.invalidateQueries({ queryKey: financeKeys.notificationsUnread }),
      ]);
      setVersion((v) => v + 1);
    };

    const offNotifications = onNotificationsChanged(invalidateNotifications);
    const offDb = onDbDataChanged(invalidateAll);

    return () => {
      offNotifications();
      offDb();
    };
  }, [queryClient]);

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

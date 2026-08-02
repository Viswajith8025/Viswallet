"use client";

import { useEffect, useRef } from "react";
import { showToast } from "@/lib/store/toast-store";

function promptAppRefresh() {
  showToast("Update ready — refresh for the latest version.", {
    tone: "default",
    action: {
      label: "Refresh",
      onClick: () => {
        window.location.reload();
      },
    },
  });
}

export function RegisterSW() {
  const prompted = useRef(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || process.env.NODE_ENV !== "production") return;

    let registration: ServiceWorkerRegistration | undefined;

    const onUpdateReady = () => {
      if (prompted.current) return;
      prompted.current = true;
      promptAppRefresh();
    };

    const watchWorker = (worker: ServiceWorker | null | undefined) => {
      if (!worker) return;
      worker.addEventListener("statechange", () => {
        if (worker.state === "installed" && navigator.serviceWorker.controller) {
          onUpdateReady();
        }
      });
    };

    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        registration = reg;

        if (reg.waiting && navigator.serviceWorker.controller) {
          onUpdateReady();
        }

        watchWorker(reg.installing);

        reg.addEventListener("updatefound", () => {
          watchWorker(reg.installing);
        });
      })
      .catch(() => {});

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void registration?.update();
      }
    };

    document.addEventListener("visibilitychange", onVisible);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return null;
}

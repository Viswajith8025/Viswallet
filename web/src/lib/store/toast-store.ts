import { create } from "zustand";
import { successFeedback, errorFeedback } from "@/lib/ux/feedback";

export type ToastItem = {
  id: string;
  message: string;
  tone?: "default" | "success" | "warning" | "error" | "info";
  undo?: () => void | Promise<void>;
  action?: { label: string; onClick: () => void | Promise<void> };
  durationMs?: number;
};

type ToastState = {
  toasts: ToastItem[];
  push: (toast: Omit<ToastItem, "id">) => void;
  dismiss: (id: string) => void;
};

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: (toast) => {
    const id = crypto.randomUUID();
    if (toast.tone === "success") successFeedback();
    if (toast.tone === "error") errorFeedback();
    set({ toasts: [...get().toasts, { ...toast, id }] });
    const duration = toast.durationMs ?? (toast.undo || toast.action ? 8000 : 4000);
    setTimeout(() => get().dismiss(id), duration);
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));

export function showToast(
  message: string,
  options?: {
    undo?: () => void | Promise<void>;
    action?: { label: string; onClick: () => void | Promise<void> };
    tone?: ToastItem["tone"];
    durationMs?: number;
  },
) {
  useToastStore.getState().push({ message, ...options });
}

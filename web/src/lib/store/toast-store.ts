import { create } from "zustand";
import { successFeedback } from "@/lib/ux/feedback";

export type ToastItem = {
  id: string;
  message: string;
  tone?: "default" | "success" | "warning";
  undo?: () => void | Promise<void>;
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
    set({ toasts: [...get().toasts, { ...toast, id }] });
    setTimeout(() => get().dismiss(id), toast.undo ? 8000 : 4000);
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));

export function showToast(message: string, options?: { undo?: () => void | Promise<void>; tone?: ToastItem["tone"] }) {
  useToastStore.getState().push({ message, ...options });
}

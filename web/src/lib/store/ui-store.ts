import { create } from "zustand";

type UIState = {
  commandOpen: boolean;
  quickAddOpen: boolean;
  quickAddKind: "expense" | "income";
  sidebarCollapsed: boolean;
  setCommandOpen: (open: boolean) => void;
  setQuickAddOpen: (open: boolean, kind?: "expense" | "income") => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
};

export const useUIStore = create<UIState>((set) => ({
  commandOpen: false,
  quickAddOpen: false,
  quickAddKind: "expense",
  sidebarCollapsed: false,
  setCommandOpen: (commandOpen) => set({ commandOpen }),
  setQuickAddOpen: (quickAddOpen, kind = "expense") =>
    set({ quickAddOpen, quickAddKind: kind }),
  setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
}));

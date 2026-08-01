import { create } from "zustand";

type UIState = {
  commandOpen: boolean;
  quickAddOpen: boolean;
  quickAddKind: "expense" | "income";
  statementImportOpen: boolean;
  sidebarCollapsed: boolean;
  mobileMenuOpen: boolean;
  setCommandOpen: (open: boolean) => void;
  setQuickAddOpen: (open: boolean, kind?: "expense" | "income") => void;
  setStatementImportOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setMobileMenuOpen: (open: boolean) => void;
};

export const useUIStore = create<UIState>((set) => ({
  commandOpen: false,
  quickAddOpen: false,
  quickAddKind: "expense",
  statementImportOpen: false,
  sidebarCollapsed: false,
  mobileMenuOpen: false,
  setCommandOpen: (commandOpen) => set({ commandOpen }),
  setQuickAddOpen: (quickAddOpen, kind = "expense") =>
    set({ quickAddOpen, quickAddKind: kind }),
  setStatementImportOpen: (statementImportOpen) => set({ statementImportOpen }),
  setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
  setMobileMenuOpen: (mobileMenuOpen) => set({ mobileMenuOpen }),
}));

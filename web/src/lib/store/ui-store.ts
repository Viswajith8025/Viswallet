import { create } from "zustand";

const SIDEBAR_KEY = "vw_sidebar_collapsed";
const sidebarListeners = new Set<() => void>();

export function subscribeSidebar(listener: () => void) {
  sidebarListeners.add(listener);
  return () => sidebarListeners.delete(listener);
}

export function readSidebarCollapsed() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(SIDEBAR_KEY) === "1";
}

function emitSidebar() {
  sidebarListeners.forEach((listener) => listener());
}

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
  setSidebarCollapsed: (sidebarCollapsed) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(SIDEBAR_KEY, sidebarCollapsed ? "1" : "0");
    }
    set({ sidebarCollapsed });
    emitSidebar();
  },
  setMobileMenuOpen: (mobileMenuOpen) => set({ mobileMenuOpen }),
}));

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  LayoutDashboard,
  ArrowLeftRight,
  BarChart3,
  PiggyBank,
  Users,
  Settings,
  Plus,
  Search,
  Sparkles,
  Calendar,
  Target,
  FileText,
  LineChart,
  Calculator,
  Award,
} from "lucide-react";
import { useUIStore } from "@/lib/store/ui-store";

const ACTIONS = [
  { label: "Home", href: "/", icon: LayoutDashboard, kbd: "G H" },
  { label: "Money", href: "/transactions", icon: ArrowLeftRight, kbd: "G T" },
  { label: "Crew", href: "/crew", icon: Users },
  { label: "You", href: "/you", icon: Settings, kbd: "G Y" },
  { label: "Analytics", href: "/analytics", icon: BarChart3, kbd: "G A" },
  { label: "Budgets", href: "/budgets", icon: PiggyBank },
  { label: "Insights", href: "/insights", icon: Sparkles },
  { label: "Reports", href: "/reports", icon: FileText },
  { label: "Forecast", href: "/forecast", icon: LineChart },
  { label: "Debt planner", href: "/debt-planner", icon: Calculator },
  { label: "Achievements", href: "/achievements", icon: Award },
  { label: "Calendar", href: "/calendar", icon: Calendar },
  { label: "Goals", href: "/goals", icon: Target },
  { label: "Settings", href: "/settings", icon: Settings, kbd: "G S" },
];

export function CommandPalette() {
  const router = useRouter();
  const open = useUIStore((s) => s.commandOpen);
  const setOpen = useUIStore((s) => s.setCommandOpen);
  const setQuickAddOpen = useUIStore((s) => s.setQuickAddOpen);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(!open);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  return (
    open && (
      <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-[12vh]">
        <button
          type="button"
          aria-label="Close command palette"
          className="absolute inset-0 bg-bg/70"
          onClick={() => setOpen(false)}
        />
        <div className="relative w-full max-w-xl">
          <Command
            className="overflow-hidden rounded-[14px] border border-hairline bg-raised"
            onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
          >
              <div className="flex items-center gap-3 border-b border-border/80 px-4">
                <Search size={18} className="shrink-0 text-muted-foreground" />
                <Command.Input
                  placeholder="Search pages, actions..."
                  className="h-14 w-full bg-transparent text-[15px] outline-none placeholder:text-muted-foreground/60"
                  autoFocus
                />
                <kbd className="hidden rounded-md border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline">
                  ESC
                </kbd>
              </div>
              <Command.List className="max-h-[min(420px,50vh)] overflow-y-auto p-2">
                <Command.Empty className="px-4 py-10 text-center text-sm text-muted-foreground">
                  No results found.
                </Command.Empty>
                <Command.Group heading="Quick actions">
                  <CommandItem
                    onSelect={() => {
                      setOpen(false);
                      setQuickAddOpen(true, "expense");
                    }}
                  >
                    <Plus size={16} /> Add expense
                  </CommandItem>
                  <CommandItem
                    onSelect={() => {
                      setOpen(false);
                      setQuickAddOpen(true, "income");
                    }}
                  >
                    <Plus size={16} /> Add income
                  </CommandItem>
                </Command.Group>
                <Command.Group heading="Navigate">
                  {ACTIONS.map((a) => (
                    <CommandItem
                      key={a.href}
                      onSelect={() => {
                        setOpen(false);
                        router.push(a.href);
                      }}
                    >
                      <a.icon size={16} />
                      <span className="flex-1">{a.label}</span>
                      {a.kbd && (
                        <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                          {a.kbd}
                        </kbd>
                      )}
                    </CommandItem>
                  ))}
                </Command.Group>
              </Command.List>
            </Command>
        </div>
      </div>
    )
  );
}

function CommandItem({
  children,
  onSelect,
}: {
  children: React.ReactNode;
  onSelect: () => void;
}) {
  return (
    <Command.Item
      className="flex min-h-11 cursor-pointer items-center gap-3 border-b border-hairline px-3 py-2.5 text-sm text-ink outline-none aria-selected:bg-surface"
      onSelect={onSelect}
    >
      {children}
    </Command.Item>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  BarChart3,
  PiggyBank,
  Receipt,
  Repeat,
  IndianRupee,
  HandCoins,
  ArrowDownLeft,
  CreditCard,
  Target,
  Heart,
  TrendingUp,
  Wallet,
  Calendar,
  Sparkles,
  Tags,
  Search,
  Bell,
  User,
  Settings,
  PanelLeft,
  FileText,
  LineChart,
  Landmark,
  Award,
  StickyNote,
  Calculator,
} from "lucide-react";
import { cn } from "@/lib/design/cn";
import { LegalFooter } from "@/components/legal/legal-footer";
import { useUIStore } from "@/lib/store/ui-store";
import { Button } from "@/components/ui/button";

const NAV = [
  { section: "Overview" },
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/insights", label: "Insights", icon: Sparkles },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/forecast", label: "Forecast", icon: LineChart },
  { href: "/search", label: "Search", icon: Search },
  { section: "Money" },
  { href: "/budgets", label: "Budgets", icon: PiggyBank },
  { href: "/bills", label: "Bills", icon: Receipt },
  { href: "/subscriptions", label: "Subscriptions", icon: Repeat },
  { href: "/income", label: "Income", icon: IndianRupee },
  { href: "/salary", label: "Salary", icon: Wallet },
  { section: "Credit" },
  { href: "/loans", label: "Lent", icon: HandCoins },
  { href: "/borrowed", label: "Borrowed", icon: ArrowDownLeft },
  { href: "/emi", label: "EMI Tracker", icon: CreditCard },
  { href: "/debt-planner", label: "Debt Planner", icon: Calculator },
  { section: "Wealth" },
  { href: "/accounts", label: "Accounts", icon: Landmark },
  { href: "/goals", label: "Savings Goals", icon: Target },
  { href: "/wishlist", label: "Wishlist", icon: Heart },
  { href: "/investments", label: "Investments", icon: TrendingUp },
  { href: "/net-worth", label: "Net Worth", icon: Wallet },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/achievements", label: "Achievements", icon: Award },
  { href: "/notes", label: "Secure Notes", icon: StickyNote },
  { section: "System" },
  { href: "/categories", label: "Categories", icon: Tags },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const setCollapsed = useUIStore((s) => s.setSidebarCollapsed);

  return (
    <aside
      className={cn(
        "glass-panel hidden h-screen shrink-0 flex-col border-r border-border md:flex",
        collapsed ? "w-[72px]" : "w-[260px]",
      )}
    >
      <div className="flex h-16 items-center justify-between border-b border-border/60 px-4">
        {!collapsed && (
          <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground shadow-xs">
              V
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight">Viswallet</p>
              <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Finance OS
              </p>
            </div>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 text-muted-foreground"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <PanelLeft size={18} />
        </Button>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {NAV.map((item, i) =>
          "section" in item ? (
            !collapsed && (
              <p
                key={i}
                className="px-3 pb-1.5 pt-5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/80 first:pt-2"
              >
                {item.section}
              </p>
            )
          ) : (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-200",
                pathname === item.href
                  ? "bg-primary-muted text-primary"
                  : "text-muted-foreground hover:bg-surface-hover hover:text-foreground",
                collapsed && "justify-center px-0",
              )}
            >
              {pathname === item.href && (
                <span className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-r-full bg-primary" />
              )}
              <item.icon
                size={18}
                strokeWidth={pathname === item.href ? 2.25 : 1.75}
                className={cn(
                  "shrink-0 transition-colors",
                  pathname === item.href ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                )}
              />
              {!collapsed && item.label}
            </Link>
          ),
        )}
      </nav>
      {!collapsed && (
        <div className="border-t border-border/60 p-4">
          <LegalFooter />
        </div>
      )}
    </aside>
  );
}

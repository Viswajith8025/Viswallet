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
import { LogoMark } from "@/components/brand/logo-mark";
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
        "glass-panel hidden h-full shrink-0 flex-col border-r border-border md:flex",
        collapsed ? "w-[68px]" : "w-[248px]",
      )}
    >
      <div
        className={cn(
          "relative flex border-b border-border/60 px-3",
          collapsed ? "h-[4.25rem] flex-col items-center justify-center gap-0.5 py-2" : "h-14 items-center justify-between",
        )}
      >
        {collapsed ? (
          <Link href="/" className="transition-opacity hover:opacity-80" aria-label="Viswallet home">
            <LogoMark size={28} />
          </Link>
        ) : (
          <Link href="/" className="flex min-w-0 items-center gap-2.5 px-1 transition-opacity hover:opacity-80">
            <LogoMark size={30} />
            <p className="truncate font-display text-[15px] font-semibold tracking-[-0.035em]">
              Viswallet
            </p>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 text-muted-foreground"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <PanelLeft size={17} />
        </Button>
      </div>

      <nav className="scroll-premium flex-1 overflow-y-auto p-2">
        {NAV.map((item, i) =>
          "section" in item ? (
            !collapsed && (
              <p
                key={i}
                className="px-3 pb-1 pt-4 text-[11px] font-medium text-muted-foreground/70 first:pt-2"
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
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] transition-colors duration-150",
                pathname === item.href
                  ? "bg-foreground/[0.06] font-medium text-foreground"
                  : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground",
                collapsed && "justify-center px-0",
              )}
            >
              <item.icon
                size={17}
                strokeWidth={pathname === item.href ? 2 : 1.75}
                className="shrink-0"
              />
              {!collapsed && item.label}
            </Link>
          ),
        )}
      </nav>
      {!collapsed && (
        <div className="border-t border-border/60 p-3">
          <LegalFooter />
        </div>
      )}
    </aside>
  );
}

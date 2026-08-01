import type { LucideIcon } from "lucide-react";
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
  FileText,
  LineChart,
  Landmark,
  Award,
  StickyNote,
  Calculator,
} from "lucide-react";

export type NavLink = { href: string; label: string; icon: LucideIcon };
export type NavSection = { section: string };
export type NavEntry = NavLink | NavSection;

export const APP_NAV: NavEntry[] = [
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

/** Bottom tab routes — everything else lives in the More menu on mobile. */
export const MOBILE_TAB_HREFS = ["/", "/transactions", "/budgets"] as const;

export function isMobileMoreRoute(pathname: string): boolean {
  if (MOBILE_TAB_HREFS.includes(pathname as typeof MOBILE_TAB_HREFS[number])) return false;
  return true;
}

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
  Info,
  Tags,
  Search,
  Bell,
  User,
  Users,
  CircleUser,
  Settings,
  FileText,
  LineChart,
  Award,
  StickyNote,
  Calculator,
  Landmark,
} from "lucide-react";

export type NavLink = { href: string; label: string; icon: LucideIcon };
export type NavSection = { section: string };
export type NavEntry = NavLink | NavSection;

export const MONEY_TABS: NavLink[] = [
  { href: "/transactions", label: "All", icon: ArrowLeftRight },
  { href: "/bills", label: "Bills", icon: Receipt },
  { href: "/subscriptions", label: "Subscriptions", icon: Repeat },
  { href: "/emi", label: "EMI", icon: CreditCard },
  { href: "/income", label: "Income", icon: IndianRupee },
];

export const CREW_TABS: NavLink[] = [
  { href: "/crew", label: "Friends", icon: Users },
  { href: "/crew?tab=lent", label: "Lent", icon: HandCoins },
  { href: "/crew?tab=borrowed", label: "Borrowed", icon: ArrowDownLeft },
];

export const YOU_LINKS: NavLink[] = [
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/wishlist", label: "Wishlist", icon: Heart },
  { href: "/investments", label: "Investments", icon: TrendingUp },
  { href: "/net-worth", label: "Net worth", icon: Wallet },
  { href: "/achievements", label: "Achievements", icon: Award },
  { href: "/notes", label: "Notes", icon: StickyNote },
  { href: "/salary", label: "Salary", icon: Landmark },
  { href: "/accounts", label: "Wallets", icon: Wallet },
  { href: "/categories", label: "Categories", icon: Tags },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/search", label: "Search", icon: Search },
  { href: "/about", label: "About", icon: Info },
];

export const TOOLS: NavLink[] = [
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/insights", label: "Insights", icon: Sparkles },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/forecast", label: "Forecast", icon: LineChart },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/debt-planner", label: "Debt planner", icon: Calculator },
  { href: "/budgets", label: "Budgets", icon: PiggyBank },
];

export const APP_NAV: NavEntry[] = [
  { section: "Home" },
  { href: "/", label: "Home", icon: LayoutDashboard },
  { section: "Money" },
  ...MONEY_TABS,
  { section: "Crew" },
  ...CREW_TABS,
  { section: "You" },
  { href: "/you", label: "You", icon: CircleUser },
  ...YOU_LINKS,
  { section: "Tools" },
  ...TOOLS,
];

export const MOBILE_TABS = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/transactions", label: "Money", icon: ArrowLeftRight },
  { href: "/crew", label: "Crew", icon: Users },
  { href: "/you", label: "You", icon: CircleUser },
] as const;

const MONEY_HREFS = new Set(MONEY_TABS.map((tab) => tab.href));
const YOU_HREFS = new Set(["/you", ...YOU_LINKS.map((link) => link.href)]);

export function isMoneyRoute(pathname: string): boolean {
  return MONEY_HREFS.has(pathname);
}

export function isCrewRoute(pathname: string): boolean {
  return pathname === "/crew" || pathname === "/lent" || pathname === "/borrowed";
}

export function isYouRoute(pathname: string): boolean {
  return YOU_HREFS.has(pathname);
}

export function navHrefActive(href: string, pathname: string, tab: string | null): boolean {
  const [path, query] = href.split("?");
  if (pathname !== path && !(path === "/crew" && (pathname === "/lent" || pathname === "/borrowed"))) {
    return false;
  }
  if (path === "/crew" && (pathname === "/lent" || pathname === "/borrowed")) {
    const wanted = new URLSearchParams(query ?? "").get("tab");
    if (pathname === "/lent") return wanted === "lent";
    if (pathname === "/borrowed") return wanted === "borrowed";
  }
  if (!query) {
    if (path === "/crew") return !tab || tab === "friends";
    return pathname === path;
  }
  const wanted = new URLSearchParams(query).get("tab");
  return tab === wanted;
}

export function mobileTabActive(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/";
  if (href === "/transactions") return isMoneyRoute(pathname);
  if (href === "/crew") return isCrewRoute(pathname);
  if (href === "/you") return isYouRoute(pathname);
  return pathname === href;
}

/** Lateral hub and tab moves crossfade. Drilling into a page slides. */
export function transitionFor(href: string): "nav-tab" | "nav-forward" {
  const path = href.split("?")[0] ?? href;
  if (path === "/" || path === "/you" || path === "/crew" || MONEY_HREFS.has(path)) return "nav-tab";
  return "nav-forward";
}

const PAGE_META: Record<string, { title: string; group: string }> = {
  "/": { title: "Home", group: "Home" },
  "/transactions": { title: "All", group: "Money" },
  "/bills": { title: "Bills", group: "Money" },
  "/subscriptions": { title: "Subscriptions", group: "Money" },
  "/emi": { title: "EMI", group: "Money" },
  "/income": { title: "Income", group: "Money" },
  "/salary": { title: "Salary", group: "You" },
  "/crew": { title: "Crew", group: "Crew" },
  "/you": { title: "You", group: "You" },
  "/goals": { title: "Goals", group: "You" },
  "/wishlist": { title: "Wishlist", group: "You" },
  "/investments": { title: "Investments", group: "You" },
  "/net-worth": { title: "Net worth", group: "You" },
  "/achievements": { title: "Achievements", group: "You" },
  "/notes": { title: "Notes", group: "You" },
  "/accounts": { title: "Wallets", group: "You" },
  "/categories": { title: "Categories", group: "You" },
  "/notifications": { title: "Notifications", group: "You" },
  "/profile": { title: "Profile", group: "You" },
  "/settings": { title: "Settings", group: "You" },
  "/search": { title: "Search", group: "You" },
  "/about": { title: "About", group: "You" },
  "/analytics": { title: "Analytics", group: "Tools" },
  "/insights": { title: "Insights", group: "Tools" },
  "/reports": { title: "Reports", group: "Tools" },
  "/forecast": { title: "Forecast", group: "Tools" },
  "/calendar": { title: "Calendar", group: "Tools" },
  "/debt-planner": { title: "Debt planner", group: "Tools" },
  "/budgets": { title: "Budgets", group: "Tools" },
  "/privacy": { title: "Privacy", group: "You" },
  "/terms": { title: "Terms", group: "You" },
  "/licenses": { title: "Licenses", group: "You" },
};

export function pageMeta(pathname: string, tab: string | null): { title: string; group: string } {
  if (pathname === "/crew") {
    if (tab === "lent") return { title: "Lent", group: "Crew" };
    if (tab === "borrowed") return { title: "Borrowed", group: "Crew" };
    return { title: "Friends", group: "Crew" };
  }
  return PAGE_META[pathname] ?? { title: "visWALLET", group: "Home" };
}

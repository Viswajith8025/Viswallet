"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/design/cn";

const TABS = [
  { href: "/transactions", label: "All" },
  { href: "/bills", label: "Bills" },
  { href: "/subscriptions", label: "Subscriptions" },
  { href: "/emi", label: "EMI" },
  { href: "/income", label: "Income" },
] as const;

export function MoneyTabs() {
  const pathname = usePathname();
  return (
    <nav aria-label="Money" className="sticky top-0 z-20 -mx-4 overflow-x-auto bg-bg px-4 py-2 lg:-mx-8 lg:px-8">
      <ul className="flex w-max gap-2">
        {TABS.map((tab) => {
          const active = pathname === tab.href || (tab.href === "/income" && pathname === "/salary");
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex h-11 items-center rounded-full px-4 font-mono text-[11px] uppercase tracking-[0.12em]",
                  active ? "bg-lime text-[#0D0D0B]" : "border border-hairline text-ink-2",
                )}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

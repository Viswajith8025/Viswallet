"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Plus, ArrowDownLeft, ArrowUpRight, Users } from "lucide-react";
import { LayoutGroup, motion } from "motion/react";
import { cn } from "@/lib/design/cn";
import { useUIStore } from "@/lib/store/ui-store";
import { MOBILE_TABS, mobileTabActive } from "@/lib/navigation/app-nav";
import { NavLink } from "@/components/shell/nav-link";
import { usePressFeedback } from "@/hooks/use-press-feedback";

const SHORTCUTS = [
  { id: "spent", label: "Spent", icon: ArrowUpRight, kind: "expense" as const },
  { id: "earned", label: "Earned", icon: ArrowDownLeft, kind: "income" as const },
  { id: "split", label: "Split with crew", icon: Users, href: "/crew?tab=friends" },
];

export function MobileNav() {
  const pathname = usePathname();
  const setQuickAddOpen = useUIStore((s) => s.setQuickAddOpen);
  const press = usePressFeedback();
  const [radial, setRadial] = useState(false);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPress = useRef(false);
  const skipClick = useRef(false);
  const startPoint = useRef<{ x: number; y: number } | null>(null);

  function clearHold() {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  }

  useEffect(() => {
    if (!radial) return;
    function onPointerDown(event: PointerEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.closest("[data-add-radial]")) return;
      setRadial(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [radial]);

  function onPointerDown(event: React.PointerEvent) {
    longPress.current = false;
    startPoint.current = { x: event.clientX, y: event.clientY };
    clearHold();
    holdTimer.current = setTimeout(() => {
      longPress.current = true;
      skipClick.current = true;
      setRadial(true);
    }, 450);
  }

  function onPointerMove(event: React.PointerEvent) {
    const start = startPoint.current;
    if (!start) return;
    if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > 10) clearHold();
  }

  function onPointerUp() {
    clearHold();
    startPoint.current = null;
  }

  function onClick() {
    if (skipClick.current) {
      skipClick.current = false;
      return;
    }
    setRadial(false);
    setQuickAddOpen(true, "expense");
  }

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 overflow-visible select-none lg:hidden"
      style={{ viewTransitionName: "mobile-nav" }}
      aria-label="Main navigation"
      data-shell-nav
    >
      {radial && (
        <div
          data-add-radial
          className="pointer-events-none absolute bottom-[calc(64px+env(safe-area-inset-bottom)+12px)] left-1/2 h-28 w-64 -translate-x-1/2"
        >
          {SHORTCUTS.map((item, index) => {
            const place = ["left-[0%] top-[42%]", "left-1/2 top-0 -translate-x-1/2", "right-0 top-[42%]"][index];
            const className = cn(
              "pointer-events-auto absolute flex h-11 min-w-11 items-center gap-1.5 rounded-full border border-hairline bg-raised px-3 text-[11px] font-mono text-ink shadow-[0_8px_24px_rgba(0,0,0,0.28)]",
              press.className,
              place,
            );
            if ("href" in item && item.href) {
              return (
                <NavLink
                  key={item.id}
                  href={item.href}
                  motion="nav-tab"
                  className={className}
                  onClick={() => setRadial(false)}
                >
                  <item.icon size={14} />
                  {item.label}
                </NavLink>
              );
            }
            return (
              <button
                key={item.id}
                type="button"
                className={className}
                onClick={() => {
                  setRadial(false);
                  setQuickAddOpen(true, item.kind);
                }}
              >
                <item.icon size={14} />
                {item.label}
              </button>
            );
          })}
        </div>
      )}

      <div className="overflow-visible border-t border-hairline bg-sunken pb-[env(safe-area-inset-bottom)]">
        <LayoutGroup>
          <div className="mx-auto grid h-16 max-w-lg grid-cols-5 items-end overflow-visible">
            {MOBILE_TABS.slice(0, 2).map((tab) => (
              <TabLink key={tab.href} href={tab.href} label={tab.label} icon={tab.icon} active={mobileTabActive(tab.href, pathname)} />
            ))}
            <div className="relative flex h-16 items-end justify-center overflow-visible">
              <button
                type="button"
                data-add-radial
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                onClick={onClick}
                className={cn(
                  "absolute bottom-3 left-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-[35%] items-center justify-center rounded-full bg-lime text-[#0D0D0B] ring-2 ring-bg",
                  press.className,
                )}
                aria-label="Add. Hold for Spent, Earned, or Split with crew."
                aria-expanded={radial}
              >
                <Plus size={26} strokeWidth={2.4} />
              </button>
            </div>
            {MOBILE_TABS.slice(2).map((tab) => (
              <TabLink key={tab.href} href={tab.href} label={tab.label} icon={tab.icon} active={mobileTabActive(tab.href, pathname)} />
            ))}
          </div>
        </LayoutGroup>
      </div>
    </nav>
  );
}

function TabLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: typeof MOBILE_TABS[number]["icon"];
  active: boolean;
}) {
  return (
    <NavLink
      href={href}
      motion="nav-tab"
      className={cn(
        "flex h-16 flex-col items-center justify-center gap-1 font-mono text-[11px]",
        active ? "text-ink" : "text-ink-2",
      )}
    >
      <Icon size={22} strokeWidth={active ? 2.1 : 1.75} />
      <span className="relative">
        {label}
        {active && (
          <motion.span
            layoutId="tab-dot"
            className="absolute -bottom-1.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-lime"
            transition={{ type: "spring", stiffness: 420, damping: 38 }}
          />
        )}
      </span>
    </NavLink>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, X } from "lucide-react";
import { Sheet } from "@/components/ui/dialog";
import { cn } from "@/lib/design/cn";
import { APP_NAV } from "@/lib/navigation/app-nav";
import { useUIStore } from "@/lib/store/ui-store";
import { useDb } from "@/components/providers/db-provider";
import { useAuth } from "@/components/providers/auth-provider";
import { getProfile } from "@/lib/db";
import { ProfileAvatar } from "@/components/profile/profile-avatar";

export function MobileMoreSheet() {
  const pathname = usePathname();
  const open = useUIStore((s) => s.mobileMenuOpen);
  const setOpen = useUIStore((s) => s.setMobileMenuOpen);
  const setCommandOpen = useUIStore((s) => s.setCommandOpen);
  const { user } = useAuth();
  const { version } = useDb();
  const [displayName, setDisplayName] = useState("You");
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>();

  useEffect(() => {
    if (open) {
      getProfile()
        .then((p) => {
          setDisplayName(p.displayName || "You");
          setAvatarUrl(p.avatarUrl);
        })
        .catch(() => setDisplayName("You"));
    }
  }, [open, version]);

  useEffect(() => {
    setOpen(false);
  }, [pathname, setOpen]);

  return (
    <Sheet open={open} onClose={() => setOpen(false)} labelledBy="mobile-more-title">
      <div className="flex max-h-[min(88vh,720px)] flex-col pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-1">
          <h2 id="mobile-more-title" className="font-display text-lg font-semibold tracking-tight">
            More
          </h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <Link
          href="/profile"
          prefetch={false}
          className="mx-4 mb-3 flex items-center gap-3 rounded-xl bg-muted/30 px-4 py-3 transition-colors hover:bg-muted/50"
        >
          <ProfileAvatar displayName={displayName} avatarUrl={avatarUrl} size="md" />
          <div className="min-w-0">
            <p className="truncate font-medium">{displayName}</p>
            <p className="truncate text-sm text-muted-foreground">
              {user?.email ?? "View profile & account"}
            </p>
          </div>
        </Link>

        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setCommandOpen(true);
          }}
          className="mx-4 mb-4 flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <Search size={16} className="shrink-0 opacity-70" />
          <span>Search pages</span>
        </button>

        <nav
          className="scroll-premium flex-1 overflow-y-auto px-3 pb-4"
          aria-label="All sections"
        >
          {APP_NAV.map((item, i) =>
            "section" in item ? (
              <p
                key={i}
                className="px-3 pb-1 pt-4 text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70 first:pt-0"
              >
                {item.section}
              </p>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] transition-colors",
                  pathname === item.href
                    ? "bg-foreground/[0.06] font-medium text-foreground"
                    : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground",
                )}
              >
                <item.icon size={18} strokeWidth={pathname === item.href ? 2.25 : 1.75} />
                {item.label}
              </Link>
            ),
          )}
        </nav>
      </div>
    </Sheet>
  );
}

"use client";

import { YOU_LINKS, TOOLS } from "@/lib/navigation/app-nav";
import { NavLink } from "@/components/shell/nav-link";

function LinkList({ title, links }: { title: string; links: typeof YOU_LINKS }) {
  return (
    <section>
      <h2 className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-2">{title}</h2>
      <ul className="mt-2 border-y border-hairline">
        {links.map((link) => (
          <li key={link.href} className="border-b border-hairline last:border-b-0">
            <NavLink href={link.href} className="flex min-h-11 items-center gap-3 py-2 text-ink active:scale-[0.97]">
              <link.icon size={18} strokeWidth={1.75} className="text-ink-2" />
              {link.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function YouPage() {
  return (
    <div className="mx-auto max-w-lg space-y-8">
      <h1 className="hidden font-display text-[28px] font-semibold text-ink lg:block">You</h1>
      <LinkList title="Yours" links={YOU_LINKS} />
      <LinkList title="Tools" links={TOOLS} />
    </div>
  );
}

import { BrandLockup } from "@/components/brand/brand-lockup";
import { BRAND_NAME } from "@/lib/brand/constants";
import { cn } from "@/lib/design/cn";

const DEFAULT_FEATURES = [
  { n: "01", title: "Start in seconds", body: "Set up your budget and track spending right away." },
  { n: "02", title: "Salary-aware cycles", body: "Budgets follow when you get paid — not calendar months." },
  { n: "03", title: "Private by design", body: "Your finances stay yours. Export or delete anytime." },
] as const;

type AuthShellProps = {
  children: React.ReactNode;
  headline?: string;
  subcopy?: string;
  features?: readonly { n: string; title: string; body: string }[];
  className?: string;
};

export function AuthShell({
  children,
  headline = "Finance that stays yours.",
  subcopy = "A private ledger for everyday spending — built to feel calm, not cluttered.",
  features = DEFAULT_FEATURES,
  className,
}: AuthShellProps) {
  return (
    <div className={cn("min-h-[100dvh] min-h-screen bg-background lg:flex", className)}>
      <aside
        className="brand-panel relative hidden w-[44%] shrink-0 flex-col justify-between overflow-hidden bg-[var(--violet-deep)] p-10 text-[var(--cream)] lg:sticky lg:top-0 lg:flex lg:h-auto lg:min-h-[100dvh] xl:p-14"
      >
        <div className="brand-panel-grid pointer-events-none absolute inset-0 opacity-100" aria-hidden />
        <div className="relative">
          <BrandLockup inverted showTagline markSize={44} />
        </div>

        <div className="relative max-w-md space-y-10">
          <div>
            <p className="text-[11px] font-medium tracking-[0.12em] text-[var(--cream)]/40">
              {BRAND_NAME}
            </p>
            <h1 className="mt-4 font-display text-[2rem] font-semibold leading-[1.15] tracking-[-0.03em] xl:text-[2.35rem]">
              {headline}
            </h1>
            <p className="mt-4 text-[15px] leading-relaxed text-[var(--cream)]/62">{subcopy}</p>
          </div>

          {features.length > 0 && (
            <ul className="space-y-6 border-t border-[var(--cream)]/10 pt-8">
              {features.map((item) => (
                <li key={item.n} className="flex gap-4">
                  <span className="mt-0.5 font-mono text-[11px] tabular-nums text-[var(--cream)]/35">
                    {item.n}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-[var(--cream)]/92">{item.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-[var(--cream)]/50">{item.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      <main className="flex flex-1 flex-col px-6 py-10 sm:px-10 lg:justify-center lg:px-14 xl:px-20">
        <div className="mx-auto w-full max-w-[420px]">
          <div className="mb-12 flex flex-col items-center text-center lg:hidden">
            <BrandLockup showTagline markSize={56} layout="vertical" />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}

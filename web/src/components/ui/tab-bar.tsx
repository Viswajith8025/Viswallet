import { cn } from "@/lib/design/cn";

export type TabBarOption<T extends string> = {
  value: T;
  label: string;
};

export function TabBar<T extends string>({
  options,
  value,
  onChange,
  className,
  "aria-label": ariaLabel,
}: {
  options: TabBarOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <div
      className={cn("flex gap-6 border-b border-border/60", className)}
      role="tablist"
      aria-label={ariaLabel}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "relative -mb-px pb-2.5 text-sm font-medium transition-colors",
              active ? "text-foreground" : "text-muted-foreground hover:text-foreground/80",
            )}
          >
            {opt.label}
            {active && (
              <span
                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-primary"
                aria-hidden
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

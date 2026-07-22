import { cn } from "@/lib/design/cn";
import { segmentedControlVariants } from "@/lib/design/variants";

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
};

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
  "aria-label": ariaLabel,
  fullWidth,
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  "aria-label"?: string;
  fullWidth?: boolean;
}) {
  return (
    <div
      className={cn(segmentedControlVariants.root, fullWidth && "w-full", className)}
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
              segmentedControlVariants.item,
              fullWidth && "flex-1",
              active && segmentedControlVariants.itemActive,
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

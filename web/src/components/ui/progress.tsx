import { cn } from "@/lib/design/cn";
import { progressVariants } from "@/lib/design/variants";

export function Progress({
  value,
  max = 100,
  className,
  color,
  overColor = "var(--destructive)",
  size = "lg",
  label,
}: {
  value: number;
  max?: number;
  className?: string;
  color?: string;
  overColor?: string;
  size?: keyof typeof progressVariants.size;
  label?: string;
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const over = value > max;

  return (
    <div className={className}>
      {label && <p className="mb-1.5 text-caption text-muted-foreground">{label}</p>}
      <div className={cn(progressVariants.track, progressVariants.size[size])}>
        <div
          className={progressVariants.fill}
          style={{
            width: `${pct}%`,
            backgroundColor: over ? overColor : color ?? "var(--primary)",
          }}
          role="progressbar"
          aria-valuenow={Math.round(value)}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={label}
        />
      </div>
    </div>
  );
}

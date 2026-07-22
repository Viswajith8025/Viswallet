import { cn } from "@/lib/design/cn";
import { focusRing, interactiveTransition } from "@/lib/design/variants";

export function Checkbox({
  className,
  label,
  hint,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label?: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className={cn("flex cursor-pointer items-start gap-2.5 text-sm", className)}>
      <input
        type="checkbox"
        className={cn(
          "mt-0.5 h-4 w-4 shrink-0 rounded border-input accent-primary",
          interactiveTransition,
          focusRing,
        )}
        {...props}
      />
      <span className="space-y-0.5">
        {label && <span className="text-label text-foreground">{label}</span>}
        {hint && <span className="block text-caption text-muted-foreground">{hint}</span>}
      </span>
    </label>
  );
}

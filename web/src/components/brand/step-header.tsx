import { cn } from "@/lib/design/cn";

type StepHeaderProps = {
  step: number;
  total: number;
  title: string;
  description?: string;
  className?: string;
};

export function StepHeader({ step, total, title, description, className }: StepHeaderProps) {
  const stepLabel = String(step + 1).padStart(2, "0");
  const totalLabel = String(total).padStart(2, "0");

  return (
    <header className={cn("mb-8", className)}>
      <p className="font-mono text-[11px] tabular-nums tracking-[0.12em] text-muted-foreground">
        Step {stepLabel}
        <span className="text-muted-foreground/40"> / {totalLabel}</span>
      </p>
      <h1 className="mt-3 font-display text-[1.65rem] font-semibold tracking-[-0.03em] text-foreground">
        {title}
      </h1>
      {description && (
        <p className="mt-2 max-w-sm text-[15px] leading-relaxed text-muted-foreground">{description}</p>
      )}
      <div className="mt-6 h-px bg-border" />
    </header>
  );
}

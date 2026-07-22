import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/design/cn";
import { fieldVariants } from "@/lib/design/variants";
import { Icon } from "@/components/ui/icon";

export function FieldLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn(fieldVariants.label, "text-foreground/80", className)}>{children}</span>;
}

export function FieldHint({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn(fieldVariants.hint, className)}>{children}</span>;
}

export function FieldError({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn(fieldVariants.error, className)} role="alert">{children}</span>;
}

export function Input({
  className,
  label,
  hint,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
}) {
  return (
    <label className="block space-y-2">
      {label && <FieldLabel>{label}</FieldLabel>}
      <input
        className={cn(fieldVariants.input, "h-10", error && fieldVariants.inputError, className)}
        {...props}
      />
      {hint && !error && <FieldHint>{hint}</FieldHint>}
      {error && <FieldError>{error}</FieldError>}
    </label>
  );
}

export function Select({
  className,
  label,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return (
    <label className="block space-y-2">
      {label && <FieldLabel>{label}</FieldLabel>}
      <div className="relative">
        <select className={cn(fieldVariants.input, "h-10 appearance-none pr-10", className)} {...props}>
          {children}
        </select>
        <Icon
          icon={ChevronDown}
          size="sm"
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
      </div>
    </label>
  );
}

export function Textarea({
  className,
  label,
  hint,
  error,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  hint?: string;
  error?: string;
}) {
  return (
    <label className="block space-y-2">
      {label && <FieldLabel>{label}</FieldLabel>}
      <textarea
        className={cn(fieldVariants.input, "min-h-24 resize-y py-2.5", error && fieldVariants.inputError, className)}
        {...props}
      />
      {hint && !error && <FieldHint>{hint}</FieldHint>}
      {error && <FieldError>{error}</FieldError>}
    </label>
  );
}

"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/design/cn";
import { fieldVariants } from "@/lib/design/variants";
import { SelectMenu } from "@/components/ui/select-menu";

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

export function PasswordInput({
  className,
  label,
  hint,
  error,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label?: string;
  hint?: string;
  error?: string;
}) {
  const [show, setShow] = useState(false);

  return (
    <label className="block space-y-2">
      {label && <FieldLabel>{label}</FieldLabel>}
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          className={cn(
            fieldVariants.input,
            "h-10 pr-10",
            error && fieldVariants.inputError,
            className,
          )}
          {...props}
        />
        <button
          type="button"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? "Hide password" : "Show password"}
          tabIndex={-1}
        >
          {show ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
        </button>
      </div>
      {hint && !error && <FieldHint>{hint}</FieldHint>}
      {error && <FieldError>{error}</FieldError>}
    </label>
  );
}

export function Select({
  className,
  label,
  children,
  tone = "default",
  value,
  defaultValue,
  onChange,
  onBlur,
  name,
  id,
  disabled,
  required,
  "aria-label": ariaLabel,
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  tone?: "default" | "filter";
}) {
  return (
    <label className={cn("block space-y-2", tone === "filter" && "inline-block space-y-0")}>
      {label && <FieldLabel>{label}</FieldLabel>}
      <SelectMenu
        className={className}
        tone={tone}
        value={Array.isArray(value) ? value[0] : value}
        defaultValue={Array.isArray(defaultValue) ? defaultValue[0] : defaultValue}
        onChange={onChange}
        onBlur={onBlur}
        name={name}
        id={id}
        disabled={disabled}
        required={required}
        aria-label={ariaLabel}
      >
        {children}
      </SelectMenu>
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
        className={cn(fieldVariants.input, "scroll-premium min-h-24 resize-y py-2.5", error && fieldVariants.inputError, className)}
        {...props}
      />
      {hint && !error && <FieldHint>{hint}</FieldHint>}
      {error && <FieldError>{error}</FieldError>}
    </label>
  );
}

import { cn } from "@/lib/design/cn";
import { buttonVariants } from "@/lib/design/variants";
import { tapFeedback } from "@/lib/ux/feedback";

export function Button({
  className,
  variant = "primary",
  size = "md",
  onClick,
  disabled,
  ref,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof buttonVariants.variant;
  size?: keyof typeof buttonVariants.size;
  ref?: React.Ref<HTMLButtonElement>;
}) {
  return (
    <button
      className={cn(
        buttonVariants.base,
        buttonVariants.variant[variant],
        buttonVariants.size[size],
        className,
      )}
      disabled={disabled}
      onClick={(e) => {
        if (!disabled) tapFeedback();
        onClick?.(e);
      }}
      {...props}
      ref={ref}
    />
  );
}

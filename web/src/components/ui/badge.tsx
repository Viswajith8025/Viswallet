import { cn } from "@/lib/design/cn";
import { badgeVariants } from "@/lib/design/variants";

export function Badge({
  className,
  variant = "default",
  children,
}: {
  className?: string;
  variant?: keyof typeof badgeVariants.variant;
  children: React.ReactNode;
}) {
  return (
    <span className={cn(badgeVariants.base, badgeVariants.variant[variant], className)}>
      {children}
    </span>
  );
}

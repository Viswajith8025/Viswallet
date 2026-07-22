import { Info } from "lucide-react";
import { cn } from "@/lib/design/cn";
import { hintVariants } from "@/lib/design/variants";
import { Icon } from "@/components/ui/icon";

export function Hint({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={cn(hintVariants.root, className)}>
      <Icon icon={Info} size="xs" className="mt-0.5 text-primary" aria-hidden />
      <span>{children}</span>
    </p>
  );
}

/** @deprecated Use `Hint` from `@/components/ui/hint` */
export const ContextualHint = Hint;

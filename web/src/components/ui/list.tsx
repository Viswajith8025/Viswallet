import { cn } from "@/lib/design/cn";
import { listVariants } from "@/lib/design/variants";

export function DataList({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLUListElement>) {
  return (
    <ul className={cn(listVariants.root, className)} {...props}>
      {children}
    </ul>
  );
}

export function DataListItem({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLLIElement>) {
  return (
    <li className={cn(listVariants.item, className)} {...props}>
      {children}
    </li>
  );
}

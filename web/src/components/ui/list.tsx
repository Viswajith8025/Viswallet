import { cn } from "@/lib/design/cn";
import { listVariants } from "@/lib/design/variants";

export function DataList({
  className,
  children,
  inset = false,
  ...props
}: React.HTMLAttributes<HTMLUListElement> & { inset?: boolean }) {
  return (
    <ul
      className={cn(inset ? listVariants.inset : listVariants.root, className)}
      {...props}
    >
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

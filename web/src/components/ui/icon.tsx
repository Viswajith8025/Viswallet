import type { LucideIcon } from "lucide-react";
import { iconSize, type IconSize } from "@/lib/design/tokens";
import { cn } from "@/lib/design/cn";

export function Icon({
  icon: IconComponent,
  size = "sm",
  className,
  ...props
}: {
  icon: LucideIcon;
  size?: IconSize | number;
  className?: string;
} & Omit<React.SVGAttributes<SVGSVGElement>, "size">) {
  const px = typeof size === "number" ? size : iconSize[size];
  return <IconComponent size={px} className={cn("shrink-0", className)} {...props} />;
}

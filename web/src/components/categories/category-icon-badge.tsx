"use client";

import { createElement } from "react";
import { cn } from "@/lib/design/cn";
import { getCategoryLucideIcon } from "@/lib/category-icons";
import type { Category } from "@/lib/db/types";

type CategoryIconBadgeProps = {
  category?: Pick<Category, "iconName" | "color" | "name"> | null;
  iconName?: string;
  color?: string;
  size?: "sm" | "md" | "lg" | "grid";
  className?: string;
};

const sizeClasses = {
  sm: "h-8 w-8 [&_svg]:h-3.5 [&_svg]:w-3.5",
  md: "h-10 w-10 [&_svg]:h-4 [&_svg]:w-4",
  lg: "h-12 w-12 [&_svg]:h-5 [&_svg]:w-5",
  grid: "h-14 w-14 rounded-full [&_svg]:h-6 [&_svg]:w-6",
} as const;

export function CategoryIconBadge({
  category,
  iconName,
  color,
  size = "md",
  className,
}: CategoryIconBadgeProps) {
  const resolvedIcon = iconName ?? category?.iconName ?? "circle-dot";
  const resolvedColor = color ?? category?.color ?? "var(--primary)";
  const isGrid = size === "grid";

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center",
        isGrid
          ? "rounded-full bg-muted/90 text-foreground"
          : "rounded-xl text-primary-foreground shadow-sm",
        sizeClasses[size],
        className,
      )}
      style={isGrid ? undefined : { background: resolvedColor }}
      aria-hidden
    >
      {createElement(getCategoryLucideIcon(resolvedIcon), {
        strokeWidth: isGrid ? 1.75 : 2.25,
        ...(isGrid ? { className: "text-foreground/85" } : {}),
      })}
    </span>
  );
}

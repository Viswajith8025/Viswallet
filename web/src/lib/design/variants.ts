import { cn } from "./cn";

/** Shared transition for interactive elements */
export const interactiveTransition =
  "transition-all duration-[var(--duration-normal)] ease-[var(--ease-out-expo)]";

/** Focus ring — consistent across form controls & buttons */
export const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export const buttonVariants = {
  base: cn(
    "inline-flex items-center justify-center gap-2 rounded-xl font-medium",
    interactiveTransition,
    focusRing,
    "disabled:pointer-events-none disabled:opacity-45",
    "active:scale-[0.97]",
  ),
  variant: {
    primary: "bg-primary text-primary-foreground shadow-soft hover:brightness-110 hover:shadow-elevated",
    secondary: "bg-secondary text-secondary-foreground hover:bg-accent hover:shadow-xs",
    ghost: "text-muted-foreground hover:bg-accent/80 hover:text-foreground",
    outline: "border border-border bg-card/80 hover:border-border-strong hover:bg-accent/50 hover:shadow-xs",
    destructive: "bg-destructive text-destructive-foreground shadow-soft hover:brightness-110",
  },
  size: {
    sm: "h-8 px-3 text-xs rounded-lg",
    md: "h-10 px-4 text-sm",
    lg: "h-11 px-5 text-sm",
    icon: "h-10 w-10 shrink-0",
  },
} as const;

export const badgeVariants = {
  base: "inline-flex items-center rounded-md px-2 py-0.5 text-caption font-semibold tracking-wide",
  variant: {
    default: "bg-secondary text-secondary-foreground",
    primary: "bg-primary-muted text-primary",
    success: "bg-success-muted text-success",
    warning: "bg-warning-muted text-warning",
    destructive: "bg-destructive-muted text-destructive",
    outline: "border border-border bg-transparent text-muted-foreground",
  },
} as const;

export const fieldVariants = {
  label: "text-label",
  hint: "text-caption text-muted-foreground",
  error: "text-caption font-medium text-destructive",
  input: cn(
    "flex w-full rounded-xl border border-input bg-card/90 px-3.5 text-sm shadow-xs",
    interactiveTransition,
    "placeholder:text-muted-foreground/60",
    "hover:border-border-strong",
    "focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/15",
  ),
  inputError: "border-destructive focus-visible:ring-destructive/15",
} as const;

export const cardVariants = {
  base: "surface-card overflow-hidden",
  interactive: "surface-interactive cursor-pointer",
  padding: {
    none: "",
    sm: "p-4",
    md: "p-5",
    lg: "p-6",
  },
} as const;

export const dialogVariants = {
  overlay: "absolute inset-0 bg-overlay backdrop-blur-[2px]",
  panel: cn(
    "relative z-10 w-full overflow-hidden border border-border bg-card shadow-glow",
    "rounded-t-3xl sm:rounded-2xl",
  ),
  panelCentered: "max-w-lg",
  panelSheet: "max-h-[90vh] overflow-y-auto sm:max-w-lg sm:mb-6",
  body: "p-6",
} as const;

export const progressVariants = {
  track: "overflow-hidden rounded-full bg-muted",
  fill: "h-full rounded-full transition-all duration-500 ease-[var(--ease-out-expo)]",
  size: {
    sm: "h-1.5",
    md: "h-2",
    lg: "h-2.5",
  },
} as const;

export const segmentedControlVariants = {
  root: "flex gap-1 rounded-xl bg-muted/50 p-1",
  item: cn(
    "rounded-lg px-4 py-2 text-sm font-medium capitalize transition-all duration-[var(--duration-fast)]",
    "text-muted-foreground hover:text-foreground",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
  ),
  itemActive: "bg-card text-foreground shadow-xs",
} as const;

export const tableVariants = {
  wrapper: "w-full overflow-x-auto",
  table: "w-full text-sm",
  head: "border-b border-border text-left",
  headCell: "px-4 py-3 text-caption font-semibold uppercase tracking-wider text-muted-foreground",
  body: "divide-y divide-border/60",
  row: "transition-colors hover:bg-muted/30",
  cell: "px-4 py-3.5 align-middle",
} as const;

export const listVariants = {
  root: "divide-y divide-border/60",
  item: "transition-colors hover:bg-muted/30",
} as const;

export const hintVariants = {
  root: "flex items-start gap-2 rounded-xl bg-muted/50 p-3 text-caption leading-relaxed text-muted-foreground",
} as const;

export const toastVariants = {
  base: cn(
    "pointer-events-auto flex max-w-sm items-center gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg backdrop-blur-md",
  ),
  tone: {
    default: "border-border bg-card/95",
    success: "border-success/30 bg-success-muted/95",
    warning: "border-warning/30 bg-warning-muted/95",
  },
} as const;

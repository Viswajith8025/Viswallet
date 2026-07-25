import { cn } from "./cn";

export const interactiveTransition =
  "transition-all duration-[var(--duration-normal)] ease-[var(--ease-out-expo)]";

export const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export const buttonVariants = {
  base: cn(
    "inline-flex items-center justify-center gap-2 rounded-md font-medium",
    interactiveTransition,
    focusRing,
    "disabled:pointer-events-none disabled:opacity-40",
  ),
  variant: {
    primary:
      "bg-primary text-primary-foreground hover:bg-[var(--primary-hover)]",
    secondary:
      "bg-surface-secondary text-secondary-foreground border border-border hover:bg-surface-hover",
    ghost: "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground",
    outline:
      "border border-border bg-transparent text-foreground hover:bg-foreground/[0.03]",
    destructive:
      "bg-destructive text-destructive-foreground shadow-xs hover:brightness-[1.03]",
  },
  size: {
    sm: "h-8 px-3 text-xs rounded-md",
    md: "h-9 px-4 text-sm",
    lg: "h-10 px-5 text-sm",
    icon: "h-10 w-10 shrink-0",
  },
} as const;

export const badgeVariants = {
  base: "inline-flex items-center rounded-md px-2 py-0.5 text-caption font-medium tracking-wide",
  variant: {
    default: "bg-surface-secondary text-secondary-foreground border border-border-light",
    primary: "bg-primary-muted text-primary",
    success: "bg-success-muted text-success",
    warning: "bg-warning-muted text-warning",
    destructive: "bg-destructive-muted text-destructive",
    outline: "border border-border bg-transparent text-muted-foreground",
  },
} as const;

export const fieldVariants = {
  label: "text-label font-medium text-foreground",
  hint: "text-caption text-muted-foreground",
  error: "text-caption font-medium text-destructive",
  input: cn(
    "flex w-full rounded-lg border border-border bg-background px-3.5 text-sm text-foreground shadow-xs",
    interactiveTransition,
    "placeholder:text-muted-foreground",
    "hover:border-border-strong",
    "focus-visible:border-primary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/12",
  ),
  inputError: "border-destructive focus-visible:ring-destructive/12",
} as const;

export const selectVariants = {
  trigger: cn(
    "flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-border bg-elevated/90 px-3.5 text-sm text-foreground shadow-xs",
    interactiveTransition,
    "hover:border-border-strong hover:bg-elevated",
    focusRing,
    "disabled:pointer-events-none disabled:opacity-40",
  ),
  triggerFilter: cn(
    "h-9 min-w-0 rounded-full border-border-light bg-background/80 px-3 text-xs font-medium text-foreground/90",
    "hover:bg-elevated hover:text-foreground",
    "shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]",
  ),
  triggerOpen: "border-primary/35 ring-[3px] ring-primary/10",
  menu: cn(
    "absolute left-0 top-[calc(100%+0.35rem)] z-50 max-h-60 min-w-full overflow-y-auto rounded-xl border border-border bg-elevated/98 p-1 shadow-lg backdrop-blur-md",
  ),
  item: cn(
    "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm text-foreground/90",
    interactiveTransition,
    "hover:bg-primary-muted/70 hover:text-foreground",
    "focus-visible:bg-primary-muted/70 focus-visible:outline-none",
    "disabled:pointer-events-none disabled:opacity-40",
  ),
  itemActive: "bg-primary-muted/55 font-medium text-foreground",
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
  overlay: "absolute inset-0 bg-overlay backdrop-blur-[3px]",
  panel: cn(
    "relative z-10 w-full overflow-hidden border border-border bg-elevated shadow-glow",
    "rounded-t-2xl sm:rounded-xl",
  ),
  panelCentered: "max-w-lg",
  panelSheet: "max-h-[90vh] overflow-y-auto sm:max-w-lg sm:mb-6",
  body: "p-6",
} as const;

export const progressVariants = {
  track: "overflow-hidden rounded-full bg-primary-muted/50",
  fill: "h-full rounded-full bg-primary transition-all duration-500 ease-[var(--ease-out-expo)]",
  size: {
    sm: "h-1",
    md: "h-1.5",
    lg: "h-2",
  },
} as const;

export const segmentedControlVariants = {
  root: "flex gap-0.5 rounded-lg border border-border-light bg-surface-secondary p-0.5",
  item: cn(
    "rounded-md px-3.5 py-1.5 text-sm font-medium capitalize transition-all duration-[var(--duration-fast)]",
    "text-muted-foreground hover:text-foreground",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
  ),
  itemActive: "bg-elevated text-primary shadow-xs border border-border-light",
} as const;

export const tableVariants = {
  wrapper: "w-full overflow-x-auto",
  table: "w-full text-sm",
  head: "border-b border-border text-left",
  headCell: "px-4 py-3 text-caption font-semibold uppercase tracking-wider text-muted-foreground",
  body: "divide-y divide-border-light",
  row: "transition-colors hover:bg-surface-hover/80",
  cell: "px-4 py-3.5 align-middle",
} as const;

export const listVariants = {
  root: "divide-y divide-border-light",
  item: "transition-colors hover:bg-surface-hover/60",
} as const;

export const hintVariants = {
  root: "flex items-start gap-2 rounded-lg border border-border-light bg-primary-muted/40 p-3 text-caption leading-relaxed text-muted-foreground",
} as const;

export const toastVariants = {
  base: cn(
    "pointer-events-auto flex max-w-sm items-center gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg backdrop-blur-md",
  ),
  tone: {
    default: "border-border bg-elevated/95",
    success: "border-success/25 bg-success-muted/95 text-success",
    warning: "border-warning/25 bg-warning-muted/95 text-warning",
    error: "border-destructive/25 bg-destructive/10 text-destructive",
  },
} as const;

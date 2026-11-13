import { cn } from "./cn";

export const interactiveTransition =
  "transition-[color,background-color,border-color,box-shadow,transform,opacity] duration-[var(--duration-normal)] ease-[var(--ease-out-expo)]";

export const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export const buttonVariants = {
  base: cn(
    "inline-flex items-center justify-center gap-2 rounded-lg font-medium",
    "select-none",
    interactiveTransition,
    focusRing,
    "disabled:pointer-events-none disabled:opacity-45",
  ),
  variant: {
    primary:
      "bg-lime text-[#0D0D0B] hover:brightness-105 active:scale-[0.97]",
    secondary:
      "border border-hairline bg-surface text-ink hover:border-hairline-strong active:scale-[0.97]",
    ghost: "bg-transparent text-ink-2 hover:bg-foreground/[0.05] hover:text-ink active:scale-[0.97]",
    outline:
      "border border-hairline bg-transparent text-ink hover:bg-foreground/[0.04] active:scale-[0.97]",
    destructive:
      "bg-transparent text-chili hover:bg-chili/10 active:scale-[0.97]",
    destructiveSolid:
      "bg-chili text-[#F4F1E8] hover:brightness-105 active:scale-[0.97]",
  },
  size: {
    sm: "h-8 px-3.5 text-xs rounded-lg",
    md: "h-9 px-4 text-sm rounded-lg",
    lg: "h-10 px-5 text-sm rounded-lg",
    icon: "h-11 w-11 min-h-11 min-w-11 shrink-0 rounded-lg",
  },
} as const;

export const badgeVariants = {
  base: "inline-flex items-center rounded-md px-2 py-0.5 text-caption font-medium tracking-wide",
  variant: {
    default: "border border-border-light bg-surface-secondary/80 text-foreground/85",
    primary: "bg-primary-muted text-lime",
    success: "bg-success-muted text-success",
    warning: "bg-warning-muted text-warning",
    destructive: "bg-destructive-muted text-destructive",
    outline: "border border-border bg-transparent text-muted-foreground",
  },
} as const;

export const fieldVariants = {
  label: "text-label font-medium text-foreground/90",
  hint: "text-caption text-muted-foreground leading-relaxed",
  error: "text-caption font-medium text-destructive",
  input: cn(
    "flex w-full rounded-lg border border-border bg-card px-3.5 text-base text-foreground",
    "shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
    interactiveTransition,
    "placeholder:text-muted-foreground/70",
    "[@media(hover:hover)]:hover:border-border-strong",
    "focus-visible:border-lime/50 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-lime/20",
    "dark:bg-elevated/80",
  ),
  inputError:
    "border-destructive/50 focus-visible:border-destructive/60 focus-visible:ring-destructive/15",
} as const;

export const selectVariants = {
  trigger: cn(
    "flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-border bg-card px-3.5 text-sm text-foreground",
    "shadow-[var(--shadow-xs)]",
    interactiveTransition,
    "hover:border-border-strong hover:bg-elevated",
    focusRing,
    "disabled:pointer-events-none disabled:opacity-45",
  ),
  triggerFilter: cn(
    "h-9 min-w-0 rounded-full border border-border-light bg-card/90 px-3.5 text-xs font-medium text-foreground/90",
    "hover:bg-elevated hover:text-foreground hover:border-border",
    "shadow-[var(--shadow-xs)]",
  ),
  triggerOpen: "border-lime/40 ring-[3px] ring-lime/15",
  menu: cn(
    "absolute left-0 top-[calc(100%+0.35rem)] z-50 max-h-60 min-w-full overflow-y-auto rounded-xl border border-border bg-elevated/98 p-1 shadow-lg backdrop-blur-md",
  ),
  item: cn(
    "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm text-foreground/90",
    interactiveTransition,
    "hover:bg-primary-muted/60 hover:text-foreground",
    "focus-visible:bg-primary-muted/60 focus-visible:outline-none",
    "disabled:pointer-events-none disabled:opacity-45",
  ),
  itemActive: "bg-primary-muted/50 font-medium text-foreground",
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
  overlay: "absolute inset-0 bg-overlay backdrop-blur-[4px]",
  panel: cn(
    "relative z-10 w-full overflow-hidden border border-border bg-elevated shadow-glow",
    "rounded-t-2xl sm:rounded-2xl",
  ),
  panelCentered: "max-w-lg",
  panelSheet: "max-h-[90vh] overflow-y-auto pb-[env(safe-area-inset-bottom)] sm:max-w-lg sm:mb-6",
  body: "p-6",
} as const;

export const progressVariants = {
  track: "overflow-hidden rounded-full bg-primary-muted/60",
  fill: "h-full rounded-full bg-lime transition-[width] duration-500 ease-[var(--ease-out)]",
  size: {
    sm: "h-1",
    md: "h-1.5",
    lg: "h-2",
  },
} as const;

export const segmentedControlVariants = {
  root: "flex gap-0.5 rounded-lg border border-border-light bg-muted/50 p-0.5",
  item: cn(
    "rounded-md px-3.5 py-2.5 min-h-11 text-sm font-medium capitalize transition-all duration-[var(--duration-fast)] sm:min-h-0 sm:py-1.5",
    "text-muted-foreground hover:text-foreground",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime/40",
  ),
  itemActive:
    "bg-card text-foreground shadow-[var(--shadow-xs)] border border-border-light font-semibold",
} as const;

export const tableVariants = {
  wrapper: "w-full overflow-x-auto rounded-xl border border-border-light",
  table: "w-full text-sm",
  head: "border-b border-border bg-surface-secondary/40 text-left",
  headCell:
    "px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground",
  body: "divide-y divide-border-light bg-card",
  row: "transition-colors hover:bg-surface-hover/50",
  cell: "px-4 py-3.5 align-middle",
} as const;

export const listVariants = {
  root: "divide-y divide-border-light rounded-xl border border-border-light bg-card",
  inset: "divide-y divide-border-light bg-card",
  item: "transition-colors hover:bg-surface-hover/40",
} as const;

export const panelVariants = {
  muted: "rounded-xl border border-border/60 bg-muted/30 px-4 py-3",
  mutedSubtle: "rounded-xl border border-border/50 bg-muted/20 px-4 py-3",
} as const;

export const hintVariants = {
  root: "flex items-start gap-2 rounded-lg border border-border-light bg-primary-muted/35 px-3.5 py-3 text-caption leading-relaxed text-muted-foreground",
} as const;

export const toastVariants = {
  base: cn(
    "pointer-events-auto flex max-w-sm items-center gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg backdrop-blur-md",
  ),
  tone: {
    default: "border-border bg-elevated/95 text-foreground",
    success: "border-success/20 bg-success-muted/95 text-success",
    warning: "border-warning/20 bg-warning-muted/95 text-warning",
    error: "border-destructive/20 bg-destructive-muted/90 text-destructive",
    info: "border-border bg-primary-muted/80 text-foreground",
  },
} as const;

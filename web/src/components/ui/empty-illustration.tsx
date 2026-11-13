import { cn } from "@/lib/design/cn";

export type EmptyIllustrationVariant = "receipt" | "coin" | "calendar" | "chart";

const stroke = "stroke-[#6B675C] dark:stroke-[#9A968A]";
const tick = "stroke-[#3F6E00] dark:stroke-[#C6F432]";

function Receipt() {
  return (
    <>
      <path
        d="M18 10 H46 V46 L42 50 L38 46 L34 50 L30 46 L26 50 L22 46 L18 50 Z"
        className={cn(stroke, "fill-none")}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M24 22 H40 M24 28 H36" className={stroke} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M26 36 L30 40 L38 30" className={cn(tick, "fill-none")} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </>
  );
}

function Coin() {
  return (
    <>
      <circle cx="32" cy="32" r="16" className={cn(stroke, "fill-none")} strokeWidth="1.5" />
      <path d="M32 22 V42 M26 27 H36 M26 37 H36" className={stroke} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M40 18 L44 22 L52 14" className={cn(tick, "fill-none")} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </>
  );
}

function Calendar() {
  return (
    <>
      <rect x="14" y="16" width="36" height="32" rx="4" className={cn(stroke, "fill-none")} strokeWidth="1.5" />
      <path d="M14 26 H50 M22 12 V20 M42 12 V20" className={stroke} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M26 36 L30 40 L40 30" className={cn(tick, "fill-none")} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </>
  );
}

function Chart() {
  return (
    <>
      <path d="M14 50 H50 M18 50 V34 M28 50 V26 M38 50 V30 M48 50 V18" className={stroke} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M40 16 L44 20 L52 12" className={cn(tick, "fill-none")} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </>
  );
}

const drawings = {
  receipt: Receipt,
  coin: Coin,
  calendar: Calendar,
  chart: Chart,
} as const;

export function EmptyIllustration({
  variant = "receipt",
  className,
}: {
  variant?: EmptyIllustrationVariant;
  className?: string;
}) {
  const Drawing = drawings[variant];
  return (
    <div className={cn("flex h-16 w-16 items-center justify-center", className)} aria-hidden>
      <svg viewBox="0 0 64 64" className="h-14 w-14" fill="none">
        <Drawing />
      </svg>
    </div>
  );
}

import { LogoMarkContent, logoMarkClipRadius, logoMarkSvgProps } from "@/lib/brand/logo-mark-content";

/** Shared mark for next/og ImageResponse routes — no client hooks. */
export function OgLogoMark({ size }: { size: number }) {
  const rx = logoMarkClipRadius();

  return (
    <svg width={size} height={size} {...logoMarkSvgProps()}>
      <rect width={48} height={48} rx={rx} fill="transparent" />
      <g clipPath="url(#viswallet-og-clip)">
        <LogoMarkContent variant="default" />
      </g>
      <defs>
        <clipPath id="viswallet-og-clip">
          <rect width={48} height={48} rx={rx} />
        </clipPath>
      </defs>
    </svg>
  );
}

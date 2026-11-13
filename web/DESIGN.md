# VisWallet — Receipt Noir

Source of truth for every later UI change. Do not invent a second palette, a second type system, or a second logo.

## Identity

VisWallet is a money diary for a crew of friends. The motif is the paper receipt and the tick of "settled".

Dark-first. People log money at night, and most of them use the installed PWA. Light mode is "Paper". One loud signal colour, Ledger Lime, is used only for money-in, primary actions, and the brand. Everything else is ink, paper, and hairlines.

No purple. No gradients on surfaces. No glassmorphism. No generic three-stat card rows.

## Name

Lowercase **vis** in Bricolage Grotesque 800, then **WALLET** in JetBrains Mono 500, uppercase, letter-spacing `0.18em`, at `0.55×` the size of "vis", baseline-aligned.

Never set "visWallet" in one font.

Tagline: `money, settled.` — lowercase, mono.

## Logo mark

A lime receipt with a torn zig-zag bottom edge and an ink check-mark "V" (V for vis, plus a tick for settled).

Artwork:

- `public/brand/mark.svg` — rounded app tile
- `public/brand/mark-maskable.svg` — full-bleed square, receipt and check inside the 80% safe zone
- `public/favicon.svg` — same as `mark.svg`

## Palette

All text pairs below were checked for WCAG AA (≥ 4.5:1).

### Dark — Carbon (default)

| Token | Value | Role |
| --- | --- | --- |
| `--bg` | `#0D0D0B` | page |
| `--surface` | `#171714` | cards |
| `--raised` | `#201F1B` | popovers, sheets |
| `--sunken` | `#080807` | wells, nav |
| `--ink` | `#F4F1E8` | text |
| `--ink-2` | `#9A968A` | secondary text |
| `--hairline` | `rgba(244,241,232,0.08)` | 1px borders |
| `--hairline-strong` | `rgba(244,241,232,0.16)` | stronger borders |
| `--lime` | `#C6F432` | brand, primary, money-in. Text on lime is `#0D0D0B` |
| `--chili` | `#FF5A36` | money-out, destructive |
| `--marigold` | `#FFB020` | owed, due, warning |
| `--cobalt` | `#7DA3FF` | info, links, secondary chart series |

### Light — Paper

| Token | Value | Role |
| --- | --- | --- |
| `--bg` | `#F4F0E6` | page |
| `--surface` | `#FFFDF7` | cards |
| `--raised` | `#FFFFFF` | popovers |
| `--sunken` | `#EAE5D8` | wells |
| `--ink` | `#12120F` | text |
| `--ink-2` | `#6B675C` | secondary text |
| `--hairline` | `rgba(18,18,15,0.08)` | 1px borders |
| `--hairline-strong` | `rgba(18,18,15,0.16)` | stronger borders |
| `--lime` | `#C6F432` | fill only (buttons and badges), with `#12120F` text |
| `--lime-text` | `#3F6E00` | lime used as text |
| `--chili` | `#C2361A` | money-out, destructive |
| `--marigold` | `#8A5A00` text / `#FFB020` fill | owed, due, warning |
| `--cobalt` | `#2F55D4` | info, links |

### Charts

Series order: lime, cobalt, marigold, chili, ink-2, then hairline-strong.

## Type

Free, via `next/font/google`.

- Display: Bricolage Grotesque, variable, `opsz` on. 600–800 for headings and hero numbers. CSS variable `--font-display`.
- Body: Instrument Sans 400/500/600. `--font-body`.
- Numbers and labels: JetBrains Mono. `font-variant-numeric: tabular-nums`. Every money amount uses mono. `--font-mono`.

Scale: 12 / 14 / 16 / 20 / 28 / 40 / 56.

Hero balance is 56px mono on mobile and 72px on desktop.

## Shape

- Cards: radius 14px, 1px hairline border, no drop shadow in dark mode.
- Pills and chips: 999px.
- Sheets: 20px.
- Receipt cards (transaction detail, Wrapped, settle-up): zig-zag bottom edge via CSS mask.
- Status chips look like rubber stamps: mono uppercase 11px, 1px border, rotated `-2deg` on hover or press.

## Motion

Ease-out `cubic-bezier(0.23, 1, 0.32, 1)` for enter, 180–240ms. Sheets use a spring (stiffness 420, damping 38). Exits are 40% faster than enters. Press is `scale(0.97)` over 120ms. Numbers roll (NumberTicker) only when the value changes. Honour `prefers-reduced-motion` everywhere. Never animate layout on scroll.

## Voice

Short. Lowercase-friendly. Indian context: ₹, UPI, "settled", "owes you". No exclamation marks except on goal confetti.

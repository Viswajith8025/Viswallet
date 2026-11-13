import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Bricolage_Grotesque, Instrument_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/providers/app-providers";
import { AppShell } from "@/components/shell/app-shell";
import { RegisterSW } from "@/components/pwa/register-sw";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { BRAND_NAME, BRAND_TAGLINE, BRAND_CARBON, BRAND_PAPER } from "@/lib/brand/constants";
import { cn } from "@/lib/utils";

const display = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz"],
});

const body = Instrument_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500"],
});

const APP_DESCRIPTION = `${BRAND_TAGLINE}. Track expenses, budgets, loans, and net worth — private, offline-first.`;

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://viswallet.app"),
  title: { default: `${BRAND_NAME} — Personal Finance`, template: `%s · ${BRAND_NAME}` },
  description: APP_DESCRIPTION,
  applicationName: BRAND_NAME,
  manifest: "/manifest.json",
  appleWebApp: { capable: true, title: BRAND_NAME, statusBarStyle: "black-translucent" },
  keywords: ["personal finance", "budget tracker", "expense tracker", "India", "offline", "PWA"],
  authors: [{ name: BRAND_NAME }],
  creator: BRAND_NAME,
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: BRAND_NAME,
    title: BRAND_NAME,
    description: APP_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: BRAND_NAME,
    description: APP_DESCRIPTION,
  },
  robots: { index: true, follow: true },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico", sizes: "48x48" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: BRAND_PAPER },
    { media: "(prefers-color-scheme: dark)", color: BRAND_CARBON },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "light dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={cn("min-h-full", display.variable, body.variable, mono.variable)} suppressHydrationWarning>
      <body className="min-h-[100dvh] min-h-screen font-[family-name:var(--font-body)] antialiased">
        <Script id="theme-boot" strategy="beforeInteractive">
          {`(function(){try{var d=document.documentElement;var mode="dark";var raw=localStorage.getItem("vw_boot_cache");if(raw){var boot=JSON.parse(raw);if(boot.themeMode==="light"||boot.themeMode==="dark"||boot.themeMode==="system")mode=boot.themeMode}var resolved=mode==="system"?(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):mode;d.setAttribute("data-theme",resolved);d.setAttribute("data-theme-mode",mode)}catch(e){document.documentElement.setAttribute("data-theme","dark")}})();`}
        </Script>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[300] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
          suppressHydrationWarning
        >
          Skip to main content
        </a>
        <AppProviders>
          <RegisterSW />
          <InstallPrompt />
          <AppShell>{children}</AppShell>
        </AppProviders>
      </body>
    </html>
  );
}

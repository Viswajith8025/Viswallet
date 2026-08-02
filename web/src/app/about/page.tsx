import type { Metadata } from "next";
import Link from "next/link";
import { PageContainer } from "@/components/ui/page";
import { Card, CardContent } from "@/components/ui/card";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { BrandTagline } from "@/components/brand/brand-tagline";
import {
  BRAND_DESCRIPTION,
  BRAND_DEVELOPER,
  BRAND_NAME,
} from "@/lib/brand/constants";

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "1.0.0";

export const metadata: Metadata = {
  title: "About",
  description: `About ${BRAND_NAME} — personal finance, private by design.`,
};

export default function AboutPage() {
  return (
    <PageContainer className="max-w-2xl">
      <div className="flex flex-col items-center py-8 text-center sm:py-12">
        <BrandLockup markSize={72} layout="vertical" />
        <BrandTagline className="mt-4 max-w-xs" />
        <p className="mt-6 text-sm text-muted-foreground">Version {APP_VERSION}</p>
      </div>

      <Card>
        <CardContent className="space-y-4 p-6 text-sm leading-relaxed text-muted-foreground">
          <p className="text-foreground font-medium">{BRAND_DESCRIPTION}</p>
          <p>
            {BRAND_NAME} keeps your budgets, bills, loans, and goals on your device first. Sign in
            optionally to sync across phones and tablets — your data stays yours.
          </p>
          <p>
            Built by <span className="text-foreground">{BRAND_DEVELOPER}</span> with a focus on calm,
            trustworthy money tracking for everyday life in India.
          </p>
        </CardContent>
      </Card>

      <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
        <Link href="/privacy" className="hover:text-foreground transition-colors">
          Privacy Policy
        </Link>
        <Link href="/terms" className="hover:text-foreground transition-colors">
          Terms of Service
        </Link>
        <Link href="/licenses" className="hover:text-foreground transition-colors">
          Open Source Licenses
        </Link>
      </div>
    </PageContainer>
  );
}

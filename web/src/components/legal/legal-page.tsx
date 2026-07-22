import Link from "next/link";
import { PageContainer } from "@/components/ui/page";

export function LegalPage({
  title,
  lastUpdated,
  children,
}: {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}) {
  return (
    <PageContainer className="max-w-3xl prose prose-sm dark:prose-invert">
      <header className="mb-8 space-y-2 not-prose">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Legal</p>
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">Last updated: {lastUpdated}</p>
      </header>
      <div className="space-y-6 text-sm leading-relaxed text-foreground/90">{children}</div>
      <footer className="mt-12 border-t border-border pt-6 not-prose">
        <nav className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <Link href="/privacy" className="hover:text-foreground">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-foreground">
            Terms
          </Link>
          <Link href="/licenses" className="hover:text-foreground">
            Licenses
          </Link>
          <Link href="/settings" className="hover:text-foreground">
            Settings
          </Link>
        </nav>
      </footer>
    </PageContainer>
  );
}

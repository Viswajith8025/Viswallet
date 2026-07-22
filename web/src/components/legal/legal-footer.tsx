import Link from "next/link";

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "1.0.0";

export function LegalFooter({ className }: { className?: string }) {
  return (
    <footer className={className}>
      <p className="text-xs text-muted-foreground">
        Viswallet v{APP_VERSION} ·{" "}
        <Link href="/privacy" className="hover:text-foreground">
          Privacy
        </Link>
        {" · "}
        <Link href="/terms" className="hover:text-foreground">
          Terms
        </Link>
        {" · "}
        <Link href="/licenses" className="hover:text-foreground">
          Licenses
        </Link>
      </p>
    </footer>
  );
}

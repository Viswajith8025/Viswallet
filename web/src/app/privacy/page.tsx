import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Viswallet handles your data — local-first, private by design.",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" lastUpdated="July 2026">
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Overview</h2>
        <p>
          Viswallet (&quot;we&quot;, &quot;the app&quot;) is a personal finance tracker delivered as a
          progressive web app. Your financial data is stored primarily on your device. We do not sell
          your data.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Data stored on your device</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Expenses, income, budgets, goals, subscriptions, loans, and notes</li>
          <li>App settings (theme, salary cycle, dashboard layout)</li>
          <li>Optional PIN lock (stored as a salted hash — never plain text)</li>
          <li>Local security audit log (sign-in attempts, exports, imports)</li>
        </ul>
        <p>
          Data lives in your browser&apos;s IndexedDB. Clearing site data or uninstalling the PWA will
          remove it unless you have exported a backup.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Cloud sync (optional)</h2>
        <p>
          If you configure Supabase credentials, account authentication may use Supabase. Financial
          records remain in local IndexedDB unless you explicitly enable future sync features. When
          enabled, Supabase Row Level Security restricts access to your own records.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Insights and analysis</h2>
        <p>
          Spending insights, forecasts, and health scores are computed entirely on your device. No
          transaction data is sent to third-party AI or analytics services by default.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Error reporting and analytics (optional)</h2>
        <p>
          In production, your operator may enable anonymous error reporting (error message and page
          path only — never amounts or transaction titles) or page-view analytics. These are
          disabled unless explicitly configured via environment variables. No third-party trackers
          are included in the default build.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Backups and exports</h2>
        <p>
          When you export data, the file is created on your device. Encrypted backups use a
          passphrase you choose; we cannot recover it if you lose the passphrase. Exports do not
          include your PIN hash.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Cookies and storage</h2>
        <p>
          Viswallet uses browser local storage and IndexedDB for app functionality. Optional Supabase
          auth may set session cookies when cloud sign-in is enabled.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Your rights</h2>
        <p>
          You can export, delete, or reset all data at any time from Settings. Because data is
          local-first, you control retention entirely.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Contact</h2>
        <p>
          For privacy questions, open an issue at{" "}
          <a
            href="https://github.com/Viswajith8025/Viswallet/issues"
            className="font-medium text-primary underline-offset-2 hover:underline"
            rel="noopener noreferrer"
            target="_blank"
          >
            github.com/Viswajith8025/Viswallet
          </a>
          .
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Changes</h2>
        <p>We may update this policy. Continued use after changes constitutes acceptance.</p>
      </section>
    </LegalPage>
  );
}

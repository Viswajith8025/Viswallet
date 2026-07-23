import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms governing use of the Viswallet personal finance app.",
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" lastUpdated="July 2026">
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Agreement</h2>
        <p>By installing or using Viswallet you agree to these Terms of Service.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Not financial advice</h2>
        <p>
          Viswallet is a budgeting and tracking tool. It does not provide investment, tax, or legal
          advice. Safe daily spend amounts, forecasts, health scores, and insights are estimates
          based on data you enter.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Your responsibility</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Accuracy of amounts and categories you enter</li>
          <li>Securing your device, browser, and optional PIN</li>
          <li>Maintaining regular encrypted backups via Settings</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Acceptable use</h2>
        <p>
          Do not misuse the app, attempt to access other users&apos; data, probe for vulnerabilities,
          or extract embedded API keys. Automated scraping of hosted instances is prohibited without
          permission.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Availability</h2>
        <p>
          Viswallet works offline after the first load. Cloud sync, if enabled, requires internet
          access. We may update, suspend, or discontinue features with reasonable notice where
          practicable.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Disclaimer of warranties</h2>
        <p>
          The app is provided &quot;as is&quot; without warranties of any kind, express or implied,
          including fitness for a particular purpose or data accuracy.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Limitation of liability</h2>
        <p>
          To the maximum extent permitted by law, we are not liable for financial decisions you make
          based on app outputs, or for data loss resulting from device failure, browser data clearing,
          or failure to maintain backups.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Governing law</h2>
        <p>
          These terms are governed by the laws applicable in India unless your local jurisdiction
          requires otherwise. Disputes should first be raised via the contact channel on the Viswallet
          website.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Contact</h2>
        <p>
          For support, open an issue at{" "}
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
    </LegalPage>
  );
}

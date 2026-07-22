import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Open Source Licenses",
  description: "Third-party open source licenses used by Viswallet.",
};

const DEPENDENCIES = [
  { name: "Next.js", license: "MIT", url: "https://github.com/vercel/next.js" },
  { name: "React", license: "MIT", url: "https://github.com/facebook/react" },
  { name: "Dexie.js", license: "Apache-2.0", url: "https://github.com/dexie/Dexie.js" },
  { name: "TanStack Query", license: "MIT", url: "https://github.com/TanStack/query" },
  { name: "Zustand", license: "MIT", url: "https://github.com/pmndrs/zustand" },
  { name: "Tailwind CSS", license: "MIT", url: "https://github.com/tailwindlabs/tailwindcss" },
  { name: "Framer Motion", license: "MIT", url: "https://github.com/motiondivision/motion" },
  { name: "Recharts", license: "MIT", url: "https://github.com/recharts/recharts" },
  { name: "date-fns", license: "MIT", url: "https://github.com/date-fns/date-fns" },
  { name: "Fuse.js", license: "Apache-2.0", url: "https://github.com/krisk/Fuse" },
  { name: "cmdk", license: "MIT", url: "https://github.com/pacocoursey/cmdk" },
  { name: "lucide-react", license: "ISC", url: "https://github.com/lucide-icons/lucide" },
  { name: "Zod", license: "MIT", url: "https://github.com/colinhacks/zod" },
  { name: "@supabase/supabase-js", license: "MIT", url: "https://github.com/supabase/supabase-js" },
  { name: "clsx", license: "MIT", url: "https://github.com/lukeed/clsx" },
  { name: "tailwind-merge", license: "MIT", url: "https://github.com/dcastil/tailwind-merge" },
] as const;

export default function LicensesPage() {
  const version = process.env.NEXT_PUBLIC_APP_VERSION ?? "1.0.0";

  return (
    <LegalPage title="Open Source Licenses" lastUpdated="July 2026">
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Viswallet</h2>
        <p>
          Viswallet web app version <strong>{version}</strong>. Application source is provided under
          the MIT License (see repository <code>LICENSE</code> file).
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Third-party dependencies</h2>
        <p className="text-muted-foreground">
          This app is built with open source software. Full license texts are available in each
          package&apos;s repository and in <code>node_modules</code> after installation.
        </p>
        <ul className="divide-y divide-border rounded-xl border border-border">
          {DEPENDENCIES.map((dep) => (
            <li key={dep.name} className="flex items-center justify-between gap-4 px-4 py-3">
              <a
                href={dep.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium hover:text-primary"
              >
                {dep.name}
              </a>
              <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {dep.license}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Attribution</h2>
        <p>
          Icons by{" "}
          <a href="https://lucide.dev" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
            Lucide
          </a>
          . Fonts: Plus Jakarta Sans and Inter via Google Fonts.
        </p>
      </section>
    </LegalPage>
  );
}

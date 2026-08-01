"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/design/cn";
import type { DeploymentReadiness } from "@/lib/deployment/types";

function StatusRow({ ok, label, hint }: { ok: boolean; label: string; hint?: string }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      {ok ? (
        <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-success" />
      ) : (
        <XCircle size={16} className="mt-0.5 shrink-0 text-destructive" />
      )}
      <div>
        <p className="font-medium">{label}</p>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </div>
    </div>
  );
}

export function DeploymentStatus() {
  const [data, setData] = useState<DeploymentReadiness | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    void fetch("/api/health")
      .then((res) => res.json())
      .then((json) => setData(json as DeploymentReadiness))
      .catch(() => setError(true));
  }, []);

  if (error) {
    return <p className="text-sm text-muted-foreground">Could not load deployment status.</p>;
  }

  if (!data) {
    return <p className="text-sm text-muted-foreground">Checking production config…</p>;
  }

  return (
    <div className="space-y-3">
      <p
        className={cn(
          "text-sm font-medium",
          data.ok ? "text-success" : "text-warning",
        )}
      >
        {data.ok ? "Production config looks good." : "Some production settings need attention."}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <StatusRow
          ok={data.checks.appUrl}
          label="Public app URL (HTTPS)"
          hint="NEXT_PUBLIC_APP_URL on Vercel"
        />
        <StatusRow
          ok={data.checks.supabase}
          label="Supabase auth"
          hint="URL + anon key"
        />
        <StatusRow
          ok={data.checks.cloudVault}
          label="Cloud vault backup"
          hint="NEXT_PUBLIC_CLOUD_VAULT=true + SQL migration"
        />
        <StatusRow
          ok={data.checks.groq}
          label="Groq AI (server)"
          hint="GROQ_API_KEY on Vercel"
        />
      </div>
    </div>
  );
}

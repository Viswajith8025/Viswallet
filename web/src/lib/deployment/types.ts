export type DeploymentReadiness = {
  ok: boolean;
  service: string;
  version: string;
  timestamp: string;
  checks: {
    appUrl: boolean;
    supabase: boolean;
    cloudVault: boolean;
    groq: boolean;
  };
};

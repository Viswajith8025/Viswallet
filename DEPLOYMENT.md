# Deployment Guide

Production deployment checklist for Viswallet Web.

## Prerequisites

- Node.js 20+
- Hosting with HTTPS (required for PWA, service worker, and secure contexts)
- Domain configured (e.g. `viswallet.app`)

## Recommended: Vercel

**Option A — Root Directory `web` (recommended)**

1. Import the repository
2. **Settings → General → Root Directory** → `web`
3. Framework preset: **Next.js**
4. Leave Install / Build commands as defaults
5. Set environment variables (see below)
6. Deploy

`web/vercel.json` configures Mumbai region (`bom1`) and SW cache headers.

**Option B — Deploy from repo root**

Leave Root Directory empty. Root `vercel.json` runs `npm ci --prefix web` and `npm run build --prefix web` automatically.

## Environment variables

Copy `web/.env.example` to `web/.env.local` for local dev.

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_APP_URL` | **Yes (prod)** | Canonical URL, e.g. `https://viswallet.app` |
| `NEXT_PUBLIC_APP_VERSION` | Recommended | Semver shown in legal pages; sync with `package.json` |
| `NEXT_PUBLIC_SUPABASE_URL` | Optional | Cloud auth/sync — both Supabase vars required together |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Optional | Supabase anon key (RLS-protected) |
| `NEXT_PUBLIC_CLOUD_VAULT` | Optional | Set `true` after migration `003_user_data_vaults.sql` is applied |
| `NEXT_PUBLIC_ERROR_REPORT_URL` | Optional | POST endpoint for crash reports (no financial data) |
| `NEXT_PUBLIC_ANALYTICS_ENABLED` | Optional | Set `true` to enable anonymous page views |
| `NEXT_PUBLIC_ANALYTICS_ENDPOINT` | Optional | POST endpoint for analytics events |

**Never** expose `SUPABASE_SERVICE_ROLE_KEY` or `ENCRYPTION_KEY` as `NEXT_PUBLIC_*`.

## Production checklist

- [ ] `NEXT_PUBLIC_APP_URL` set to production domain
- [ ] `npm run build` passes locally
- [ ] CI green on `main`
- [ ] Legal pages accessible: `/privacy`, `/terms`, `/licenses`
- [ ] PWA installable (manifest + SW register in production)
- [ ] Settings → Export backup tested
- [ ] Optional: error reporting endpoint configured
- [ ] Optional: Supabase RLS migrations applied (`web/supabase/migrations/`)
- [ ] DNS + HTTPS valid
- [ ] `robots.txt` / SEO metadata reviewed

## Monitoring

| Concern | Default | Production setup |
|---------|---------|------------------|
| **Crash reporting** | Off | Set `NEXT_PUBLIC_ERROR_REPORT_URL` or integrate Sentry tunnel |
| **Analytics** | Off | Set `NEXT_PUBLIC_ANALYTICS_ENABLED=true` + endpoint, or add Vercel Analytics |
| **Logging** | Browser console (dev) | Server logs from host; no server-side app logs by default (static PWA) |
| **Uptime** | — | Use UptimeRobot / Better Stack on `/` |
| **Backups** | User-driven | Encourage Settings → encrypted export; operator backups N/A (local-first) |

## Sentry (optional)

For full crash reporting, add `@sentry/nextjs` and point `NEXT_PUBLIC_ERROR_REPORT_URL` to your Sentry tunnel, or replace `reportError()` in `src/lib/monitoring/report.ts`.

## Self-hosted (Node)

```bash
cd web
npm ci
npm run build
NODE_ENV=production npm start
```

Serve behind reverse proxy (nginx/Caddy) with TLS. Set `PORT` if needed.

## Versioning

1. Bump `version` in `web/package.json`
2. Set `NEXT_PUBLIC_APP_VERSION` in production env
3. Add entry to `CHANGELOG.md`
4. Tag: `git tag v1.0.0 && git push origin v1.0.0`

## Rollback

Vercel: promote previous deployment. Self-hosted: redeploy previous build artifact. User data is local — rollbacks do not affect IndexedDB on user devices.

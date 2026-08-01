# Viswallet — Production Launch

**Recommended URL:** https://viswallet.app (or your Vercel deployment URL)

## Mode A: Local-first (fastest launch)

No Supabase required. Each user keeps data in their browser (IndexedDB).

### Vercel settings

| Setting | Value |
|---------|-------|
| Root Directory | `web` |
| Framework | Next.js |

### Required env vars

| Variable | Example |
|----------|---------|
| `NEXT_PUBLIC_APP_URL` | `https://viswallet.app` |
| `NEXT_PUBLIC_APP_VERSION` | `1.0.0` |

Leave Supabase vars **unset**. Users install the PWA and use the app without accounts.

## Mode B: Cloud accounts + backup sync

Requires a **dedicated** Supabase project (do not share with VAULT-ER).

1. Create a Supabase project
2. Run `web/supabase/migrations/003_user_data_vaults.sql` in the SQL editor
3. Configure Auth:
   - Site URL → your production domain
   - Redirect URLs → `https://your-domain.com/**`
   - Disable email confirmation for instant sign-in (or handle confirm flow in UI)
4. Set Vercel env vars:

```
NEXT_PUBLIC_APP_URL=https://viswallet.app
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_CLOUD_VAULT=true
```

Cloud vault stores a JSON backup per user (RLS-isolated). Local IndexedDB remains the source of truth; cloud sync runs after login.

## Pre-launch checks

```bash
cd web
npm ci
npm run build
npm test
```

- [ ] `/privacy`, `/terms`, `/licenses` load
- [ ] PWA install works (HTTPS required)
- [ ] Settings → encrypted export works
- [ ] `/api/health` returns OK

## CI

GitHub Actions runs lint, typecheck, build, and tests on push to `main`.

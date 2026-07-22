# Viswallet Security

**Last updated:** July 2026  
**Classification:** Financial data — treat as sensitive

---

## Overview

Viswallet is an **offline-first** personal finance PWA. Financial data is stored in the browser's **IndexedDB** (Dexie). There is no server-side database in the default deployment. Optional Supabase cloud sync is stubbed with Row Level Security (RLS) policies prepared for future use.

---

## Threat Model

### Assets

| Asset | Sensitivity | Storage |
|-------|-------------|---------|
| Transactions, salary, loans, investments | **Critical** | IndexedDB |
| Profile (name, email) | **High** | IndexedDB |
| PIN verifier (hash + salt) | **High** | IndexedDB |
| Backup files | **Critical** | User filesystem |
| Session unlock timestamp | **Medium** | sessionStorage |
| Supabase anon key | **Low** (public by design) | Client bundle |

### Threat Actors

1. **Physical access** — Someone uses an unlocked device/browser
2. **Malicious browser extension** — Same-origin access to IndexedDB
3. **XSS** — Injected script reads local data
4. **Malicious backup file** — Crafted JSON corrupts or wipes data
5. **Network attacker** — MITM on hosted app (mitigated by HTTPS/HSTS)
6. **Supply chain** — Compromised npm dependency

### Trust Boundaries

```
┌─────────────────────────────────────────┐
│  User's Browser (trusted if uncompromised) │
│  ┌─────────────┐  ┌──────────────────┐  │
│  │ App Lock    │→ │ IndexedDB (Dexie) │  │
│  │ (PIN/PBKDF2)│  │ Financial data    │  │
│  └─────────────┘  └──────────────────┘  │
│  ┌─────────────────────────────────────┐ │
│  │ sessionStorage (unlock expiry only)  │ │
│  └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
         │ optional, future
         ▼
┌─────────────────────────────────────────┐
│  Supabase (RLS-enforced per user_id)     │
└─────────────────────────────────────────┘
```

### Out of Scope (by architecture)

- **CSRF** — No cookie-based session APIs in local-only mode
- **SQL injection** — No SQL; IndexedDB only
- **Server-side brute force** — No auth endpoints

---

## Security Controls Implemented

### Authentication & Authorization

| Control | Implementation |
|---------|----------------|
| App lock (PIN) | PBKDF2-SHA256, 310k iterations (`lib/security/crypto.ts`) |
| Brute-force protection | 5 attempts → 30 min lockout (`lib/security/pin.ts`) |
| Session expiry | Auto-lock after configurable inactivity (`lib/security/session.ts`) |
| Route guard | Onboarding required for all routes except `/onboarding` |
| Least privilege | No cross-user data access; single local profile |

### Data Protection

| Control | Implementation |
|---------|----------------|
| Input sanitization | Strip control chars, XSS chars, length limits (`lib/security/sanitize.ts`) |
| Schema validation | Zod backup + form validation (`lib/security/validation.ts`) |
| Encrypted backups | AES-256-GCM with passphrase (`lib/security/crypto.ts`) |
| Amount bounds | Max ₹100 crore per field (`lib/security/constants.ts`) |
| Safe errors | No internal details leaked (`lib/security/errors.ts`) |

### Transport & Headers

| Header | Value |
|--------|-------|
| Content-Security-Policy | Strict default-src, no frames |
| X-Frame-Options | DENY |
| X-Content-Type-Options | nosniff |
| Strict-Transport-Security | 2 years (production) |
| Referrer-Policy | strict-origin-when-cross-origin |
| Permissions-Policy | Camera/mic/geo disabled |

Configured in `src/middleware.ts` and `next.config.ts`.

### Backup & Import

- Max file size: **10 MB**
- Zod schema validation before any write
- Dexie transaction (atomic rollback on failure)
- Rate limiting: 3 imports / minute
- Optional AES-256-GCM encryption

### Audit Trail

Security events logged to `auditLogs` table (local):

- `app.unlock`, `app.lock`, `app.pin_set`, `app.pin_failed`
- `backup.export`, `backup.import`, `data.reset`
- 90-day retention, max 5,000 entries

View in **Settings → Audit trail**.

### Supabase (Future Cloud Sync)

- Client uses PKCE flow, sessionStorage (not localStorage)
- RLS policies in `supabase/migrations/001_rls_policies.sql`
- **Never** expose `SUPABASE_SERVICE_ROLE_KEY` to the client
- Anon key safe only when RLS verified on every table

### Service Worker

- Network-first for navigation (no stale sensitive UI)
- No caching of `/api` routes
- Static assets only cache-first

### Dependencies

```bash
npm run audit:deps    # npm audit moderate+
npm run security:check # audit + build
```

---

## Security Checklist

### Development

- [ ] Never commit `.env` files (`.gitignore` enforces)
- [ ] Run `npm run security:check` before releases
- [ ] No `console.log` in production code
- [ ] No `dangerouslySetInnerHTML` without sanitization
- [ ] All user input sanitized before IndexedDB write
- [ ] Backup import tested with malformed files

### Deployment

- [ ] HTTPS only (HSTS enabled in production)
- [ ] CSP headers verified (no violations in browser console)
- [ ] `poweredByHeader: false`
- [ ] Supabase RLS applied before enabling cloud sync
- [ ] Service role key stored server-side only

### User Guidance

- [ ] Enable app lock PIN
- [ ] Use encrypted backups with strong passphrase
- [ ] Export backups regularly
- [ ] Do not install untrusted browser extensions
- [ ] Clear data before sharing/selling device

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation | Residual |
|------|------------|--------|------------|----------|
| XSS data exfiltration | Low | Critical | CSP, React escaping, no innerHTML | Medium (extension risk) |
| Physical access | Medium | High | App lock, auto-lock | Low with PIN enabled |
| Malicious backup import | Low | Critical | Zod validation, size limits, atomic tx | Low |
| Plaintext backup theft | Medium | Critical | Encrypted export (AES-GCM) | Low if encrypted |
| IndexedDB unencrypted at rest | High | High | OS disk encryption + app lock | Medium |
| Dependency vulnerability | Low | High | npm audit, minimal deps | Low |
| Supabase misconfiguration | Low | Critical | RLS migrations, no service key in client | Low if RLS verified |

---

## Architecture Improvements (Roadmap)

1. **WebAuthn / biometric unlock** — Replace PIN with platform authenticator
2. **IndexedDB encryption** — Encrypt sensitive fields at rest with derived key
3. **Backup integrity** — HMAC signature on export files
4. **CSP nonces** — Remove `unsafe-inline` for scripts in production
5. **Server-side auth** — When enabling sync, use Supabase Auth + RLS only
6. **Security monitoring** — Sentry/error tracking with PII scrubbing
7. **Account recovery** — Email-based recovery when cloud auth is added

---

## Reporting Vulnerabilities

If you discover a security issue, please report it privately. Do not open public issues for vulnerabilities.

---

## File Reference

| Path | Purpose |
|------|---------|
| `src/lib/security/` | Crypto, validation, audit, rate limiting |
| `src/middleware.ts` | Security headers |
| `src/components/security/` | App lock, route guard |
| `supabase/migrations/001_rls_policies.sql` | Future RLS policies |
| `src/lib/supabase/client.ts` | Secure Supabase client |

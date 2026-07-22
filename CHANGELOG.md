# Changelog

All notable changes to Viswallet are documented here.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.0.0] - 2026-07-22

### Added
- Production release: 34-route Next.js PWA with offline-first IndexedDB storage
- Legal pages: `/privacy`, `/terms`, `/licenses`
- CI pipeline: lint, test, build on push/PR
- Optional error reporting (`NEXT_PUBLIC_ERROR_REPORT_URL`)
- Optional privacy-friendly analytics (`NEXT_PUBLIC_ANALYTICS_ENABLED`)
- Offline banner and service worker offline fallback
- Encrypted backup export/import in Settings
- Design system v3, command palette, quick-add modal
- Smart insights, forecasts, duplicate detection, undo delete

### Security
- CSP and security headers via middleware
- HSTS in production
- PIN lock with salted hashing
- Rate limiting on sensitive operations
- Local audit trail

### Fixed
- Duplicate transaction fingerprint uses local calendar day (timezone-safe)
- Transaction form double-submit guard
- Search min-amount NaN filter bug
- Accounts balance parsing via `parseRupeeInput`
- Negative amount input rejection

[1.0.0]: https://github.com/viswallet/viswallet/releases/tag/v1.0.0

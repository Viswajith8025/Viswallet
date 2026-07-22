# Viswallet Web

Premium personal finance platform — calm, luxurious, production-grade.

## Run

```bash
cd web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| State | Zustand (UI) + TanStack React Query (data) |
| Database | Dexie / IndexedDB (offline-first, persists on refresh) |
| Cloud (optional) | Supabase client stub in `.env.example` |
| Charts | Recharts |
| Search | Fuse.js |
| Command palette | cmdk (Ctrl+K) |
| Motion | Framer Motion |
| PWA | manifest + service worker |

## Features

- **Dashboard** — cycle overview, health score, smart insights
- **Transactions** — unified income & expenses
- **Analytics** — charts and category breakdown
- **Budgets** — salary-cycle bucket planner
- **Bills, Subscriptions, EMI** — recurring money management
- **Loans & Borrowed** — track lent/borrowed with payments
- **Goals, Wishlist, Investments** — wealth building
- **Net Worth** — consolidated position
- **Calendar** — upcoming dues and renewals
- **Insights** — rule-based financial suggestions
- **Search** — fuzzy search across transactions
- **Command palette** — Raycast-style navigation (Ctrl+K)
- **Quick Add** — modal for fast expense/income entry
- **Notifications, Profile, Settings** — themes, export/import backup

## Data

All finance data lives in **IndexedDB** in the browser. Use Settings → Export backup regularly.

Optional Supabase: set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `web/.env.local` for future cloud sync.

## Production

See [DEPLOYMENT.md](./DEPLOYMENT.md) for environment variables, CI/CD, monitoring, and launch checklist.

Legal pages: `/privacy`, `/terms`, `/licenses`

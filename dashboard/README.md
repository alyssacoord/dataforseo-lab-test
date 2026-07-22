# Coord — Competitive Intelligence Dashboard

Growing internal dashboard for the DataForSEO-powered product promises in `../dataforseo-api-research.md`. Built as a Next.js App Router app so each capability is its own route/module, and new ones can be added without restructuring anything.

## Status

| Module | Route | Status |
|---|---|---|
| Competitive Set Auto-Detection | `/competitive-set` | **Live** — enter a domain, see ranked competitors, expand to see overlapping keywords |
| Trend Detection | `/trend-detection` | Placeholder — planned endpoints listed on the page |
| AI Visibility | `/ai-visibility` | Placeholder |
| Search Visibility | `/search-visibility` | Placeholder |

## Setup

```bash
npm install
npm run dev
```

Open http://localhost:3000. It redirects to `/competitive-set`.

Credentials come from `.env.local` (`DATAFORSEO_LOGIN` / `DATAFORSEO_PASSWORD`, copied from the parent folder's `.env`) and are only ever read server-side, in `app/api/dataforseo/route.ts` — the browser never sees them.

The top bar has a **Sandbox / Live** toggle. It defaults to Sandbox (free, canned responses). Flip to Live only when you want real data — every call costs a small amount.

## Architecture

- `app/api/dataforseo/route.ts` — the only place that talks to DataForSEO. Takes `{ path, method, body, mode, taskId }`, adds Basic Auth server-side, forwards to `sandbox.dataforseo.com` or `api.dataforseo.com`, returns the raw response plus timing.
- `app/api/dataforseo/status/route.ts` — tells the UI whether credentials loaded, without ever exposing the password.
- `lib/dataforseo.ts` — client-side `runDataForSEO()` wrapper + helpers to pull `items` out of DataForSEO's `tasks[0].result[0].items` envelope and surface task-level errors.
- `lib/types.ts` — response shapes, confirmed against real Sandbox calls (not guessed) for `competitors_domain` and `domain_intersection`.
- `components/ModeProvider.tsx` — Sandbox/Live state shared across all modules (persisted to `localStorage`).
- `components/DashboardShell.tsx` — top bar + sidebar nav. Add a new module by adding an entry to `NAV_ITEMS` and a matching route under `app/`.
- `components/ComingSoon.tsx` — placeholder shown by unbuilt modules, listing which endpoints they'll use.

## Adding the next module (e.g. Trend Detection)

1. Delete the `soon` status for that item in `components/DashboardShell.tsx`.
2. Replace `app/trend-detection/page.tsx`'s `<ComingSoon />` with a real client component, following the pattern in `app/competitive-set/page.tsx`: call `runDataForSEO()` with the relevant path/body, pull results with `extractItems()`, render.
3. Add any new response shapes to `lib/types.ts` — verify them against a real Sandbox call first (see `../dataforseo-test-plan.md` for sample bodies), don't guess field names.

# DataForSEO Lab Test — Coord

Research, verification, and a working prototype dashboard for the DataForSEO v3 API, evaluated for Coord's fashion competitive & market intelligence use case.

## What's in here

| Path | What it is |
|---|---|
| [`dataforseo-api-research.md`](dataforseo-api-research.md) | The original research: which DataForSEO v3 endpoints are relevant to Coord, tiered by priority. |
| [`dataforseo-reality-check.md`](dataforseo-reality-check.md) | An honest audit of that research against DataForSEO's actual docs — what's confirmed accurate, and where the framing overstates things. |
| [`dataforseo-test-plan.md`](dataforseo-test-plan.md) | Step-by-step manual test steps for every endpoint in the research doc, with sample request bodies. |
| [`test-ui/`](test-ui) | A small local Node app: a generic endpoint tester with a Sandbox/Live toggle, for validating any DataForSEO endpoint's request/response shape by hand. |
| [`dashboard/`](dashboard) | A Next.js app — the real prototype. Purpose-built UI for the endpoints that power Coord's actual product promises, not just a raw API tester. |
| `categories_dataforseo_labs_2023_10_25.csv` | DataForSEO's product/service category taxonomy (Labs API), e.g. `10021` = `/Apparel`. Not the same taxonomy Google Trends uses — see the caveat in `dataforseo-test-plan.md`. |

## The dashboard

`dashboard/` is where active development is happening. Current state:

| Module | Status |
|---|---|
| Competitive Set Auto-Detection | Live — domain in, ranked competitors out, add/remove into a persisted set |
| Trend Detection | Live — momentum chart + age/gender demographic breakdown |
| AI Visibility | Live — brand comparison, category dominance, mentions-over-time, and live Google AI Mode answers |
| Search Visibility | Placeholder — not yet built |

See [`dashboard/README.md`](dashboard/README.md) for its architecture and how to extend it.

## Setup

Both apps need real DataForSEO credentials (a free account works — Sandbox mode costs nothing).

```bash
cp .env.example .env                             # for test-ui/
cp dashboard/.env.local.example dashboard/.env.local   # for the dashboard
```

Fill in `DATAFORSEO_LOGIN` and `DATAFORSEO_PASSWORD` in both files (same credentials in each — they're separate apps with separate config, not a shared secret store).

Then:
```bash
# the raw endpoint tester
cd test-ui && npm install && npm start        # http://localhost:5177

# the dashboard
cd dashboard && npm install && npm run dev     # http://localhost:3000
```

Both default to **Sandbox mode** (free, canned responses) — flip to Live in the UI only when you want real data; Live calls cost a small real amount per request.

## Security note

This repo is public. `.env` / `.env.local` are gitignored — never commit real credentials. If you fork or extend this, keep it that way.

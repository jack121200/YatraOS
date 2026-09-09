# YatraOS

Personalized dynamic tour planning + tour operations platform. HackCelestial 3.0, PS ID 7.

## Structure

```
YatraOS/
├── frontend/                  React + Vite + Tailwind (deploys to Vercel)
│   └── src/
│       ├── pages/traveller/   TripBuilder (landing), ItineraryView, DisruptionModal, RecoveryPicker, Onboarding (legacy, unrouted from nav)
│       ├── pages/operator/    Dashboard, TripsList, AlertsPanel, VendorView
│       ├── components/        StatusBadge, RecoveryPlanCard, TripCard, GroupLedger, BudgetTracker
│       ├── lib/                money.ts (currency formatting), useOperatorTrips.ts
│       ├── services/api.ts    axios client
│       └── store/tripStore.ts zustand — holds the last-built trip across pages
├── backend/                   FastAPI (deploys to Vercel serverless — see vercel.json)
│   ├── api/index.py           Vercel entrypoint, imports app/main.py
│   ├── supabase/migrations/   SQL schema — NOT yet applied to any live project
│   └── app/
│       ├── main.py            routers + CORS + Sentry init
│       ├── config.py          env var settings
│       ├── graph/             trip_graph.py, ripple_engine.py, recovery_ranker.py — the product's IP
│       ├── ai/                preference_parser.py, itinerary_builder.py, validator.py, embeddings.py (Gemini only, no Anthropic)
│       ├── api/                routers: trips, itinerary, disruptions, recovery, ledger, operator, auth, demo
│       ├── services/           places.py, routing.py, weather.py, payments.py, notifications.py (stubs)
│       ├── models/             persisted data shape (Trip, Node, Edge, Vendor, Booking, Payment, LedgerEntry, User)
│       ├── schemas/            API request/response DTOs
│       └── db/                 Supabase client
├── data/seed/                  Hand-curated demo datasets, one per city (see cities.json for status)
└── .mcp.json                   Claude Code MCP server config (no secrets)
```

## Current status — all 6 roadmap MUST HAVEs are real and browser-tested

Every item below was verified by actually running the app (backend live on :8000, frontend on :5173) and clicking through it with Playwright — not just written and assumed correct. Two real bugs were found and fixed this way: an IDR/AED/THB currency-formatting bug, and a broken Thai baht/dirham glyph (Plus Jakarta Sans doesn't have those symbols — switched to currency codes for those two).

1. **Build-your-own-trip** (`TripBuilder`, `/`) — city/interests/budget/pace → calls `GET /api/demo/build-itinerary`, which runs the real `ai/itinerary_builder.py` + `validator.py`. Works for all 7 cities.
2. **Trip Dependency Graph** (`backend/app/graph/trip_graph.py`) — real NetworkX wrapper, not a stub.
3. **Ripple Engine** (`ripple_engine.py`) — `GET /api/demo/ripple?city=<id>` finds downstream-affected nodes for real, for all 7 cities.
4. **Three recovery plans** (`recovery_ranker.py` + `RecoveryPicker` at `/recovery`) — cheapest/fastest/least-disruptive, with a live city picker across all 7 cities, currency-aware.
5. **Operator dashboard** (`/operator`, `/operator/alerts`, `/operator/trips`, `/operator/vendor`) — live trips sorted by Ripple Impact Score, alerts filtered by threshold, read-only vendor table. Backed by `GET /api/demo/operator-trips`, which runs the real ripple engine per city.
6. **Group ledger** (`GroupLedger` component, on `/itinerary`) — add/remove people, uncheck someone on a stop they're skipping, per-person totals recalculate live. Verified the arithmetic by hand against a screenshot.

Full traveller flow is click-through wired: `TripBuilder` → `ItineraryView` (budget tracker + group ledger) → `DisruptionModal` ("Simulate a disruption", real ripple data) → `RecoveryPicker`.

## What's still not real

- **Everything under `backend/app/api/` except `demo.py`** (`trips`, `itinerary`, `disruptions`, `recovery`, `ledger`, `operator`, `auth`): routed but raise `NotImplementedError` — they need Supabase. `demo.py` is the working reference implementation for what they should do once wired.
- **Supabase schema** (`backend/supabase/migrations/0001_init.sql`): written, matches `app/models/domain.py`, but **not applied to any live project** — this needs a Supabase project to exist first, which only you can create (account-level action).
- **Onboarding page**: now dead code — its job got absorbed into `TripBuilder`. Not deleted, just unrouted from nav.
- **Deployment**: nothing has been deployed to Vercel yet — this is all running locally.

## Setup

See the data/API setup checklist for what accounts/keys to create first.

1. `cp backend/.env.example backend/.env` — fill in real values.
2. `cp frontend/.env.local.example frontend/.env.local` — fill in real values (public keys only, `VITE_` prefix).
3. Backend: `cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload`
4. Frontend: `cd frontend && npm install && npm run dev`
5. Try it: `http://localhost:5173/` — build a trip (any of 7 cities) → View full itinerary → Simulate a disruption → See recovery plans. Or jump straight to `/operator`.

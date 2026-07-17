# E2E tests (Nightwatch.js)

UI automation tests that drive the real app in a browser, exercising the same flows a user would.

## Prerequisites

- The app must already be running:
  - Backend: `cd backend && npm run start:dev` (port 8080)
  - Frontend: `cd frontend && npm run dev -- -p 3001` (port 3001)
- `AUTH_DISABLED=true` in `backend/.env` and `NEXT_PUBLIC_AUTH_DISABLED=true` in `frontend/.env.local` — tests navigate straight into the owner dashboard as the seeded dummy user, no login flow.
- **Microsoft Edge** installed (default — ships with Windows). Chrome works too if you'd rather use that (see below).

## Setup

```powershell
cd e2e
npm install
```

`npm install` downloads `msedgedriver` automatically (via the `postinstall` script) if Edge is found on your machine.

## Run

```powershell
npm test            # headless Edge (default)
npm run test:headed # Edge, visible browser window — useful while writing/debugging a test
npm run test:chrome # headless Chrome instead, if you have Chrome installed
```

Override the base URL if the frontend isn't on the default port:

```powershell
$env:E2E_BASE_URL = "http://localhost:3001"; npm test
```

## What's covered so far

`tests/property-management.js` — owner flow:
1. Add a new property through the 4-step wizard (Details → Pricing → Photos → Documents).
2. Edit that property's details from `/dashboard/properties` and confirm the change saved.

Verified passing end-to-end (12/12 assertions) against a live local stack.

Test data (property titles) is timestamped so repeated runs don't collide, but created properties aren't cleaned up automatically — safe to ignore in a dev DB, or delete manually:

```powershell
docker exec postgres psql -U postgres -d realestate -c "DELETE FROM properties WHERE title LIKE 'E2E Test Property%';"
```

## Adding more tests

Drop new spec files under `tests/`. Nightwatch picks up anything matching `*.js` in `src_folders` (see `nightwatch.conf.js`). Prefer targeting elements via `data-testid` attributes (add one to the component if it doesn't have one yet) over text/CSS selectors that can shift with styling changes.

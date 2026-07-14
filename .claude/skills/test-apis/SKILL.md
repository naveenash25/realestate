---
name: test-apis
description: Run the full backend API test suite (all 26 routes) against the running dev server. Use whenever asked to test the APIs, check what's working, or verify backend endpoints match what the UI actually calls.
---

# Testing this app's backend APIs

There is a single reusable script for this — **always use it instead of
writing one-off curl/Invoke-WebRequest calls**:

```powershell
cd backend; npm run test:api
```

(equivalent to `node backend/scripts/test-apis.js`)

## What it does

[backend/scripts/test-apis.js](../../backend/scripts/test-apis.js) exercises
every route mapped in the NestJS startup log (26 canonical routes, 29 test
cases counting a couple of extra assertions like a 404 check and pagination)
using the `NODE_ENV=development` `X-Dev-User` auth bypass
(`backend/src/auth/jwt-auth.guard.ts`) — no real Supabase JWTs needed. It
prints a PASS/FAIL table plus a summary line, and exits non-zero if anything
failed.

Each test case is tagged with a category:
- **core** — normal app functionality, expected to work end-to-end.
- **orphaned** — endpoint exists in the backend but no frontend code calls
  it (dead from the UI's perspective). Currently: `GET /pricing` (no
  `/pricing` page exists despite nav links to it), `GET /owners/me`, and all
  three `/auth/*` routes (the frontend talks to Supabase directly via
  `supabase-js`, never through these backend routes).
- **external-dep** — genuinely needs a real third-party credential this dev
  environment doesn't have (Supabase project, Razorpay keys, GCS service
  account) and is expected to fail for that reason, not because of a bug.
  Currently: `POST /wallet/recharge` (Razorpay), `POST /admin/mt/owners`
  (Supabase `auth.admin.createUser`), `POST /properties/:id/media/images`
  (not executed at all — needs a real multipart file + GCS creds), and the
  three orphaned `/auth/*` routes double as external-dep.

Each PASS/FAIL reflects what actually happened last run, not a hardcoded
guess — read the `note` column, it explains *why*.

## Prerequisites

The backend dev server must already be running (see the
[run-app](../run-app/SKILL.md) skill) — this script does not start it. It
also shells out to `docker exec postgres psql ...` for a few setup/cleanup
steps (creating and deleting a disposable "pending owner" fixture to test
`PUT /admin/owners/:id/verify`), so the `postgres` container from that skill
must be reachable too.

## Side effects (and how they're handled)

Most routes are read-only or self-cleaning, but a few genuinely mutate
shared demo data:

- **`POST /enquiries`** charges owner `a1`'s wallet for real (core lead
  ded uction business logic) — this is the point of the test, not a bug. It
  leaves `a1`'s `wallet_balance` and that property's `buffer_leads_used`
  permanently lower after each run.
- Property CRUD, MT-owner-created-property, and pending-owner-verify tests
  create their own disposable fixtures and delete/soft-delete them at the
  end of the same run — safe to re-run repeatedly.
- `PUT /admin/pricing/:id` reads the original price, changes it, then
  restores it — no lasting effect.

If demo numbers drift and you want them pristine again for a demo, reset
owner `a1` and remove the test enquiry:

```powershell
docker exec postgres psql -U postgres -d realestate -c "UPDATE owners SET wallet_balance = 8761.00 WHERE id = 'a1000000-0000-4000-8000-000000000001'; UPDATE properties SET buffer_leads_used = 0 WHERE owner_id = 'a1000000-0000-4000-8000-000000000001';"
docker exec postgres psql -U postgres -d realestate -c "DELETE FROM enquiries WHERE buyer_phone = '+919876500000';"
```

Or just re-run the full seed file (see run-app skill) to reset everything.

## Known bugs this test suite has already surfaced

- **`backend/.env` had `NODE_ENV=development'`** (stray trailing quote) —
  silently broke the entire dev-mode auth bypass, making every authenticated
  route 401 regardless of `X-Dev-User`. Fixed 2026-07-14.
- **`backend/src/properties/properties.service.ts`** selected a
  `p.cover_image` column that never existed in the schema. Fixed 2026-07-14
  (now derived via `LEFT JOIN LATERAL` against `property_media`).
- **`backend/src/owners/owners.service.ts` `register()`** calls
  `supabase.auth.admin.updateUserById()` but never checks its `{error}`
  return value — against a placeholder Supabase project this silently no-ops
  instead of surfacing an error, so the endpoint reports success even though
  the JWT `user_metadata` role stamp never actually happened. Not fixed —
  low severity in practice since `JwtStrategy.validate()` always re-reads
  the authoritative role from `users.role` in the DB rather than trusting
  the JWT claim (per CLAUDE.md's auth pattern), but worth fixing for
  production-correctness (either check the error or drop the call).

If you re-run this suite after a `git pull` and something that used to pass
now fails, that's a real regression worth investigating before assuming it's
another environment quirk.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

No-middleman real estate lead platform for India. Listing is free. Property owners pay per genuine buyer enquiry (prepaid wallet). No subscriptions. See `REQUIREMENTS.md` for full business rules and `ARCHITECTURE.md` for infrastructure and DB schema.

## Monorepo Structure

```
realestate/
├── frontend/      Next.js 14 + TypeScript (SSR for SEO)
├── backend/       NestJS (Node.js + TypeScript) API service
├── REQUIREMENTS.md
├── ARCHITECTURE.md
└── docker-compose.yml
```

## Commands

### Frontend (`frontend/`)
```bash
npm run dev          # dev server on :3000
npm run build        # production build
npm run lint         # ESLint
npm run type-check   # tsc --noEmit
```

### Backend (`backend/`)
```bash
npm run start:dev    # dev server with watch on :8080
npm run build        # compile TypeScript
npm run test         # Jest unit tests
npm run test:e2e     # end-to-end tests
npm run lint         # ESLint
```

### Docker (local full stack)
```bash
docker-compose up              # start all services
docker-compose up --build      # rebuild images
docker-compose down -v         # stop and remove volumes
```

### Database migrations (`backend/`)
```bash
npm run migration:run          # apply pending migrations
npm run migration:revert       # revert last migration
npm run migration:generate     # generate from entity changes
```

## Architecture Summary

**Service flow:**
```
Browser → Next.js (SSR) → NestJS API (/api/v1/) → PostgreSQL
                                                 → Redis (cache + BullMQ queue)
                                                 → Socket.io (real-time leads)
                                                 → MSG91 (SMS + WhatsApp via BullMQ)
```

**Phase 2 (not built yet):** NestJS → FastAPI ML service. The `MlProxyModule` stub is wired in Phase 1 — changing `ML_SERVICE_URL` env var activates it.

## Key Business Rules (implement exactly)

**Wallet state machine** — every property has `buffer_leads_used`:
- Wallet active (balance > 0): leads charged in real-time, no buffer used
- Wallet hits ₹0: buffer cycle starts, `buffer_leads_used` counts up to 3, no charge
- buffer_leads_used = 3 + wallet empty: property goes **hidden** from search
- Owner recharges: `buffer_leads_used` resets to 0, property visible, charges resume

**Lead deduction must be atomic** — use PostgreSQL row-level lock (`SELECT ... FOR UPDATE`) on `owners` row. Never deduct outside a transaction. See `ARCHITECTURE.md` → "Wallet deduction — atomicity".

**Lead pricing** — calculated at enquiry time from 3 factors: `location_tier × property_type × rera_status`. 54 rows in `lead_pricing` table. Never hardcode prices.

**Enquiry flow** — owner contact hidden until buyer submits form. On submit: save enquiry → deduct wallet (atomic) → emit `lead.created` event → Socket.io push to owner → BullMQ job → SMS + WhatsApp.

## NestJS Module Boundaries

Each module owns its DB tables. Cross-module calls go through service injection, never direct DB queries from another module's tables.

| Module | Owns |
|---|---|
| `AuthModule` | JWT validation, Supabase Auth integration |
| `OwnersModule` | `owners` table, wallet balance |
| `PropertiesModule` | `properties`, `property_media` tables |
| `EnquiriesModule` | `enquiries` table, orchestrates wallet deduction |
| `WalletModule` | `wallet_transactions` table, Razorpay webhooks |
| `PricingModule` | `lead_pricing` table |
| `NotificationsModule` | `notification_log` table, BullMQ jobs |
| `RealtimeModule` | Socket.io server |
| `AdminModule` | Read-only aggregation across modules |

## API Versioning

All backend routes: `/api/v1/`. When breaking changes are needed, add `/api/v2/` — never modify v1 responses.

## Auth Pattern

Supabase Auth issues JWTs. NestJS `JwtAuthGuard` validates against Supabase public key — no DB call per request. Role comes from JWT custom claim (`role`) and is double-checked against `users.role` for sensitive operations.

## Environment Variables

See `ARCHITECTURE.md` → "Environment Variables" for the full list. In development, copy `.env.example` to `.env`. Secrets in production come from GCP Secret Manager — never commit `.env` files.

## Database

- PostgreSQL 15 via TypeORM (backend)
- Run `npm run migration:run` before starting backend
- `pgvector` extension must be enabled on the DB: `CREATE EXTENSION IF NOT EXISTS vector;`
- The `embedding` column on `properties` is nullable — leave null in Phase 1

## Deployment

GCP Cloud Run for all services. CI/CD via GitHub Actions → Artifact Registry → Cloud Run rolling deploy. See `ARCHITECTURE.md` → "CI/CD Pipeline".

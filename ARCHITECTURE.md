# Architecture — Real Estate Lead Platform

## Service Overview

Three services, two phases:

```
Phase 1:
  Browser  →  Next.js Frontend  →  Node.js API  →  PostgreSQL
                                               →  Redis
                                               →  BullMQ (jobs)
                                               →  Socket.io (realtime)

Phase 2 addition:
  Node.js API  →  FastAPI ML Service  →  pgvector / Claude API
```

All services run as Docker containers on **GCP Cloud Run** — serverless, scales to zero, pay per request.

---

## Service Definitions

### 1. Next.js Frontend (`nextjs-frontend`)

- **Framework:** Next.js 14 + TypeScript, App Router
- **Styling:** Tailwind CSS + shadcn/ui
- **Rendering:** SSR for property listing and detail pages (SEO critical), CSR for dashboard
- **Communicates with:** Node.js API via REST over internal GCP VPC
- **Deployment:** GCP Cloud Run (or Vercel — same container)

**Key responsibilities:**
- Server-side render property pages for Google indexing
- Google OAuth (redirect to backend, which brokers via Keycloak) + Mobile OTP (Twilio WhatsApp, verified by backend)
- Real-time lead notifications on owner dashboard via Socket.io client
- GTM / Meta Pixel event firing on key user actions

### 2. Node.js API Service (`nodejs-api`)

- **Framework:** NestJS (Node.js + TypeScript)
- **API versioning:** All routes under `/api/v1/`
- **Deployment:** GCP Cloud Run, min instances = 1 (avoid cold start on API)

**NestJS Modules (Phase 1):**

```
AppModule
├── AuthModule          — Keycloak (Google OAuth) + Twilio WhatsApp (OTP) adapters; mints app session JWT
├── UsersModule         — user profiles, role management
├── OwnersModule        — owner verification, wallet balance
├── PropertiesModule    — CRUD, search, visibility logic
├── EnquiriesModule     — enquiry submission, lead deduction, contact reveal
├── WalletModule        — recharge, deduction, transaction log
├── NotificationsModule — BullMQ jobs → MSG91 SMS + WhatsApp
├── RealtimeModule      — Socket.io server, lead push to owner dashboard
├── PricingModule       — lead pricing matrix, price calculation
└── AdminModule         — owner verification queue, pricing config, stats
```

**Phase 2 addition (no changes to above modules):**
```
└── MlProxyModule       — HTTP calls to FastAPI ML service (stub in Phase 1)
```

### 3. FastAPI ML Service (`fastapi-ml`) — Phase 2 Only

- **Framework:** FastAPI (Python)
- **Deployment:** GCP Cloud Run, separate service
- **Called by:** Node.js API via internal HTTP

**Endpoints (Phase 2):**

| Endpoint | Purpose |
|---|---|
| `POST /ml/recommendations` | Similar properties via pgvector similarity search |
| `POST /ml/describe-property` | Auto-generate listing description (Claude API) |
| `POST /ml/score-lead` | Score buyer intent from enquiry + session data |
| `POST /ml/suggest-price` | Suggest lead price to admin based on demand |
| `POST /ml/chat` | Buyer chatbot with property context (Claude API) |

**Phase 1 stub:** Node.js `MlProxyModule` returns static defaults. Swapping to real FastAPI calls = change one config URL.

---

## Infrastructure (GCP)

```
GCP Project: realestate-prod
│
├── Cloud Run
│   ├── nextjs-frontend      (Next.js,  min 0, max 10)
│   ├── nodejs-api           (NestJS,   min 1, max 20)
│   └── fastapi-ml           (FastAPI,  Phase 2 only)
│
├── Cloud SQL (PostgreSQL 15)
│   └── postgres-main        (private VPC, no public IP)
│       └── pgvector extension installed, unused in Phase 1
│
├── Memorystore (Redis 7)
│   └── redis-main           (private VPC)
│       — OR — Upstash Redis (cheaper, pay-per-request, use until ~50k req/day)
│
├── Cloud Storage
│   └── property-media       (property images, public read)
│       └── served via Cloud CDN
│
├── Cloud CDN                (caches property images + static assets)
├── Cloud Armor              (WAF, rate limiting, DDoS protection)
├── Cloud Load Balancing     (routes to Cloud Run services)
├── Secret Manager           (DB URL, Redis URL, Razorpay keys, MSG91 keys, etc.)
├── Artifact Registry        (Docker images: nextjs, nodejs-api, fastapi-ml)
└── Cloud Logging            (centralised logs for all Cloud Run services)
```

**Networking:** Cloud SQL and Memorystore are on a private VPC. Cloud Run services connect via VPC connector — no public DB exposure.

**Cost levers:**
- Cloud Run scales to 0 when idle — no idle compute cost
- Cloud SQL `db-f1-micro` for early phase, upgrade online when needed
- Use Upstash Redis until sustained Redis load justifies Memorystore reserved instance (~₹3,500/month threshold)

---

## CI/CD Pipeline

```
GitHub
  └── main branch push
        │
        ▼
  GitHub Actions
  ├── Run tests (Jest for Node.js)
  ├── Build Docker image
  ├── Push to GCP Artifact Registry
  └── Deploy to Cloud Run (zero-downtime rolling update)
        │
        ▼
  Cloud Run (new revision live, old revision drains)
```

---

## Database Schema

### `users`
```sql
id            UUID PRIMARY KEY
phone         TEXT UNIQUE
email         TEXT UNIQUE NULLABLE
google_id     TEXT UNIQUE NULLABLE
role          ENUM('buyer', 'owner', 'admin', 'mt')
created_at    TIMESTAMPTZ
```

### `owners`
```sql
id                  UUID PRIMARY KEY REFERENCES users(id)
full_name           TEXT
id_document_url     TEXT        -- verification document
is_verified         BOOLEAN DEFAULT false
verified_at         TIMESTAMPTZ NULLABLE
verified_by         UUID NULLABLE REFERENCES users(id)
wallet_balance      NUMERIC(10,2) DEFAULT 0
created_at          TIMESTAMPTZ
```

### `properties`
```sql
id                  UUID PRIMARY KEY
owner_id            UUID REFERENCES owners(id)
title               TEXT
description         TEXT
location_address    TEXT
location_tier       ENUM('metro', 'tier1', 'nontier')
city                TEXT
state               TEXT
property_type       ENUM('plot','flat','villa_simplex','villa_duplex','villa_triplex','resort')
rera_status         ENUM('approved','non_approved','pre_launch')
rera_number         TEXT NULLABLE
price_value         NUMERIC(15,2)
is_verified         BOOLEAN DEFAULT false
is_active           BOOLEAN DEFAULT true
buffer_leads_used   INT DEFAULT 0       -- resets on each recharge
daily_lead_cap      INT DEFAULT 10
embedding           VECTOR(1536) NULLABLE  -- pgvector, Phase 2
listing_type        ENUM('sale','rent') DEFAULT 'sale'
listed_by           ENUM('individual','builder') DEFAULT 'individual'
bedrooms            INT NULLABLE
bathrooms           INT NULLABLE
area_sqft           NUMERIC(10,2) NULLABLE
project_name        TEXT NULLABLE
created_at          TIMESTAMPTZ
updated_at          TIMESTAMPTZ
```

### `property_media`
```sql
id            UUID PRIMARY KEY
property_id   UUID REFERENCES properties(id)
type          ENUM('image','instagram_reel','youtube')
url           TEXT
sort_order    INT
created_at    TIMESTAMPTZ
```

### `property_documents`
```sql
id              UUID PRIMARY KEY
property_id     UUID REFERENCES properties(id)
type            ENUM('ownership_deed','encumbrance_certificate','identity_proof','tax_receipt')
file_path       TEXT   -- private GCS object path, never a public URL
original_name   TEXT
mime_type       TEXT
size_bytes      INT
status          ENUM('pending','verified','rejected') DEFAULT 'pending'
verified_at     TIMESTAMPTZ NULLABLE
verified_by     UUID NULLABLE REFERENCES users(id)
created_at      TIMESTAMPTZ
UNIQUE(property_id, type)   -- one row per document type per property; re-upload is an upsert
```
Reads go through a fresh 15-minute signed GCS URL minted on request (`UploadService.getSignedReadUrl`), never a stored public link — these are ownership/identity documents (Aadhaar/PAN, sale deed), not property photos. Verification is currently owner-level only (see `owners.is_verified` cascade below); per-document admin review is not yet built — uploaded documents sit at `status='pending'`.

### `lead_pricing`
```sql
id              UUID PRIMARY KEY
location_tier   ENUM('metro','tier1','nontier')
property_type   ENUM('plot','flat','villa_simplex','villa_duplex','villa_triplex','resort')
rera_status     ENUM('approved','non_approved','pre_launch')
price           NUMERIC(8,2)
updated_at      TIMESTAMPTZ
UNIQUE(location_tier, property_type, rera_status)   -- 54 rows total
```

### `enquiries`
```sql
id              UUID PRIMARY KEY
property_id     UUID REFERENCES properties(id)
owner_id        UUID REFERENCES owners(id)
buyer_id        UUID REFERENCES users(id)
buyer_phone     TEXT
buyer_name      TEXT
lead_price      NUMERIC(8,2)
gst_amount      NUMERIC(8,2)
total_charged   NUMERIC(8,2)
is_buffer_lead  BOOLEAN DEFAULT false
created_at      TIMESTAMPTZ
```

### `wallet_transactions`
```sql
id              UUID PRIMARY KEY
owner_id        UUID REFERENCES owners(id)
type            ENUM('credit','debit')
amount          NUMERIC(10,2)
gst_amount      NUMERIC(8,2) NULLABLE
balance_after   NUMERIC(10,2)
ref_enquiry_id  UUID NULLABLE REFERENCES enquiries(id)
ref_razorpay_id TEXT NULLABLE
description     TEXT
created_at      TIMESTAMPTZ
```

### `daily_lead_caps`
> Handled inline on `properties.daily_lead_cap` + a daily reset counter:

```sql
-- separate table for daily tracking
property_daily_leads
  property_id   UUID REFERENCES properties(id)
  date          DATE
  leads_count   INT DEFAULT 0
  PRIMARY KEY (property_id, date)
```

### `notification_log`
```sql
id              UUID PRIMARY KEY
enquiry_id      UUID REFERENCES enquiries(id)
channel         ENUM('sms','whatsapp','dashboard')
status          ENUM('sent','failed','pending')
provider_ref    TEXT NULLABLE
created_at      TIMESTAMPTZ
```

---

## Key Technical Decisions

### Wallet deduction — atomicity
Wallet deduction uses a **PostgreSQL transaction with row-level lock** on the `owners` row:
```sql
BEGIN;
SELECT wallet_balance FROM owners WHERE id = $1 FOR UPDATE;
-- check balance >= lead_price
UPDATE owners SET wallet_balance = wallet_balance - $lead_price WHERE id = $1;
INSERT INTO wallet_transactions (...);
INSERT INTO enquiries (...);
COMMIT;
```
This prevents double-charging under concurrent enquiries on the same property.

### Buffer lead logic
`buffer_leads_used` on `properties` is incremented inside the same transaction as enquiry insert. When owner recharges, `buffer_leads_used` is reset to 0 in the same Razorpay webhook transaction.

### Real-time lead notification
1. Enquiry saved → Node.js emits internal NestJS event `lead.created`
2. `RealtimeModule` listens → emits via Socket.io to room `owner:{owner_id}`
3. Owner dashboard subscribes to that room — notification appears instantly
4. `NotificationsModule` also listens → enqueues BullMQ job → MSG91 SMS + WhatsApp

### Property search
Phase 1: PostgreSQL full-text search + indexed filters (`location_tier`, `property_type`, `rera_status`, `is_active`).  
Phase 2: If query performance degrades at scale, add Typesense or Elasticsearch with a sync worker.

### Auth flow
- Keycloak (self-hosted) brokers Google OAuth only — backend-initiated redirect (`kc_idp_hint=google` skips Keycloak's own login form); backend exchanges the code and reads Keycloak's userinfo endpoint (no local JWT verification of third-party tokens)
- Twilio WhatsApp sends OTP codes; the backend's own Redis-backed `OtpService` generates/hashes/verifies them — Keycloak is not involved in phone login
- Either path succeeds → `SessionService` mints the app's own JWT (HS256, `SESSION_JWT_SECRET`)
- NestJS `JwtAuthGuard`/`JwtStrategy` validate only this app-issued JWT — no third-party JWKS call per request
- Role is always re-read from `users.role` per request; the JWT's role claim is a hint only, never trusted alone
- Ports-and-adapters boundary (`IdentityBrokerProvider`, `OtpSenderProvider`) means swapping Keycloak or Twilio for another vendor later only touches an adapter class, not the guards, DB, or frontend

---

## API Contract (Phase 1 — Selected Endpoints)

```
POST   /api/v1/auth/google          — Google OAuth callback
POST   /api/v1/auth/otp/send        — Send OTP to phone
POST   /api/v1/auth/otp/verify      — Verify OTP, return JWT

GET    /api/v1/properties           — Search/list (public)
GET    /api/v1/properties/:id       — Property detail (public)
POST   /api/v1/properties           — Create listing (owner)
PUT    /api/v1/properties/:id       — Update listing (owner)
POST   /api/v1/properties/:id/documents         — Upload ownership documents (owner)
GET    /api/v1/properties/:id/documents         — List documents with fresh signed URLs (owner)
DELETE /api/v1/properties/:id/documents/:type   — Remove a document (owner)

POST   /api/v1/enquiries            — Submit enquiry (buyer, auth required)
GET    /api/v1/enquiries            — Owner's received leads (owner)

GET    /api/v1/wallet               — Owner wallet balance + transactions
POST   /api/v1/wallet/recharge      — Initiate Razorpay recharge
POST   /api/v1/wallet/webhook       — Razorpay payment webhook (internal)

GET    /api/v1/admin/owners/pending — Verification queue (admin)
PUT    /api/v1/admin/owners/:id/verify — Approve/reject owner (admin)
GET    /api/v1/admin/pricing        — Lead pricing matrix (admin)
PUT    /api/v1/admin/pricing/:id    — Update price point (admin)
```

---

## Phase 2 Upgrade Path (No Rewrites)

| Component | Phase 1 state | Phase 2 action |
|---|---|---|
| pgvector | Extension ON, `embedding` column NULL | Run backfill job to populate embeddings |
| MlProxyModule | Returns stub/default values | Change `ML_SERVICE_URL` env var to FastAPI URL |
| Socket.io | Handles Phase 1 load | Swap to Ably if concurrent connections exceed 10k |
| Redis | Upstash (pay-per-request) | Switch to Cloud Memorystore when cost tips over |
| BullMQ | SMS/WhatsApp jobs only | Add ML job types (`score-lead`, `describe-property`) |
| PostgreSQL search | Full-text + index | Add Typesense sync worker if search latency > 200ms |
| Cloud Run | Single region | Add multi-region + Cloud Load Balancer for 100k users |

---

## Environment Variables

```
# Database
DATABASE_URL=postgres://...

# Redis
REDIS_URL=redis://...

# Auth (Keycloak — Google OAuth brokering)
BACKEND_URL=
FRONTEND_URL=
KEYCLOAK_BASE_URL=
KEYCLOAK_REALM=
KEYCLOAK_BACKEND_CLIENT_ID=
KEYCLOAK_BACKEND_CLIENT_SECRET=
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=

# Auth (Twilio WhatsApp — OTP send only)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_FROM=
TWILIO_OTP_CONTENT_SID=

# App session (own JWT)
SESSION_JWT_SECRET=
SESSION_JWT_TTL_SECONDS=

# Payments
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

# Notifications
MSG91_AUTH_KEY=
MSG91_SENDER_ID=
WHATSAPP_BUSINESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=

# Storage
GCS_BUCKET_NAME=
GCS_SERVICE_ACCOUNT_KEY=

# ML (Phase 2)
ML_SERVICE_URL=http://stub   # replace with fastapi-ml Cloud Run URL in Phase 2

# App
NODE_ENV=production
PORT=8080
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_SOCKET_URL=
```

All secrets stored in **GCP Secret Manager** and injected as environment variables at Cloud Run deploy time.

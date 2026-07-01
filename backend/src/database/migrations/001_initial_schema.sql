-- Enable pgvector extension (Phase 2 will use it; install now, use later)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- Enums
CREATE TYPE user_role AS ENUM ('buyer', 'owner', 'admin', 'mt');
CREATE TYPE location_tier AS ENUM ('metro', 'tier1', 'nontier');
CREATE TYPE property_type AS ENUM ('plot', 'flat', 'villa_simplex', 'villa_duplex', 'villa_triplex', 'resort');
CREATE TYPE rera_status AS ENUM ('approved', 'non_approved', 'pre_launch');
CREATE TYPE media_type AS ENUM ('image', 'instagram_reel', 'youtube');
CREATE TYPE wallet_tx_type AS ENUM ('credit', 'debit');
CREATE TYPE notification_channel AS ENUM ('sms', 'whatsapp', 'dashboard');
CREATE TYPE notification_status AS ENUM ('sent', 'failed', 'pending');

-- Users
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone         TEXT UNIQUE,
  email         TEXT UNIQUE,
  google_id     TEXT UNIQUE,
  role          user_role NOT NULL DEFAULT 'buyer',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Owners (extends users)
CREATE TABLE owners (
  id                UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  full_name         TEXT NOT NULL,
  id_document_url   TEXT,
  is_verified       BOOLEAN NOT NULL DEFAULT false,
  verified_at       TIMESTAMPTZ,
  verified_by       UUID REFERENCES users(id),
  wallet_balance    NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (wallet_balance >= 0),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Properties
CREATE TABLE properties (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id          UUID NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  description       TEXT,
  location_address  TEXT NOT NULL,
  location_tier     location_tier NOT NULL,
  city              TEXT NOT NULL,
  state             TEXT NOT NULL,
  property_type     property_type NOT NULL,
  rera_status       rera_status NOT NULL,
  rera_number       TEXT,
  price_value       NUMERIC(15,2) NOT NULL CHECK (price_value >= 0),
  is_verified       BOOLEAN NOT NULL DEFAULT false,
  is_active         BOOLEAN NOT NULL DEFAULT true,
  buffer_leads_used INT NOT NULL DEFAULT 0 CHECK (buffer_leads_used >= 0 AND buffer_leads_used <= 3),
  daily_lead_cap    INT NOT NULL DEFAULT 10 CHECK (daily_lead_cap > 0),
  embedding         VECTOR(1536),  -- Phase 2: pgvector similarity search
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_properties_active ON properties (is_active, location_tier, property_type, rera_status);
CREATE INDEX idx_properties_owner ON properties (owner_id);

-- Property media
CREATE TABLE property_media (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id   UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  type          media_type NOT NULL,
  url           TEXT NOT NULL,
  sort_order    INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Lead pricing matrix (54 rows: 3 tiers × 6 types × 3 rera statuses)
CREATE TABLE lead_pricing (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_tier   location_tier NOT NULL,
  property_type   property_type NOT NULL,
  rera_status     rera_status NOT NULL,
  price           NUMERIC(8,2) NOT NULL CHECK (price >= 0),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (location_tier, property_type, rera_status)
);

-- Enquiries (immutable — never update, only insert)
CREATE TABLE enquiries (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id     UUID NOT NULL REFERENCES properties(id),
  owner_id        UUID NOT NULL REFERENCES owners(id),
  buyer_id        UUID NOT NULL REFERENCES users(id),
  buyer_phone     TEXT NOT NULL,
  buyer_name      TEXT NOT NULL,
  lead_price      NUMERIC(8,2) NOT NULL DEFAULT 0,
  gst_amount      NUMERIC(8,2) NOT NULL DEFAULT 0,
  total_charged   NUMERIC(8,2) NOT NULL DEFAULT 0,
  is_buffer_lead  BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_enquiries_owner ON enquiries (owner_id, created_at DESC);
CREATE INDEX idx_enquiries_property ON enquiries (property_id, created_at DESC);
CREATE INDEX idx_enquiries_date ON enquiries (property_id, created_at);

-- Wallet transactions
CREATE TABLE wallet_transactions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id        UUID NOT NULL REFERENCES owners(id),
  type            wallet_tx_type NOT NULL,
  amount          NUMERIC(10,2) NOT NULL,
  gst_amount      NUMERIC(8,2),
  balance_after   NUMERIC(10,2) NOT NULL,
  ref_enquiry_id  UUID REFERENCES enquiries(id),
  ref_razorpay_id TEXT,
  description     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wallet_tx_owner ON wallet_transactions (owner_id, created_at DESC);

-- Daily lead tracking (for daily cap enforcement)
CREATE TABLE property_daily_leads (
  property_id   UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  date          DATE NOT NULL DEFAULT CURRENT_DATE,
  leads_count   INT NOT NULL DEFAULT 0,
  PRIMARY KEY (property_id, date)
);

-- Notification log
CREATE TABLE notification_log (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enquiry_id      UUID NOT NULL REFERENCES enquiries(id),
  channel         notification_channel NOT NULL,
  status          notification_status NOT NULL DEFAULT 'pending',
  provider_ref    TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed lead pricing with placeholder values (admin updates actual prices)
INSERT INTO lead_pricing (location_tier, property_type, rera_status, price)
SELECT t.tier, pt.type, rs.status, 100.00
FROM (VALUES ('metro'::location_tier), ('tier1'), ('nontier')) AS t(tier)
CROSS JOIN (VALUES ('plot'::property_type), ('flat'), ('villa_simplex'), ('villa_duplex'), ('villa_triplex'), ('resort')) AS pt(type)
CROSS JOIN (VALUES ('approved'::rera_status), ('non_approved'), ('pre_launch')) AS rs(status);

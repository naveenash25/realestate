-- ============================================================
-- SAMPLE DATA — 4 Indian Cities
--   Hyderabad (metro, Telangana)
--   Pune      (metro, Maharashtra)
--   Jaipur    (tier1, Rajasthan)
--   Coimbatore(tier1, Tamil Nadu)
--
-- Run against a migrated database:
--   psql $DATABASE_URL -f backend/src/database/seeds/001_sample_data.sql
--
-- Safe to re-run — all inserts use ON CONFLICT DO NOTHING.
-- The lead_pricing UPDATE is idempotent.
--
-- UUID key:
--   ad000000-... = admin
--   b{n}000000-... = buyer users (n=1–3)
--   a{n}000000-... = owner users (n=1–8, 2 per city)
--   c{n}000000-... = properties  (n=1–a for HYD+Pune, d1-d5 for CBE)
--   cb–cf000000-... = Jaipur properties
--   e{n}000000-... = enquiries
--   f{n}000000-... = wallet transactions
--   m{n}000000-... = property_media
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. LEAD PRICING  (54 rows: 3 tiers × 6 types × 3 rera statuses)
--    Pricing logic: resort > villa_triplex > villa_duplex >
--                   villa_simplex > flat > plot
--                   approved > pre_launch > non_approved
--                   metro > tier1 > nontier (×0.65, ×0.45)
-- ─────────────────────────────────────────────────────────────
UPDATE lead_pricing SET price = CASE
  -- METRO ─────────────────────────────────────────────────────
  WHEN location_tier='metro'   AND property_type='plot'          AND rera_status='approved'     THEN  250.00
  WHEN location_tier='metro'   AND property_type='plot'          AND rera_status='pre_launch'   THEN  200.00
  WHEN location_tier='metro'   AND property_type='plot'          AND rera_status='non_approved' THEN  150.00
  WHEN location_tier='metro'   AND property_type='flat'          AND rera_status='approved'     THEN  350.00
  WHEN location_tier='metro'   AND property_type='flat'          AND rera_status='pre_launch'   THEN  280.00
  WHEN location_tier='metro'   AND property_type='flat'          AND rera_status='non_approved' THEN  200.00
  WHEN location_tier='metro'   AND property_type='villa_simplex' AND rera_status='approved'     THEN  450.00
  WHEN location_tier='metro'   AND property_type='villa_simplex' AND rera_status='pre_launch'   THEN  380.00
  WHEN location_tier='metro'   AND property_type='villa_simplex' AND rera_status='non_approved' THEN  280.00
  WHEN location_tier='metro'   AND property_type='villa_duplex'  AND rera_status='approved'     THEN  600.00
  WHEN location_tier='metro'   AND property_type='villa_duplex'  AND rera_status='pre_launch'   THEN  500.00
  WHEN location_tier='metro'   AND property_type='villa_duplex'  AND rera_status='non_approved' THEN  380.00
  WHEN location_tier='metro'   AND property_type='villa_triplex' AND rera_status='approved'     THEN  750.00
  WHEN location_tier='metro'   AND property_type='villa_triplex' AND rera_status='pre_launch'   THEN  620.00
  WHEN location_tier='metro'   AND property_type='villa_triplex' AND rera_status='non_approved' THEN  480.00
  WHEN location_tier='metro'   AND property_type='resort'        AND rera_status='approved'     THEN  900.00
  WHEN location_tier='metro'   AND property_type='resort'        AND rera_status='pre_launch'   THEN  750.00
  WHEN location_tier='metro'   AND property_type='resort'        AND rera_status='non_approved' THEN  600.00
  -- TIER1 ─────────────────────────────────────────────────────
  WHEN location_tier='tier1'   AND property_type='plot'          AND rera_status='approved'     THEN  160.00
  WHEN location_tier='tier1'   AND property_type='plot'          AND rera_status='pre_launch'   THEN  130.00
  WHEN location_tier='tier1'   AND property_type='plot'          AND rera_status='non_approved' THEN  100.00
  WHEN location_tier='tier1'   AND property_type='flat'          AND rera_status='approved'     THEN  230.00
  WHEN location_tier='tier1'   AND property_type='flat'          AND rera_status='pre_launch'   THEN  180.00
  WHEN location_tier='tier1'   AND property_type='flat'          AND rera_status='non_approved' THEN  130.00
  WHEN location_tier='tier1'   AND property_type='villa_simplex' AND rera_status='approved'     THEN  300.00
  WHEN location_tier='tier1'   AND property_type='villa_simplex' AND rera_status='pre_launch'   THEN  250.00
  WHEN location_tier='tier1'   AND property_type='villa_simplex' AND rera_status='non_approved' THEN  180.00
  WHEN location_tier='tier1'   AND property_type='villa_duplex'  AND rera_status='approved'     THEN  400.00
  WHEN location_tier='tier1'   AND property_type='villa_duplex'  AND rera_status='pre_launch'   THEN  330.00
  WHEN location_tier='tier1'   AND property_type='villa_duplex'  AND rera_status='non_approved' THEN  250.00
  WHEN location_tier='tier1'   AND property_type='villa_triplex' AND rera_status='approved'     THEN  500.00
  WHEN location_tier='tier1'   AND property_type='villa_triplex' AND rera_status='pre_launch'   THEN  420.00
  WHEN location_tier='tier1'   AND property_type='villa_triplex' AND rera_status='non_approved' THEN  320.00
  WHEN location_tier='tier1'   AND property_type='resort'        AND rera_status='approved'     THEN  620.00
  WHEN location_tier='tier1'   AND property_type='resort'        AND rera_status='pre_launch'   THEN  510.00
  WHEN location_tier='tier1'   AND property_type='resort'        AND rera_status='non_approved' THEN  400.00
  -- NONTIER ───────────────────────────────────────────────────
  WHEN location_tier='nontier' AND property_type='plot'          AND rera_status='approved'     THEN  120.00
  WHEN location_tier='nontier' AND property_type='plot'          AND rera_status='pre_launch'   THEN   95.00
  WHEN location_tier='nontier' AND property_type='plot'          AND rera_status='non_approved' THEN   75.00
  WHEN location_tier='nontier' AND property_type='flat'          AND rera_status='approved'     THEN  160.00
  WHEN location_tier='nontier' AND property_type='flat'          AND rera_status='pre_launch'   THEN  130.00
  WHEN location_tier='nontier' AND property_type='flat'          AND rera_status='non_approved' THEN   95.00
  WHEN location_tier='nontier' AND property_type='villa_simplex' AND rera_status='approved'     THEN  200.00
  WHEN location_tier='nontier' AND property_type='villa_simplex' AND rera_status='pre_launch'   THEN  170.00
  WHEN location_tier='nontier' AND property_type='villa_simplex' AND rera_status='non_approved' THEN  120.00
  WHEN location_tier='nontier' AND property_type='villa_duplex'  AND rera_status='approved'     THEN  280.00
  WHEN location_tier='nontier' AND property_type='villa_duplex'  AND rera_status='pre_launch'   THEN  230.00
  WHEN location_tier='nontier' AND property_type='villa_duplex'  AND rera_status='non_approved' THEN  170.00
  WHEN location_tier='nontier' AND property_type='villa_triplex' AND rera_status='approved'     THEN  350.00
  WHEN location_tier='nontier' AND property_type='villa_triplex' AND rera_status='pre_launch'   THEN  290.00
  WHEN location_tier='nontier' AND property_type='villa_triplex' AND rera_status='non_approved' THEN  220.00
  WHEN location_tier='nontier' AND property_type='resort'        AND rera_status='approved'     THEN  430.00
  WHEN location_tier='nontier' AND property_type='resort'        AND rera_status='pre_launch'   THEN  360.00
  WHEN location_tier='nontier' AND property_type='resort'        AND rera_status='non_approved' THEN  280.00
  ELSE price
END,
updated_at = NOW();

-- ─────────────────────────────────────────────────────────────
-- 2. ADMIN USER
-- ─────────────────────────────────────────────────────────────
INSERT INTO users (id, email, role, created_at) VALUES
  ('ad000000-0000-4000-8000-000000000001', 'admin@realestate.app', 'admin', '2026-01-01 00:00:00+05:30')
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- 3. BUYER USERS  (no owner profile — just enquire on properties)
-- ─────────────────────────────────────────────────────────────
INSERT INTO users (id, phone, email, role, created_at) VALUES
  ('b1000000-0000-4000-8000-000000000001', '+919876501001', 'rahul.sharma@gmail.com', 'buyer', '2026-03-10 09:00:00+05:30'),
  ('b2000000-0000-4000-8000-000000000002', '+919876501002', 'priya.reddy@gmail.com',  'buyer', '2026-03-15 11:00:00+05:30'),
  ('b3000000-0000-4000-8000-000000000003', '+919876501003', 'arun.kumar@gmail.com',   'buyer', '2026-04-02 10:00:00+05:30')
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- 4. OWNER USERS  (2 per city × 4 cities = 8 owners)
-- ─────────────────────────────────────────────────────────────
INSERT INTO users (id, phone, email, role, created_at) VALUES
  -- Hyderabad
  ('a1000000-0000-4000-8000-000000000001', '+919876502001', 'venkat.rao.hyd@gmail.com',    'owner', '2026-01-15 10:00:00+05:30'),
  ('a2000000-0000-4000-8000-000000000002', '+919876502002', 'kavitha.reddy.hyd@gmail.com', 'owner', '2026-01-20 11:00:00+05:30'),
  -- Pune
  ('a3000000-0000-4000-8000-000000000003', '+919876502003', 'suresh.desai.pun@gmail.com',  'owner', '2026-02-01 09:00:00+05:30'),
  ('a4000000-0000-4000-8000-000000000004', '+919876502004', 'anita.joshi.pun@gmail.com',   'owner', '2026-02-10 14:00:00+05:30'),
  -- Jaipur
  ('a5000000-0000-4000-8000-000000000005', '+919876502005', 'rajesh.sharma.jai@gmail.com', 'owner', '2026-02-15 10:00:00+05:30'),
  ('a6000000-0000-4000-8000-000000000006', '+919876502006', 'sunita.meena.jai@gmail.com',  'owner', '2026-02-20 15:00:00+05:30'),
  -- Coimbatore
  ('a7000000-0000-4000-8000-000000000007', '+919876502007', 'murugan.rajan.cbe@gmail.com', 'owner', '2026-03-01 09:00:00+05:30'),
  ('a8000000-0000-4000-8000-000000000008', '+919876502008', 'lakshmi.sub.cbe@gmail.com',   'owner', '2026-03-05 10:00:00+05:30')
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- 5. OWNERS  (wallet_balance = initial credit − charges recorded below)
--
--   o1 Venkat Rao         HYD  ₹10 000 credit − 3×₹413 = ₹8 761.00
--   o2 Kavitha Reddy      HYD  ₹5 000  credit − 2×₹708 = ₹3 584.00
--   o3 Suresh Desai       Pune ₹8 000  credit − 2×₹413 = ₹7 174.00
--   o4 Anita Joshi        Pune ₹2 000  credit − 2×₹708 = ₹  584.00 (low!)
--   o5 Rajesh Sharma      Jai  ₹5 000  credit − 2×₹271.40 = ₹4 457.20
--   o6 Sunita Meena       Jai  ₹354    credit − 1×₹354 = ₹0 (buffer mode)
--   o7 Murugan Rajan      CBE  ₹6 000  credit − 1×₹271.40 = ₹5 728.60
--   o8 Lakshmi Subramaniam CBE ₹3 000  credit − 1×₹354 = ₹2 646.00
-- ─────────────────────────────────────────────────────────────
INSERT INTO owners (id, full_name, is_verified, verified_at, verified_by, wallet_balance, created_at) VALUES
  ('a1000000-0000-4000-8000-000000000001', 'Venkat Rao',           true, '2026-01-16 10:00:00+05:30', 'ad000000-0000-4000-8000-000000000001', 8761.00, '2026-01-15 10:00:00+05:30'),
  ('a2000000-0000-4000-8000-000000000002', 'Kavitha Reddy',        true, '2026-01-21 10:00:00+05:30', 'ad000000-0000-4000-8000-000000000001', 3584.00, '2026-01-20 11:00:00+05:30'),
  ('a3000000-0000-4000-8000-000000000003', 'Suresh Desai',         true, '2026-02-02 09:00:00+05:30', 'ad000000-0000-4000-8000-000000000001', 7174.00, '2026-02-01 09:00:00+05:30'),
  ('a4000000-0000-4000-8000-000000000004', 'Anita Joshi',          true, '2026-02-11 14:00:00+05:30', 'ad000000-0000-4000-8000-000000000001',  584.00, '2026-02-10 14:00:00+05:30'),
  ('a5000000-0000-4000-8000-000000000005', 'Rajesh Sharma',        true, '2026-02-16 10:00:00+05:30', 'ad000000-0000-4000-8000-000000000001', 4457.20, '2026-02-15 10:00:00+05:30'),
  ('a6000000-0000-4000-8000-000000000006', 'Sunita Meena',         true, '2026-02-21 15:00:00+05:30', 'ad000000-0000-4000-8000-000000000001',    0.00, '2026-02-20 15:00:00+05:30'),
  ('a7000000-0000-4000-8000-000000000007', 'Murugan Rajan',        true, '2026-03-02 09:00:00+05:30', 'ad000000-0000-4000-8000-000000000001', 5728.60, '2026-03-01 09:00:00+05:30'),
  ('a8000000-0000-4000-8000-000000000008', 'Lakshmi Subramaniam',  true, '2026-03-06 10:00:00+05:30', 'ad000000-0000-4000-8000-000000000001', 2646.00, '2026-03-05 10:00:00+05:30')
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- 6. PROPERTIES — HYDERABAD (metro, Telangana)
--    RERA numbers: Telangana RERA uses P024XXXXXXXXX format
-- ─────────────────────────────────────────────────────────────
INSERT INTO properties (
  id, owner_id,
  title, description, location_address,
  location_tier, city, state,
  property_type, rera_status, rera_number,
  price_value, is_verified, is_active,
  buffer_leads_used, daily_lead_cap,
  created_at, updated_at
) VALUES
(
  'c1000000-0000-4000-8000-000000000001',
  'a1000000-0000-4000-8000-000000000001',
  '3BHK Flat in Gachibowli — IT Corridor',
  'Well-lit 3BHK flat on the 8th floor in a gated township, Gachibowli. Vitrified tile flooring, modular kitchen, 3 full bathrooms, and east-facing balcony. Society amenities: swimming pool, gym, 24×7 security. 10 min drive from HITEC City.',
  'Aparna Towers, Gachibowli, Hyderabad, Telangana 500032',
  'metro', 'Hyderabad', 'Telangana',
  'flat', 'approved', 'P02400001234',
  8500000.00, true, true, 0, 10,
  '2026-03-20 10:00:00+05:30', '2026-03-20 10:00:00+05:30'
),
(
  'c2000000-0000-4000-8000-000000000002',
  'a1000000-0000-4000-8000-000000000001',
  '2BHK Apartment near Wipro Circle — Kondapur',
  'Compact 2BHK on the 4th floor in Kondapur close to Wipro Circle. Vastu-compliant layout, two attached bathrooms, covered parking, power backup. Ready to move — no brokerage.',
  'Sai Madhuri Residency, Kondapur, Hyderabad, Telangana 500084',
  'metro', 'Hyderabad', 'Telangana',
  'flat', 'approved', 'P02400001235',
  5500000.00, true, true, 0, 10,
  '2026-03-22 11:00:00+05:30', '2026-03-22 11:00:00+05:30'
),
(
  'c3000000-0000-4000-8000-000000000003',
  'a2000000-0000-4000-8000-000000000002',
  '4BHK Luxury Villa Duplex — Jubilee Hills',
  'Premium 4BHK villa duplex in Jubilee Hills. Ground-floor master suite, double-height living room, private terrace garden, basement parking for 3 cars. Italian marble flooring, smart home automation. Low-density gated community — only 18 villas.',
  'Green Valley Villas, Road No. 12, Jubilee Hills, Hyderabad, Telangana 500033',
  'metro', 'Hyderabad', 'Telangana',
  'villa_duplex', 'approved', 'P02400002100',
  22000000.00, true, true, 0, 5,
  '2026-03-25 09:30:00+05:30', '2026-03-25 09:30:00+05:30'
),
(
  'c4000000-0000-4000-8000-000000000004',
  'a2000000-0000-4000-8000-000000000002',
  '200 sq yd East-Facing Plot near ORR — Narsingi',
  'East-facing residential plot of 200 sq yards near the Narsingi ORR exit. GHMC-approved layout, asphalt road access, underground water supply, street lighting. Ideal for self-construction or long-term investment.',
  'Moodforsberg Township, Narsingi, Hyderabad, Telangana 500075',
  'metro', 'Hyderabad', 'Telangana',
  'plot', 'non_approved', NULL,
  6500000.00, true, true, 0, 15,
  '2026-04-01 10:00:00+05:30', '2026-04-01 10:00:00+05:30'
),
(
  'c5000000-0000-4000-8000-000000000005',
  'a1000000-0000-4000-8000-000000000001',
  'Pre-Launch 3BHK Villa Simplex — Manikonda',
  'Contemporary 3BHK villa simplex in a pre-launch project by Vasavi Group, Manikonda. Open kitchen with island counter, private rear garden, 2-car stilt parking. RERA registration under process. Expected possession December 2026.',
  'Vasavi Vistas, Manikonda, Hyderabad, Telangana 500089',
  'metro', 'Hyderabad', 'Telangana',
  'villa_simplex', 'pre_launch', NULL,
  9500000.00, false, true, 0, 10,
  '2026-04-05 14:00:00+05:30', '2026-04-05 14:00:00+05:30'
)
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- 7. PROPERTIES — PUNE (metro, Maharashtra)
--    RERA numbers: MahaRERA uses P52100XXXXXX format
-- ─────────────────────────────────────────────────────────────
INSERT INTO properties (
  id, owner_id,
  title, description, location_address,
  location_tier, city, state,
  property_type, rera_status, rera_number,
  price_value, is_verified, is_active,
  buffer_leads_used, daily_lead_cap,
  created_at, updated_at
) VALUES
(
  'c6000000-0000-4000-8000-000000000006',
  'a3000000-0000-4000-8000-000000000003',
  '2BHK IT Corridor Apartment — Hinjewadi Phase 3',
  'RERA-registered 2BHK in Megapolis Smart Homes, Hinjewadi Phase 3. Vastu-compliant layout, covered parking, rainwater harvesting. Walking distance from Wipro and Infosys campuses.',
  'Megapolis Smart Homes, Hinjewadi Phase 3, Pune, Maharashtra 411057',
  'metro', 'Pune', 'Maharashtra',
  'flat', 'approved', 'P52100050001',
  6500000.00, true, true, 0, 10,
  '2026-03-28 10:00:00+05:30', '2026-03-28 10:00:00+05:30'
),
(
  'c7000000-0000-4000-8000-000000000007',
  'a3000000-0000-4000-8000-000000000003',
  '3BHK Premium Apartment in Baner — Rooftop Pool',
  'Luxuriously designed 3BHK in Central Avenue Towers, Baner. Spacious 1,450 sq ft carpet area, modular kitchen, designer bathrooms, north-facing balcony. Club amenities: rooftop infinity pool, squash court, co-working lounge.',
  'Central Avenue Towers, Baner, Pune, Maharashtra 411045',
  'metro', 'Pune', 'Maharashtra',
  'flat', 'approved', 'P52100050002',
  9000000.00, true, true, 0, 10,
  '2026-03-30 11:30:00+05:30', '2026-03-30 11:30:00+05:30'
),
(
  'c8000000-0000-4000-8000-000000000008',
  'a4000000-0000-4000-8000-000000000004',
  '4BHK Villa Duplex in Koregaon Park — Private Pool',
  'Exclusive 4BHK villa duplex in Koregaon Park, Pune''s most premium address. RERA approved. Private pool, Jacuzzi, home theatre pit, landscaped garden. Minutes from MG Road and Pune Airport.',
  'North Main Road, Koregaon Park, Pune, Maharashtra 411001',
  'metro', 'Pune', 'Maharashtra',
  'villa_duplex', 'approved', 'P52100060001',
  25000000.00, true, true, 0, 5,
  '2026-04-02 09:00:00+05:30', '2026-04-02 09:00:00+05:30'
),
(
  'c9000000-0000-4000-8000-000000000009',
  'a4000000-0000-4000-8000-000000000004',
  'PMRDA-Approved NA Plot — Hadapsar, Magarpatta',
  'PMRDA-approved NA residential plot in SkyVille Township, Hadapsar, near Magarpatta City. Corner plot with 3-side road access, immediate possession. Suitable for row-house or independent bungalow construction.',
  'SkyVille Township, Hadapsar, Pune, Maharashtra 411028',
  'metro', 'Pune', 'Maharashtra',
  'plot', 'non_approved', NULL,
  4000000.00, true, true, 0, 15,
  '2026-04-05 10:00:00+05:30', '2026-04-05 10:00:00+05:30'
),
(
  'ca000000-0000-4000-8000-00000000000a',
  'a3000000-0000-4000-8000-000000000003',
  '3BHK Ready Villa Simplex — Wakad',
  'Move-in-ready 3BHK villa simplex by Pride Purple Group in Wakad. Italian marble foyer, wide-plank hardwood flooring in bedrooms, wraparound veranda. Minutes from Wakad Chowk and Pune-Mumbai Expressway.',
  'Pride Purple Park Xpress, Wakad, Pune, Maharashtra 411057',
  'metro', 'Pune', 'Maharashtra',
  'villa_simplex', 'approved', 'P52100050003',
  8500000.00, true, true, 0, 10,
  '2026-04-08 15:00:00+05:30', '2026-04-08 15:00:00+05:30'
)
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- 8. PROPERTIES — JAIPUR (tier1, Rajasthan)
--    RERA numbers: Rajasthan RERA uses RAJ/P/YYYY/XXXXX format
--
--    Note: cd000000 (C-Scheme villa) belongs to Sunita Meena (o6)
--    whose wallet is at ₹0 — buffer_leads_used = 1 (1 free lead used,
--    2 remaining before property goes hidden)
-- ─────────────────────────────────────────────────────────────
INSERT INTO properties (
  id, owner_id,
  title, description, location_address,
  location_tier, city, state,
  property_type, rera_status, rera_number,
  price_value, is_verified, is_active,
  buffer_leads_used, daily_lead_cap,
  created_at, updated_at
) VALUES
(
  'cb000000-0000-4000-8000-00000000000b',
  'a5000000-0000-4000-8000-000000000005',
  '2BHK Flat in Mansarovar Sector 9 — Ready Possession',
  'Modern 2BHK flat in Rajdarshan Complex, Mansarovar Sector 9. East-facing, 1,050 sq ft super area, vitrified tiles, modular kitchen, two bathrooms. JDA-approved layout, ready for immediate possession.',
  'Rajdarshan Complex, Sector 9, Mansarovar, Jaipur, Rajasthan 302020',
  'tier1', 'Jaipur', 'Rajasthan',
  'flat', 'approved', 'RAJ/P/2024/00123',
  3800000.00, true, true, 0, 10,
  '2026-04-01 10:00:00+05:30', '2026-04-01 10:00:00+05:30'
),
(
  'cc000000-0000-4000-8000-00000000000c',
  'a5000000-0000-4000-8000-000000000005',
  '3BHK Apartment in Vaishali Nagar Extension',
  'Elegant 3BHK in Parth Aangan, Vaishali Nagar Extension. Wooden flooring in master bedroom, designer tiles in bathrooms. Building amenities: lift, generator backup, CCTV. 5 min from Pink City Mall.',
  'Parth Aangan, Vaishali Nagar Extension, Jaipur, Rajasthan 302021',
  'tier1', 'Jaipur', 'Rajasthan',
  'flat', 'approved', 'RAJ/P/2024/00124',
  5200000.00, true, true, 0, 10,
  '2026-04-03 11:00:00+05:30', '2026-04-03 11:00:00+05:30'
),
(
  'cd000000-0000-4000-8000-00000000000d',
  'a6000000-0000-4000-8000-000000000006',
  '3BHK Villa Simplex in C-Scheme — Posh Locality',
  'Beautifully crafted 3BHK villa simplex in posh C-Scheme locality. Independent unit with private garden, Rajasthani stone and contemporary fusion design, 2-car garage. Walking distance from Gaurav Tower and MI Road.',
  'Subhash Marg, C-Scheme, Jaipur, Rajasthan 302001',
  'tier1', 'Jaipur', 'Rajasthan',
  'villa_simplex', 'approved', 'RAJ/P/2024/00456',
  7500000.00, true, true,
  1,  -- 1 buffer lead used; owner wallet at ₹0 (2 free leads remaining before hidden)
  10,
  '2026-04-06 09:30:00+05:30', '2026-05-24 09:00:00+05:30'
),
(
  'ce000000-0000-4000-8000-00000000000e',
  'a6000000-0000-4000-8000-000000000006',
  '162 sq yd Plot near Jagatpura Metro Station',
  'JDA-sanctioned residential plot of 162 sq yards in Jagatpura Housing Board Colony. All utilities connected — electricity, water, sewer. Motorable road in gated lane. Adjacent to Jagatpura Metro Station.',
  'Housing Board Colony, Jagatpura, Jaipur, Rajasthan 302017',
  'tier1', 'Jaipur', 'Rajasthan',
  'plot', 'non_approved', NULL,
  2200000.00, false, true, 0, 15,
  '2026-04-10 14:00:00+05:30', '2026-04-10 14:00:00+05:30'
),
(
  'cf000000-0000-4000-8000-00000000000f',
  'a5000000-0000-4000-8000-000000000005',
  'Pre-Launch 4BHK Villa Duplex — Malviya Nagar',
  'Pre-launch 4BHK villa duplex in Ashiana Housing boutique project, Malviya Nagar. Traditional Rajasthani jharokha façade with contemporary interiors. Rooftop terrace, private garden, 2-car parking. RERA under registration, possession Q1 2027.',
  'Ashiana Anmol, Malviya Nagar, Jaipur, Rajasthan 302017',
  'tier1', 'Jaipur', 'Rajasthan',
  'villa_duplex', 'pre_launch', NULL,
  11000000.00, true, true, 0, 5,
  '2026-04-12 10:00:00+05:30', '2026-04-12 10:00:00+05:30'
)
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- 9. PROPERTIES — COIMBATORE (tier1, Tamil Nadu)
--    RERA numbers: Tamil Nadu RERA uses TN/01/Building/XXXX/YYYY format
-- ─────────────────────────────────────────────────────────────
INSERT INTO properties (
  id, owner_id,
  title, description, location_address,
  location_tier, city, state,
  property_type, rera_status, rera_number,
  price_value, is_verified, is_active,
  buffer_leads_used, daily_lead_cap,
  created_at, updated_at
) VALUES
(
  'd1000000-0000-4000-8000-000000000010',
  'a7000000-0000-4000-8000-000000000007',
  '2BHK Flat in RS Puram — Well Maintained',
  'Well-maintained 2BHK flat on the 3rd floor of Srivari Residency, RS Puram. 5-year-old building, full power backup, covered parking, children''s play area. Prime location near Gandhipuram bus stand and RS Puram market.',
  'Srivari Residency, Nehru Street, RS Puram, Coimbatore, Tamil Nadu 641002',
  'tier1', 'Coimbatore', 'Tamil Nadu',
  'flat', 'approved', 'TN/01/Building/0071/2024',
  3500000.00, true, true, 0, 10,
  '2026-04-05 09:00:00+05:30', '2026-04-05 09:00:00+05:30'
),
(
  'd2000000-0000-4000-8000-000000000011',
  'a7000000-0000-4000-8000-000000000007',
  '3BHK Apartment in Peelamedu — Near Airport',
  'Spacious 3BHK in Vigneshwara Builders'' Citadel, Peelamedu. 1,380 sq ft carpet area, open kitchen, master bedroom with walk-in closet. Excellent connectivity to Coimbatore Airport and PSG Tech.',
  'Vigneshwara Citadel, Avinashi Road, Peelamedu, Coimbatore, Tamil Nadu 641004',
  'tier1', 'Coimbatore', 'Tamil Nadu',
  'flat', 'approved', 'TN/01/Building/0072/2024',
  4800000.00, true, true, 0, 10,
  '2026-04-07 11:00:00+05:30', '2026-04-07 11:00:00+05:30'
),
(
  'd3000000-0000-4000-8000-000000000012',
  'a8000000-0000-4000-8000-000000000008',
  '3BHK Villa Simplex — Saibaba Colony',
  'Architect-designed 3BHK villa simplex in serene Saibaba Colony. Teak wood main door, granite flooring throughout, lush private garden. Independent house on 1,200 sq ft plot, 2-car covered parking.',
  '14th Street, Saibaba Colony, Coimbatore, Tamil Nadu 641011',
  'tier1', 'Coimbatore', 'Tamil Nadu',
  'villa_simplex', 'approved', 'TN/01/Building/0150/2024',
  6500000.00, true, true, 0, 10,
  '2026-04-09 10:00:00+05:30', '2026-04-09 10:00:00+05:30'
),
(
  'd4000000-0000-4000-8000-000000000013',
  'a8000000-0000-4000-8000-000000000008',
  '1200 sq ft Residential Plot — NGEF Layout, Singanallur',
  'DTCP-approved residential plot of 1,200 sq ft in NGEF Layout, Singanallur. Tarred road, TNEB connection available, corporation water supply. Budget-friendly home construction plot. Near Singanallur bus terminus.',
  'NGEF Layout, Singanallur, Coimbatore, Tamil Nadu 641005',
  'tier1', 'Coimbatore', 'Tamil Nadu',
  'plot', 'non_approved', NULL,
  1800000.00, true, true, 0, 15,
  '2026-04-11 14:00:00+05:30', '2026-04-11 14:00:00+05:30'
),
(
  'd5000000-0000-4000-8000-000000000014',
  'a7000000-0000-4000-8000-000000000007',
  '5BHK Grand Villa Triplex — Race Course Road',
  'Grand 5BHK villa triplex in Coimbatore''s elite Race Course locality. 4,200 sq ft built-up on 2,400 sq ft plot. Heated plunge pool, home theatre, chef''s kitchen with island counter, open-to-sky atrium. Tamil Nadu RERA registered.',
  'Race Course Road, Coimbatore, Tamil Nadu 641018',
  'tier1', 'Coimbatore', 'Tamil Nadu',
  'villa_triplex', 'approved', 'TN/01/Building/0300/2024',
  18000000.00, true, true, 0, 5,
  '2026-04-14 09:00:00+05:30', '2026-04-14 09:00:00+05:30'
)
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- 10. COVER IMAGES — Unsplash placeholders for dev
--     These are reliable public CDN URLs; swap for GCS in prod.
-- ─────────────────────────────────────────────────────────────
UPDATE properties SET cover_image = CASE id
  -- Hyderabad
  WHEN 'c1000000-0000-4000-8000-000000000001' THEN 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80&auto=format&fit=crop'
  WHEN 'c2000000-0000-4000-8000-000000000002' THEN 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80&auto=format&fit=crop'
  WHEN 'c3000000-0000-4000-8000-000000000003' THEN 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80&auto=format&fit=crop'
  WHEN 'c4000000-0000-4000-8000-000000000004' THEN 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&q=80&auto=format&fit=crop'
  WHEN 'c5000000-0000-4000-8000-000000000005' THEN 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80&auto=format&fit=crop'
  -- Pune
  WHEN 'c6000000-0000-4000-8000-000000000006' THEN 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80&auto=format&fit=crop'
  WHEN 'c7000000-0000-4000-8000-000000000007' THEN 'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=800&q=80&auto=format&fit=crop'
  WHEN 'c8000000-0000-4000-8000-000000000008' THEN 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80&auto=format&fit=crop'
  WHEN 'c9000000-0000-4000-8000-000000000009' THEN 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80&auto=format&fit=crop'
  WHEN 'ca000000-0000-4000-8000-00000000000a' THEN 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80&auto=format&fit=crop'
  -- Jaipur
  WHEN 'cb000000-0000-4000-8000-00000000000b' THEN 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80&auto=format&fit=crop'
  WHEN 'cc000000-0000-4000-8000-00000000000c' THEN 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80&auto=format&fit=crop'
  WHEN 'cd000000-0000-4000-8000-00000000000d' THEN 'https://images.unsplash.com/photo-1561134643-668f9057cce4?w=800&q=80&auto=format&fit=crop'
  WHEN 'ce000000-0000-4000-8000-00000000000e' THEN 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&q=80&auto=format&fit=crop'
  WHEN 'cf000000-0000-4000-8000-00000000000f' THEN 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80&auto=format&fit=crop'
  -- Coimbatore
  WHEN 'd1000000-0000-4000-8000-000000000010' THEN 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80&auto=format&fit=crop'
  WHEN 'd2000000-0000-4000-8000-000000000011' THEN 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80&auto=format&fit=crop'
  WHEN 'd3000000-0000-4000-8000-000000000012' THEN 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80&auto=format&fit=crop'
  WHEN 'd4000000-0000-4000-8000-000000000013' THEN 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80&auto=format&fit=crop'
  WHEN 'd5000000-0000-4000-8000-000000000014' THEN 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80&auto=format&fit=crop'
  ELSE cover_image
END
WHERE id IN (
  'c1000000-0000-4000-8000-000000000001','c2000000-0000-4000-8000-000000000002',
  'c3000000-0000-4000-8000-000000000003','c4000000-0000-4000-8000-000000000004',
  'c5000000-0000-4000-8000-000000000005','c6000000-0000-4000-8000-000000000006',
  'c7000000-0000-4000-8000-000000000007','c8000000-0000-4000-8000-000000000008',
  'c9000000-0000-4000-8000-000000000009','ca000000-0000-4000-8000-00000000000a',
  'cb000000-0000-4000-8000-00000000000b','cc000000-0000-4000-8000-00000000000c',
  'cd000000-0000-4000-8000-00000000000d','ce000000-0000-4000-8000-00000000000e',
  'cf000000-0000-4000-8000-00000000000f','d1000000-0000-4000-8000-000000000010',
  'd2000000-0000-4000-8000-000000000011','d3000000-0000-4000-8000-000000000012',
  'd4000000-0000-4000-8000-000000000013','d5000000-0000-4000-8000-000000000014'
);

-- ─────────────────────────────────────────────────────────────
-- 11. PROPERTY MEDIA  (2–3 images per property)
--     GCS paths use the dev sample bucket — swap bucket name for prod.
-- ─────────────────────────────────────────────────────────────
INSERT INTO property_media (id, property_id, type, url, sort_order, created_at) VALUES

-- Hyderabad — Gachibowli 3BHK (c1)
('91000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000001', 'image', 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&q=80&auto=format&fit=crop', 0, '2026-03-20 10:05:00+05:30'),
('91000000-0000-4000-8000-000000000002', 'c1000000-0000-4000-8000-000000000001', 'image', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80&auto=format&fit=crop', 1, '2026-03-20 10:05:00+05:30'),
('91000000-0000-4000-8000-000000000003', 'c1000000-0000-4000-8000-000000000001', 'image', 'https://images.unsplash.com/photo-1416169607655-6f3b8dbbd2ed?w=1200&q=80&auto=format&fit=crop', 2, '2026-03-20 10:05:00+05:30'),

-- Hyderabad — Kondapur 2BHK (c2)
('91000000-0000-4000-8000-000000000004', 'c2000000-0000-4000-8000-000000000002', 'image', 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1200&q=80&auto=format&fit=crop', 0, '2026-03-22 11:05:00+05:30'),
('91000000-0000-4000-8000-000000000005', 'c2000000-0000-4000-8000-000000000002', 'image', 'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=1200&q=80&auto=format&fit=crop', 1, '2026-03-22 11:05:00+05:30'),

-- Hyderabad — Jubilee Hills Villa Duplex (c3)
('91000000-0000-4000-8000-000000000006', 'c3000000-0000-4000-8000-000000000003', 'image', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80&auto=format&fit=crop', 0, '2026-03-25 09:35:00+05:30'),
('91000000-0000-4000-8000-000000000007', 'c3000000-0000-4000-8000-000000000003', 'image', 'https://images.unsplash.com/photo-1575429198097-0414ec08e8cd?w=1200&q=80&auto=format&fit=crop', 1, '2026-03-25 09:35:00+05:30'),
('91000000-0000-4000-8000-000000000008', 'c3000000-0000-4000-8000-000000000003', 'image', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80&auto=format&fit=crop', 2, '2026-03-25 09:35:00+05:30'),

-- Hyderabad — Narsingi Plot (c4)
('91000000-0000-4000-8000-000000000009', 'c4000000-0000-4000-8000-000000000004', 'image', 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1200&q=80&auto=format&fit=crop', 0, '2026-04-01 10:05:00+05:30'),
('91000000-0000-4000-8000-00000000000a', 'c4000000-0000-4000-8000-000000000004', 'image', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80&auto=format&fit=crop', 1, '2026-04-01 10:05:00+05:30'),

-- Hyderabad — Manikonda Villa Simplex pre-launch (c5)
('91000000-0000-4000-8000-00000000000b', 'c5000000-0000-4000-8000-000000000005', 'image', 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200&q=80&auto=format&fit=crop', 0, '2026-04-05 14:05:00+05:30'),
('91000000-0000-4000-8000-00000000000c', 'c5000000-0000-4000-8000-000000000005', 'image', 'https://images.unsplash.com/photo-1560185127-6a7f4e33cc19?w=1200&q=80&auto=format&fit=crop', 1, '2026-04-05 14:05:00+05:30'),

-- Pune — Hinjewadi 2BHK (c6)
('92000000-0000-4000-8000-000000000001', 'c6000000-0000-4000-8000-000000000006', 'image', 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1200&q=80&auto=format&fit=crop', 0, '2026-03-28 10:05:00+05:30'),
('92000000-0000-4000-8000-000000000002', 'c6000000-0000-4000-8000-000000000006', 'image', 'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=1200&q=80&auto=format&fit=crop', 1, '2026-03-28 10:05:00+05:30'),

-- Pune — Baner 3BHK (c7)
('92000000-0000-4000-8000-000000000003', 'c7000000-0000-4000-8000-000000000007', 'image', 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&q=80&auto=format&fit=crop', 0, '2026-03-30 11:35:00+05:30'),
('92000000-0000-4000-8000-000000000004', 'c7000000-0000-4000-8000-000000000007', 'image', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80&auto=format&fit=crop', 1, '2026-03-30 11:35:00+05:30'),
('92000000-0000-4000-8000-000000000005', 'c7000000-0000-4000-8000-000000000007', 'image', 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200&q=80&auto=format&fit=crop', 2, '2026-03-30 11:35:00+05:30'),

-- Pune — Koregaon Park Villa Duplex (c8)
('92000000-0000-4000-8000-000000000006', 'c8000000-0000-4000-8000-000000000008', 'image', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80&auto=format&fit=crop', 0, '2026-04-02 09:05:00+05:30'),
('92000000-0000-4000-8000-000000000007', 'c8000000-0000-4000-8000-000000000008', 'image', 'https://images.unsplash.com/photo-1575429198097-0414ec08e8cd?w=1200&q=80&auto=format&fit=crop', 1, '2026-04-02 09:05:00+05:30'),
('92000000-0000-4000-8000-000000000008', 'c8000000-0000-4000-8000-000000000008', 'image', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80&auto=format&fit=crop', 2, '2026-04-02 09:05:00+05:30'),

-- Pune — Hadapsar Plot (c9)
('92000000-0000-4000-8000-000000000009', 'c9000000-0000-4000-8000-000000000009', 'image', 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1200&q=80&auto=format&fit=crop', 0, '2026-04-05 10:05:00+05:30'),

-- Pune — Wakad Villa Simplex (ca)
('92000000-0000-4000-8000-00000000000a', 'ca000000-0000-4000-8000-00000000000a', 'image', 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&q=80&auto=format&fit=crop', 0, '2026-04-08 15:05:00+05:30'),
('92000000-0000-4000-8000-00000000000b', 'ca000000-0000-4000-8000-00000000000a', 'image', 'https://images.unsplash.com/photo-1561134643-668f9057cce4?w=1200&q=80&auto=format&fit=crop', 1, '2026-04-08 15:05:00+05:30'),

-- Jaipur — Mansarovar 2BHK (cb)
('93000000-0000-4000-8000-000000000001', 'cb000000-0000-4000-8000-00000000000b', 'image', 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&q=80&auto=format&fit=crop', 0, '2026-04-01 10:05:00+05:30'),
('93000000-0000-4000-8000-000000000002', 'cb000000-0000-4000-8000-00000000000b', 'image', 'https://images.unsplash.com/photo-1560185127-6a7f4e33cc19?w=1200&q=80&auto=format&fit=crop', 1, '2026-04-01 10:05:00+05:30'),

-- Jaipur — Vaishali Nagar 3BHK (cc)
('93000000-0000-4000-8000-000000000003', 'cc000000-0000-4000-8000-00000000000c', 'image', 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1200&q=80&auto=format&fit=crop', 0, '2026-04-03 11:05:00+05:30'),
('93000000-0000-4000-8000-000000000004', 'cc000000-0000-4000-8000-00000000000c', 'image', 'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=1200&q=80&auto=format&fit=crop', 1, '2026-04-03 11:05:00+05:30'),
('93000000-0000-4000-8000-000000000005', 'cc000000-0000-4000-8000-00000000000c', 'image', 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200&q=80&auto=format&fit=crop', 2, '2026-04-03 11:05:00+05:30'),

-- Jaipur — C-Scheme Villa Simplex (cd)
('93000000-0000-4000-8000-000000000006', 'cd000000-0000-4000-8000-00000000000d', 'image', 'https://images.unsplash.com/photo-1561134643-668f9057cce4?w=1200&q=80&auto=format&fit=crop', 0, '2026-04-06 09:35:00+05:30'),
('93000000-0000-4000-8000-000000000007', 'cd000000-0000-4000-8000-00000000000d', 'image', 'https://images.unsplash.com/photo-1416169607655-6f3b8dbbd2ed?w=1200&q=80&auto=format&fit=crop', 1, '2026-04-06 09:35:00+05:30'),

-- Jaipur — Jagatpura Plot (ce)
('93000000-0000-4000-8000-000000000008', 'ce000000-0000-4000-8000-00000000000e', 'image', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80&auto=format&fit=crop', 0, '2026-04-10 14:05:00+05:30'),

-- Jaipur — Malviya Nagar Villa Duplex pre-launch (cf)
('93000000-0000-4000-8000-000000000009', 'cf000000-0000-4000-8000-00000000000f', 'image', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80&auto=format&fit=crop', 0, '2026-04-12 10:05:00+05:30'),
('93000000-0000-4000-8000-00000000000a', 'cf000000-0000-4000-8000-00000000000f', 'image', 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&q=80&auto=format&fit=crop', 1, '2026-04-12 10:05:00+05:30'),

-- Coimbatore — RS Puram 2BHK (d1)
('94000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000010', 'image', 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1200&q=80&auto=format&fit=crop', 0, '2026-04-05 09:05:00+05:30'),
('94000000-0000-4000-8000-000000000002', 'd1000000-0000-4000-8000-000000000010', 'image', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80&auto=format&fit=crop', 1, '2026-04-05 09:05:00+05:30'),

-- Coimbatore — Peelamedu 3BHK (d2)
('94000000-0000-4000-8000-000000000003', 'd2000000-0000-4000-8000-000000000011', 'image', 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&q=80&auto=format&fit=crop', 0, '2026-04-07 11:05:00+05:30'),
('94000000-0000-4000-8000-000000000004', 'd2000000-0000-4000-8000-000000000011', 'image', 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200&q=80&auto=format&fit=crop', 1, '2026-04-07 11:05:00+05:30'),

-- Coimbatore — Saibaba Colony Villa Simplex (d3)
('94000000-0000-4000-8000-000000000005', 'd3000000-0000-4000-8000-000000000012', 'image', 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200&q=80&auto=format&fit=crop', 0, '2026-04-09 10:05:00+05:30'),
('94000000-0000-4000-8000-000000000006', 'd3000000-0000-4000-8000-000000000012', 'image', 'https://images.unsplash.com/photo-1416169607655-6f3b8dbbd2ed?w=1200&q=80&auto=format&fit=crop', 1, '2026-04-09 10:05:00+05:30'),
('94000000-0000-4000-8000-000000000007', 'd3000000-0000-4000-8000-000000000012', 'image', 'https://images.unsplash.com/photo-1561134643-668f9057cce4?w=1200&q=80&auto=format&fit=crop', 2, '2026-04-09 10:05:00+05:30'),

-- Coimbatore — Singanallur Plot (d4)
('94000000-0000-4000-8000-000000000008', 'd4000000-0000-4000-8000-000000000013', 'image', 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1200&q=80&auto=format&fit=crop', 0, '2026-04-11 14:05:00+05:30'),

-- Coimbatore — Race Course Villa Triplex (d5)
('94000000-0000-4000-8000-000000000009', 'd5000000-0000-4000-8000-000000000014', 'image', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80&auto=format&fit=crop', 0, '2026-04-14 09:05:00+05:30'),
('94000000-0000-4000-8000-00000000000a', 'd5000000-0000-4000-8000-000000000014', 'image', 'https://images.unsplash.com/photo-1575429198097-0414ec08e8cd?w=1200&q=80&auto=format&fit=crop', 1, '2026-04-14 09:05:00+05:30'),
('94000000-0000-4000-8000-00000000000b', 'd5000000-0000-4000-8000-000000000014', 'image', 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&q=80&auto=format&fit=crop', 2, '2026-04-14 09:05:00+05:30')

ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- 11. WALLET TRANSACTIONS — INITIAL CREDITS  (via Razorpay)
--     Razorpay payment IDs are fictional (pay_ + 14 alphanumeric chars)
-- ─────────────────────────────────────────────────────────────
INSERT INTO wallet_transactions (id, owner_id, type, amount, gst_amount, balance_after, ref_razorpay_id, description, created_at) VALUES
  ('f0000001-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', 'credit', 10000.00, NULL, 10000.00, 'pay_OA4kJnMb7TiU9e', 'Wallet recharge via Razorpay', '2026-03-18 09:00:00+05:30'),
  ('f0000002-0000-4000-8000-000000000002', 'a2000000-0000-4000-8000-000000000002', 'credit',  5000.00, NULL,  5000.00, 'pay_OB5lKoNc8UjV0f', 'Wallet recharge via Razorpay', '2026-03-24 10:00:00+05:30'),
  ('f0000003-0000-4000-8000-000000000003', 'a3000000-0000-4000-8000-000000000003', 'credit',  8000.00, NULL,  8000.00, 'pay_OC6mLpOd9VkW1g', 'Wallet recharge via Razorpay', '2026-03-26 11:00:00+05:30'),
  ('f0000004-0000-4000-8000-000000000004', 'a4000000-0000-4000-8000-000000000004', 'credit',  2000.00, NULL,  2000.00, 'pay_OD7nMqPe0WlX2h', 'Wallet recharge via Razorpay', '2026-04-01 09:00:00+05:30'),
  ('f0000005-0000-4000-8000-000000000005', 'a5000000-0000-4000-8000-000000000005', 'credit',  5000.00, NULL,  5000.00, 'pay_OE8oNrQf1XmY3i', 'Wallet recharge via Razorpay', '2026-03-30 10:00:00+05:30'),
  ('f0000006-0000-4000-8000-000000000006', 'a6000000-0000-4000-8000-000000000006', 'credit',   354.00, NULL,   354.00, 'pay_OF9pOsRg2YnZ4j', 'Wallet recharge via Razorpay', '2026-04-04 14:00:00+05:30'),
  ('f0000007-0000-4000-8000-000000000007', 'a7000000-0000-4000-8000-000000000007', 'credit',  6000.00, NULL,  6000.00, 'pay_OG0qPtSh3ZoA5k', 'Wallet recharge via Razorpay', '2026-04-03 09:00:00+05:30'),
  ('f0000008-0000-4000-8000-000000000008', 'a8000000-0000-4000-8000-000000000008', 'credit',  3000.00, NULL,  3000.00, 'pay_OH1rQuTi4ApB6l', 'Wallet recharge via Razorpay', '2026-04-08 10:00:00+05:30')
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- 12. ENQUIRIES  (15 sample enquiries across all cities)
--
--     Lead price reference (from lead_pricing updated above):
--       metro  + flat          + approved  = ₹350  → +18% GST → ₹413 charged
--       metro  + villa_duplex  + approved  = ₹600  → +18% GST → ₹708 charged
--       tier1  + flat          + approved  = ₹230  → +18% GST → ₹271.40 charged
--       tier1  + villa_simplex + approved  = ₹300  → +18% GST → ₹354 charged (e12)
--       tier1  + villa_simplex + approved  = ₹300  → buffer lead, ₹0 charged (e13)
-- ─────────────────────────────────────────────────────────────
INSERT INTO enquiries (id, property_id, owner_id, buyer_id, buyer_name, buyer_phone, lead_price, gst_amount, total_charged, is_buffer_lead, created_at) VALUES

-- Hyderabad — Gachibowli 3BHK (c1, owner o1): 3 enquiries, all charged
('e1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000001', 'Rahul Sharma', '+919876501001', 350.00, 63.00, 413.00, false, '2026-05-18 09:15:00+05:30'),
('e2000000-0000-4000-8000-000000000002', 'c1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', 'b2000000-0000-4000-8000-000000000002', 'Priya Reddy',  '+919876501002', 350.00, 63.00, 413.00, false, '2026-05-18 14:30:00+05:30'),
('e3000000-0000-4000-8000-000000000003', 'c1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', 'b3000000-0000-4000-8000-000000000003', 'Arun Kumar',   '+919876501003', 350.00, 63.00, 413.00, false, '2026-05-19 11:00:00+05:30'),

-- Hyderabad — Jubilee Hills Villa Duplex (c3, owner o2): 2 enquiries, all charged
('e4000000-0000-4000-8000-000000000004', 'c3000000-0000-4000-8000-000000000003', 'a2000000-0000-4000-8000-000000000002', 'b1000000-0000-4000-8000-000000000001', 'Rahul Sharma', '+919876501001', 600.00, 108.00, 708.00, false, '2026-05-19 16:45:00+05:30'),
('e5000000-0000-4000-8000-000000000005', 'c3000000-0000-4000-8000-000000000003', 'a2000000-0000-4000-8000-000000000002', 'b2000000-0000-4000-8000-000000000002', 'Priya Reddy',  '+919876501002', 600.00, 108.00, 708.00, false, '2026-05-20 10:20:00+05:30'),

-- Pune — Hinjewadi 2BHK (c6, owner o3): 2 enquiries, all charged
('e6000000-0000-4000-8000-000000000006', 'c6000000-0000-4000-8000-000000000006', 'a3000000-0000-4000-8000-000000000003', 'b1000000-0000-4000-8000-000000000001', 'Rahul Sharma', '+919876501001', 350.00, 63.00, 413.00, false, '2026-05-20 13:00:00+05:30'),
('e7000000-0000-4000-8000-000000000007', 'c6000000-0000-4000-8000-000000000006', 'a3000000-0000-4000-8000-000000000003', 'b3000000-0000-4000-8000-000000000003', 'Arun Kumar',   '+919876501003', 350.00, 63.00, 413.00, false, '2026-05-21 09:30:00+05:30'),

-- Pune — Koregaon Park Villa Duplex (c8, owner o4): 2 enquiries, all charged
('e8000000-0000-4000-8000-000000000008', 'c8000000-0000-4000-8000-000000000008', 'a4000000-0000-4000-8000-000000000004', 'b1000000-0000-4000-8000-000000000001', 'Rahul Sharma', '+919876501001', 600.00, 108.00, 708.00, false, '2026-05-21 15:00:00+05:30'),
('e9000000-0000-4000-8000-000000000009', 'c8000000-0000-4000-8000-000000000008', 'a4000000-0000-4000-8000-000000000004', 'b2000000-0000-4000-8000-000000000002', 'Priya Reddy',  '+919876501002', 600.00, 108.00, 708.00, false, '2026-05-22 11:15:00+05:30'),

-- Jaipur — Mansarovar 2BHK (cb, owner o5): 2 enquiries, all charged
('ea000000-0000-4000-8000-00000000000a', 'cb000000-0000-4000-8000-00000000000b', 'a5000000-0000-4000-8000-000000000005', 'b1000000-0000-4000-8000-000000000001', 'Rahul Sharma', '+919876501001', 230.00, 41.40, 271.40, false, '2026-05-22 14:00:00+05:30'),
('eb000000-0000-4000-8000-00000000000b', 'cb000000-0000-4000-8000-00000000000b', 'a5000000-0000-4000-8000-000000000005', 'b2000000-0000-4000-8000-000000000002', 'Priya Reddy',  '+919876501002', 230.00, 41.40, 271.40, false, '2026-05-23 10:00:00+05:30'),

-- Jaipur — C-Scheme Villa Simplex (cd, owner o6 — wallet ₹354 → 0 then buffer)
('ec000000-0000-4000-8000-00000000000c', 'cd000000-0000-4000-8000-00000000000d', 'a6000000-0000-4000-8000-000000000006', 'b1000000-0000-4000-8000-000000000001', 'Rahul Sharma', '+919876501001', 300.00, 54.00, 354.00, false, '2026-05-23 16:30:00+05:30'),
('ed000000-0000-4000-8000-00000000000d', 'cd000000-0000-4000-8000-00000000000d', 'a6000000-0000-4000-8000-000000000006', 'b3000000-0000-4000-8000-000000000003', 'Arun Kumar',   '+919876501003', 300.00,  0.00,   0.00, true,  '2026-05-24 09:00:00+05:30'),

-- Coimbatore — RS Puram 2BHK (d1, owner o7): 1 enquiry, charged
('ee000000-0000-4000-8000-00000000000e', 'd1000000-0000-4000-8000-000000000010', 'a7000000-0000-4000-8000-000000000007', 'b1000000-0000-4000-8000-000000000001', 'Rahul Sharma', '+919876501001', 230.00, 41.40, 271.40, false, '2026-05-24 14:45:00+05:30'),

-- Coimbatore — Saibaba Colony Villa Simplex (d3, owner o8): 1 enquiry, charged
('ef000000-0000-4000-8000-00000000000f', 'd3000000-0000-4000-8000-000000000012', 'a8000000-0000-4000-8000-000000000008', 'b2000000-0000-4000-8000-000000000002', 'Priya Reddy',  '+919876501002', 300.00, 54.00, 354.00, false, '2026-05-25 10:30:00+05:30')

ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- 13. WALLET TRANSACTIONS — DEBITS  (one debit per charged enquiry)
--     balance_after = running balance after each deduction
-- ─────────────────────────────────────────────────────────────
INSERT INTO wallet_transactions (id, owner_id, type, amount, gst_amount, balance_after, ref_enquiry_id, description, created_at) VALUES

-- o1 (Venkat Rao, HYD): 10000 - 413 - 413 - 413 = 8761
('f0000010-0000-4000-8000-000000000010', 'a1000000-0000-4000-8000-000000000001', 'debit', 413.00, 63.00,  9587.00, 'e1000000-0000-4000-8000-000000000001', 'Lead charge: 3BHK Gachibowli flat', '2026-05-18 09:15:00+05:30'),
('f0000011-0000-4000-8000-000000000011', 'a1000000-0000-4000-8000-000000000001', 'debit', 413.00, 63.00,  9174.00, 'e2000000-0000-4000-8000-000000000002', 'Lead charge: 3BHK Gachibowli flat', '2026-05-18 14:30:00+05:30'),
('f0000012-0000-4000-8000-000000000012', 'a1000000-0000-4000-8000-000000000001', 'debit', 413.00, 63.00,  8761.00, 'e3000000-0000-4000-8000-000000000003', 'Lead charge: 3BHK Gachibowli flat', '2026-05-19 11:00:00+05:30'),

-- o2 (Kavitha Reddy, HYD): 5000 - 708 - 708 = 3584
('f0000013-0000-4000-8000-000000000013', 'a2000000-0000-4000-8000-000000000002', 'debit', 708.00, 108.00, 4292.00, 'e4000000-0000-4000-8000-000000000004', 'Lead charge: Jubilee Hills villa duplex', '2026-05-19 16:45:00+05:30'),
('f0000014-0000-4000-8000-000000000014', 'a2000000-0000-4000-8000-000000000002', 'debit', 708.00, 108.00, 3584.00, 'e5000000-0000-4000-8000-000000000005', 'Lead charge: Jubilee Hills villa duplex', '2026-05-20 10:20:00+05:30'),

-- o3 (Suresh Desai, Pune): 8000 - 413 - 413 = 7174
('f0000015-0000-4000-8000-000000000015', 'a3000000-0000-4000-8000-000000000003', 'debit', 413.00, 63.00,  7587.00, 'e6000000-0000-4000-8000-000000000006', 'Lead charge: Hinjewadi 2BHK flat',       '2026-05-20 13:00:00+05:30'),
('f0000016-0000-4000-8000-000000000016', 'a3000000-0000-4000-8000-000000000003', 'debit', 413.00, 63.00,  7174.00, 'e7000000-0000-4000-8000-000000000007', 'Lead charge: Hinjewadi 2BHK flat',       '2026-05-21 09:30:00+05:30'),

-- o4 (Anita Joshi, Pune): 2000 - 708 - 708 = 584
('f0000017-0000-4000-8000-000000000017', 'a4000000-0000-4000-8000-000000000004', 'debit', 708.00, 108.00, 1292.00, 'e8000000-0000-4000-8000-000000000008', 'Lead charge: Koregaon Park villa duplex', '2026-05-21 15:00:00+05:30'),
('f0000018-0000-4000-8000-000000000018', 'a4000000-0000-4000-8000-000000000004', 'debit', 708.00, 108.00,  584.00, 'e9000000-0000-4000-8000-000000000009', 'Lead charge: Koregaon Park villa duplex', '2026-05-22 11:15:00+05:30'),

-- o5 (Rajesh Sharma, Jaipur): 5000 - 271.40 - 271.40 = 4457.20
('f0000019-0000-4000-8000-000000000019', 'a5000000-0000-4000-8000-000000000005', 'debit', 271.40, 41.40,  4728.60, 'ea000000-0000-4000-8000-00000000000a', 'Lead charge: Mansarovar 2BHK flat',      '2026-05-22 14:00:00+05:30'),
('f000001a-0000-4000-8000-00000000001a', 'a5000000-0000-4000-8000-000000000005', 'debit', 271.40, 41.40,  4457.20, 'eb000000-0000-4000-8000-00000000000b', 'Lead charge: Mansarovar 2BHK flat',      '2026-05-23 10:00:00+05:30'),

-- o6 (Sunita Meena, Jaipur): 354 - 354 = 0 (next lead is buffer — no debit)
('f000001b-0000-4000-8000-00000000001b', 'a6000000-0000-4000-8000-000000000006', 'debit', 354.00, 54.00,     0.00, 'ec000000-0000-4000-8000-00000000000c', 'Lead charge: C-Scheme villa simplex',    '2026-05-23 16:30:00+05:30'),

-- o7 (Murugan Rajan, CBE): 6000 - 271.40 = 5728.60
('f000001c-0000-4000-8000-00000000001c', 'a7000000-0000-4000-8000-000000000007', 'debit', 271.40, 41.40,  5728.60, 'ee000000-0000-4000-8000-00000000000e', 'Lead charge: RS Puram 2BHK flat',        '2026-05-24 14:45:00+05:30'),

-- o8 (Lakshmi Subramaniam, CBE): 3000 - 354 = 2646
('f000001d-0000-4000-8000-00000000001d', 'a8000000-0000-4000-8000-000000000008', 'debit', 354.00, 54.00,  2646.00, 'ef000000-0000-4000-8000-00000000000f', 'Lead charge: Saibaba Colony villa',      '2026-05-25 10:30:00+05:30')

ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- 14. PROPERTY DAILY LEADS  (historical counts per date)
--     These reflect past enquiry dates, not today's cap state.
-- ─────────────────────────────────────────────────────────────
INSERT INTO property_daily_leads (property_id, date, leads_count) VALUES
  ('c1000000-0000-4000-8000-000000000001', '2026-05-18', 2),  -- e1 + e2
  ('c1000000-0000-4000-8000-000000000001', '2026-05-19', 1),  -- e3
  ('c3000000-0000-4000-8000-000000000003', '2026-05-19', 1),  -- e4
  ('c3000000-0000-4000-8000-000000000003', '2026-05-20', 1),  -- e5
  ('c6000000-0000-4000-8000-000000000006', '2026-05-20', 1),  -- e6
  ('c6000000-0000-4000-8000-000000000006', '2026-05-21', 1),  -- e7
  ('c8000000-0000-4000-8000-000000000008', '2026-05-21', 1),  -- e8
  ('c8000000-0000-4000-8000-000000000008', '2026-05-22', 1),  -- e9
  ('cb000000-0000-4000-8000-00000000000b', '2026-05-22', 1),  -- ea
  ('cb000000-0000-4000-8000-00000000000b', '2026-05-23', 1),  -- eb
  ('cd000000-0000-4000-8000-00000000000d', '2026-05-23', 1),  -- ec (charged)
  ('cd000000-0000-4000-8000-00000000000d', '2026-05-24', 1),  -- ed (buffer)
  ('d1000000-0000-4000-8000-000000000010', '2026-05-24', 1),  -- ee
  ('d3000000-0000-4000-8000-000000000012', '2026-05-25', 1)   -- ef
ON CONFLICT (property_id, date) DO UPDATE SET leads_count = EXCLUDED.leads_count;

-- ─────────────────────────────────────────────────────────────
-- SUMMARY
-- ─────────────────────────────────────────────────────────────
-- Users      : 12 total  (1 admin, 3 buyers, 8 owners)
-- Owners     : 8         (2 per city; all verified)
-- Properties : 20        (5 per city; varied types, RERA statuses)
-- Media      : 38        (2–3 images per property)
-- Enquiries  : 15        (14 charged + 1 buffer lead)
-- Wallet Tx  : 22        (8 credits + 14 debits)
--
-- Notable states for testing:
--   Anita Joshi (Pune, o4)   : wallet ₹584 — low balance warning scenario
--   Sunita Meena (Jaipur, o6): wallet ₹0, C-Scheme villa buffer_leads_used=1
--                               → property still visible (2 buffer leads left)
--   Manikonda villa (c5)     : pre-launch, is_verified=false (admin pending)
--   Jagatpura plot (ce)      : non_approved, is_verified=false (admin pending)
-- ─────────────────────────────────────────────────────────────

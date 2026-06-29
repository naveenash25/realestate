# Requirements — Real Estate Lead Platform

## Product Vision

A **no-middleman, direct-to-owner** real estate lead platform for India.  
Property listing is **free**. Owners pay **only per genuine buyer enquiry** — no subscription, no lock-in.  
Buyers get direct access to owners and can negotiate discounts without any broker.

**Differentiator vs NoBroker / 99acres:** No monthly subscription. Zero upfront cost to list. Owners pay only when buyers show interest.

---

## User Roles

### R1 — Buyer (Demand Side)

| # | Requirement |
|---|---|
| R1.1 | Buyer can browse and view property details without logging in |
| R1.2 | Login options: Google OAuth only OR Mobile OTP only (no email/password) |
| R1.3 | Buyer cannot see the property owner's contact details before submitting an enquiry |
| R1.4 | After login, buyer can submit an enquiry on any active property |
| R1.5 | After submitting enquiry, buyer's contact is shared with the owner |
| R1.6 | Every enquiry is recorded: buyer phone, property ID, timestamp, date |

### R2 — Property Owner (Supply Side)

| # | Requirement |
|---|---|
| R2.1 | Owner must be verified by platform staff before any listing goes live |
| R2.2 | Registration paths: (a) employee/rep with valid ID, (b) authorised candidate, (c) Management Trainee-assisted in early phase |
| R2.3 | One owner account can hold multiple property listings |
| R2.4 | Owner uses a prepaid wallet to receive leads beyond the free buffer |
| R2.5 | Minimum wallet recharge: ₹500 (until first 1,000 properties onboarded) |
| R2.6 | Owner receives lead notifications in real-time via (a) dashboard and (b) SMS + WhatsApp |
| R2.7 | Owner can only view incoming lead contact details if wallet has balance OR buffer leads remain |
| R2.8 | Owner sets a daily maximum lead cap per property |

### R3 — Platform Admin / Staff

| # | Requirement |
|---|---|
| R3.1 | Admin verifies property owner identity before activating their account |
| R3.2 | Management Trainees (MT) can register properties on behalf of owners during early phase |
| R3.3 | Initial phase: relaxed verification acceptable; tighten controls as platform scales |
| R3.4 | Admin configures the lead pricing matrix (location × property type × RERA status) |
| R3.5 | Admin can view platform-wide stats: total listings, leads, revenue, wallet balances |

---

## Property Listing Requirements

| # | Requirement |
|---|---|
| P1 | Each property can have up to 10 images |
| P2 | Videos: Instagram Reels URL or YouTube URL (no direct video upload in Phase 1) |
| P3 | Only verified owner properties are shown to buyers |
| P4 | Pre-launch properties: listed publicly but must display a **caution note** to buyers |
| P5 | Non-RERA approved properties: listed publicly but must display a **caution note** to buyers |
| P6 | RERA approval status must be captured per property |
| P7 | Property location tier (Metro / Tier 1 / Non-tier) must be captured and stored |
| P8 | Property type must be one of: Plot, Flat, Villa-Simplex, Villa-Duplex, Villa-Triplex, Resort |

---

## Lead Pricing Requirements

| # | Requirement |
|---|---|
| LP1 | Lead price is determined by 3 factors: **location tier × property type × RERA status** |
| LP2 | Every combination of the 3 factors has an independently configurable price |
| LP3 | Lead pricing is managed by admin in a pricing matrix table |
| LP4 | Lead price is calculated at the moment of enquiry submission, not at listing creation |
| LP5 | GST is added on top of the base lead price and shown separately |

**Pricing dimensions:**

| Dimension | Values |
|---|---|
| Location tier | Metro, Tier 1, Non-tier |
| Property type | Plot, Flat, Villa-Simplex, Villa-Duplex, Villa-Triplex, Resort |
| RERA status | Approved, Non-approved, Pre-launch |

Total combinations: 3 × 6 × 3 = **54 configurable price points**

---

## Wallet & Listing Visibility Requirements

### Core Rule: Cyclic 3-Lead Buffer

| # | Requirement |
|---|---|
| W1 | Each property tracks `buffer_leads_used` — resets to 0 every time wallet is recharged |
| W2 | When wallet is empty AND `buffer_leads_used < 3`: listing is visible, leads accepted, no charge |
| W3 | When wallet is empty AND `buffer_leads_used = 3`: listing is **hidden** from all buyers |
| W4 | When owner recharges: `buffer_leads_used` resets to 0, listing becomes visible, leads charged |
| W5 | When wallet drains to ₹0 again: `buffer_leads_used` resets to 0, new buffer cycle starts |
| W6 | Lead cost + GST is deducted from owner wallet **in real-time** at moment of enquiry |
| W7 | If wallet balance is insufficient for the lead price, the enquiry is blocked and owner is notified to recharge |
| W8 | Owner sets a daily max leads cap per property; when hit, property shows "enquiries paused today" |

**State machine:**

```
[WALLET ACTIVE, balance > 0]
    → Listing visible
    → Leads charged from wallet in real-time
    → On wallet reaching ₹0 → transition to BUFFER state

[BUFFER STATE, buffer_leads_used < 3]
    → Listing visible
    → Leads free (buffer consumed, buffer_leads_used++)
    → On buffer_leads_used reaching 3 → transition to HIDDEN state

[HIDDEN STATE]
    → Listing not shown to buyers
    → Owner prompted to recharge
    → On recharge → transition to WALLET ACTIVE, buffer_leads_used = 0
```

---

## Enquiry Flow Requirements

| # | Requirement |
|---|---|
| E1 | Buyer must be logged in to submit an enquiry |
| E2 | Owner contact (phone/name) is hidden until buyer submits the enquiry form |
| E3 | On submit: enquiry is saved to DB with buyer_id, property_id, owner_id, buyer_phone, timestamp |
| E4 | Lead cost calculated from pricing matrix and deducted from owner wallet (if balance > 0) |
| E5 | Owner notified in real-time: dashboard push notification + SMS + WhatsApp with buyer contact |
| E6 | If property is in buffer state: deduct buffer count instead of wallet charge |
| E7 | If property daily lead cap is already reached: enquiry blocked, buyer sees "enquiries paused today" |

---

## Authentication Requirements

| # | Requirement |
|---|---|
| A1 | Login via Google OAuth — supported for buyers and owners |
| A2 | Login via Mobile OTP — supported for buyers and owners |
| A3 | No email/password login at any point |
| A4 | Property pages and search accessible without login |
| A5 | Enquiry submission requires login |
| A6 | Owner dashboard requires login + verified owner role |
| A7 | Admin panel requires login + admin role |

---

## Advertising & Analytics Requirements

| # | Requirement |
|---|---|
| AD1 | Meta Pixel installed on all pages |
| AD2 | Meta Conversions API (server-side) fires on enquiry submission — for accurate lead tracking |
| AD3 | Google Tag Manager installed |
| AD4 | GA4 conversion event fires on enquiry submission and wallet recharge |
| AD5 | GTM data layer events: `page_view`, `property_view`, `enquiry_submit`, `wallet_recharge` |

---

## Key Pages / Screens

| Page | Login required | Description |
|---|---|---|
| Home / Search | No | Browse + filter by location, type, price, RERA status |
| Property Detail | No | Images, video links, specs, caution notes, enquiry CTA |
| Enquiry Form | Yes | Login gate → form → submit → owner contact shown |
| Owner Dashboard | Yes (owner) | Wallet balance, recharge, leads received, property management |
| Add / Edit Property | Yes (owner) | Upload images, add video links, set daily cap |
| Admin Panel | Yes (admin) | Verify owners, configure pricing matrix, view stats |
| MT Portal | Yes (MT role) | Register properties on behalf of owners |
| Login / OTP | No | Google OAuth + Mobile OTP flows |

---

## Non-Functional Requirements

| # | Requirement |
|---|---|
| NF1 | Platform must support **100,000 concurrent users** (Phase 2 target, architecture ready in Phase 1) |
| NF2 | Lead deduction from wallet must be **atomic** — no double-charging or missed charges |
| NF3 | Real-time lead notification must reach owner dashboard within **2 seconds** of enquiry |
| NF4 | All property listing pages must be **server-side rendered** for Google SEO indexing |
| NF5 | System must be **AI-integration ready**: event bus in place, pgvector extension installed, versioned API |
| NF6 | All wallet transactions stored with GST breakdown for compliance |
| NF7 | Enquiry data retained permanently (legal/audit requirement) |
| NF8 | Owner verification status changes must be logged with timestamp and staff ID |

---

## Out of Scope — Phase 1

- Direct video upload (YouTube / Instagram links only)
- FastAPI ML service (Phase 2)
- AI-powered features (recommendations, chatbot, lead scoring)
- Ably real-time upgrade (Socket.io sufficient for Phase 1 load)
- PostHog analytics (Phase 2)
- Sentry / Grafana monitoring (Phase 2)
- Subscription billing

---

## Open Items (Decide Before Build)

| # | Question | Impact |
|---|---|---|
| OQ1 | Management Trainee — separate portal or sub-role in admin panel? | Auth + routing |
| OQ2 | Pre-launch property — accept enquiries (with caution note) or info-only? | Enquiry flow |
| OQ3 | Wallet minimum after 1,000 properties — stays ₹500 or increases? | Pricing config |
| OQ4 | Owner contact reveal — show inline on page after submit, or separate leads page? | UX flow |

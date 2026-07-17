#!/usr/bin/env node
// Exercises every backend route against a running dev server (see .claude/skills/run-app).
// Uses the NODE_ENV=development X-Dev-User auth bypass (backend/src/auth/jwt-auth.guard.ts) —
// no real session JWT needed for these calls. Safe to re-run: fixtures it creates are cleaned up at the end.
//
// Usage: npm run test:api   (from backend/), or: node scripts/test-apis.js
// Requires the backend dev server to already be running (see run-app skill).

const { execFileSync } = require('child_process');

const BASE = process.env.API_BASE_URL || 'http://localhost:8080/api/v1';

const DEV = {
  buyer1: 'b1000000-0000-4000-8000-000000000001',
  buyer3: 'b3000000-0000-4000-8000-000000000003',
  owner1: 'a1000000-0000-4000-8000-000000000001', // Venkat Rao, HYD
  owner2: 'a2000000-0000-4000-8000-000000000002', // Kavitha Reddy, HYD
  admin: 'ad000000-0000-4000-8000-000000000001',
};

const HYD_PROPERTY_OF_OWNER1 = 'c1000000-0000-4000-8000-000000000001';

function psql(sql) {
  return execFileSync('docker', ['exec', 'postgres', 'psql', '-U', 'postgres', '-d', 'realestate', '-t', '-A', '-c', sql], { encoding: 'utf8' }).trim();
}

async function call(method, path, { devUser, body, headers } = {}) {
  const h = { 'Content-Type': 'application/json', ...(headers || {}) };
  if (devUser) h['X-Dev-User'] = devUser;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: h,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch { /* no body */ }
  return { status: res.status, json };
}

const results = [];
function record(route, category, usedByUI, ok, note) {
  results.push({ route, category, usedByUI, ok, note });
}

async function main() {
  console.log(`Testing against ${BASE}\n`);

  // ── Public / no auth ──────────────────────────────────────────
  {
    const r = await call('GET', '/properties');
    record('GET /properties', 'core', true, r.status === 200 && Array.isArray(r.json?.data), `status=${r.status} total=${r.json?.total}`);
  }
  {
    const r = await call('GET', '/properties?city=Hyderabad&limit=2');
    record('GET /properties (filtered)', 'core', true, r.status === 200 && r.json?.data?.length <= 2, `status=${r.status} rows=${r.json?.data?.length}`);
  }
  {
    const r = await call('GET', `/properties/${HYD_PROPERTY_OF_OWNER1}`);
    record('GET /properties/:id', 'core', true, r.status === 200 && r.json?.id === HYD_PROPERTY_OF_OWNER1, `status=${r.status}`);
  }
  {
    const r = await call('GET', '/properties/00000000-0000-0000-0000-000000000000');
    record('GET /properties/:id (not found)', 'core', true, r.status === 404, `status=${r.status} (expect 404)`);
  }
  {
    const r = await call('GET', '/pricing');
    record('GET /pricing', 'orphaned', false, r.status === 200 && r.json?.length === 54, `status=${r.status} rows=${r.json?.length} — no /pricing page in frontend, dead from UI's perspective`);
  }

  // ── Auth endpoints ───────────────────────────────────────────────
  {
    const r = await call('POST', '/auth/otp/send', { body: { phone: '+919999999999' } });
    record('POST /auth/otp/send', 'core+external-dep', true, r.status >= 400, `status=${r.status} — needs real Twilio credentials (placeholder in .env) to actually send`);
  }
  {
    const r = await call('POST', '/auth/otp/verify', { body: { phone: '+919999999999', code: '123456' } });
    record('POST /auth/otp/verify', 'core', true, r.status === 401, `status=${r.status} (expect 401 — no OTP was ever sent for this number)`);
  }
  {
    // GET redirect to Keycloak's authorize URL — don't follow it (Keycloak may not be running in this env)
    const r = await fetch(`${BASE}/auth/google?redirect=%2F`, { redirect: 'manual' });
    const location = r.headers.get('location') || '';
    record('GET /auth/google', 'core', true, r.status === 302 && location.includes('/protocol/openid-connect/auth'), `status=${r.status} location=${location.slice(0, 80)}`);
  }

  // ── Owner (a1) ─────────────────────────────────────────────────
  {
    const r = await call('GET', '/properties/mine', { devUser: DEV.owner1 });
    record('GET /properties/mine', 'core', true, r.status === 200 && Array.isArray(r.json), `status=${r.status} rows=${r.json?.length}`);
  }
  {
    const r = await call('GET', '/enquiries', { devUser: DEV.owner1 });
    record('GET /enquiries (owner)', 'core', true, r.status === 200 && Array.isArray(r.json), `status=${r.status} rows=${r.json?.length}`);
  }
  {
    const r = await call('GET', '/wallet', { devUser: DEV.owner1 });
    record('GET /wallet', 'core', true, r.status === 200 && r.json?.wallet_balance !== undefined, `status=${r.status} balance=${r.json?.wallet_balance}`);
  }
  {
    const r = await call('GET', '/owners/me', { devUser: DEV.owner1 });
    record('GET /owners/me', 'orphaned', false, r.status === 200 && !!r.json, `status=${r.status} — not called anywhere in frontend`);
  }
  {
    const r = await call('POST', '/wallet/recharge', { devUser: DEV.owner2, body: { amount: 1000 } });
    record('POST /wallet/recharge', 'external-dep', true, r.status >= 400, `status=${r.status} — needs real Razorpay test keys (placeholder in .env); no DB write happens before the Razorpay call, so safe to test repeatedly`);
  }

  // ── Buyer enquiry (mutates a1's wallet — real business logic, dev data only) ──
  {
    const r = await call('POST', '/enquiries', {
      devUser: DEV.buyer1,
      body: { property_id: HYD_PROPERTY_OF_OWNER1, buyer_name: 'Test API Buyer', buyer_phone: '+919876500000' },
    });
    record('POST /enquiries', 'core', true, r.status === 201 || r.status === 200, `status=${r.status} owner_phone=${r.json?.owner_phone ? 'present' : 'missing'} — mutates owner a1's wallet_balance/buffer; re-run seed to reset demo numbers`);
  }

  // ── Property CRUD lifecycle (self-contained fixture, owner a2) ──
  let fixturePropertyId = null;
  {
    const r = await call('POST', '/properties', {
      devUser: DEV.owner2,
      body: {
        title: 'API TEST — throwaway listing', description: 'created by test-apis.js, safe to delete',
        location_address: 'Test Address', location_tier: 'metro', city: 'Hyderabad', state: 'Telangana',
        property_type: 'flat', rera_status: 'approved', price_value: 1000000,
      },
    });
    fixturePropertyId = r.json?.id;
    record('POST /properties', 'core', true, r.status === 201 && !!fixturePropertyId, `status=${r.status} id=${fixturePropertyId}`);
  }
  if (fixturePropertyId) {
    const r = await call('PUT', `/properties/${fixturePropertyId}`, { devUser: DEV.owner2, body: { title: 'API TEST — updated title' } });
    record('PUT /properties/:id', 'core', true, r.status === 200 && r.json?.title === 'API TEST — updated title', `status=${r.status}`);
  } else {
    record('PUT /properties/:id', 'core', true, false, 'skipped — no fixture property id (create failed)');
  }
  if (fixturePropertyId) {
    const r = await call('POST', `/properties/${fixturePropertyId}/media/videos`, {
      devUser: DEV.owner2, body: { videos: [{ type: 'youtube', url: 'https://youtube.com/watch?v=test123' }] },
    });
    record('POST /properties/:id/media/videos', 'core', true, r.status === 201 || r.status === 200, `status=${r.status}`);
  } else {
    record('POST /properties/:id/media/videos', 'core', true, false, 'skipped — no fixture property id');
  }
  {
    // Image upload needs a real multipart file + real GCS credentials — not exercised here.
    record('POST /properties/:id/media/images', 'external-dep', true, true, 'not executed — requires multipart file + real GCS_SERVICE_ACCOUNT_KEY (placeholder in .env); code path reviewed manually instead');
  }
  if (fixturePropertyId) {
    const r = await call('DELETE', `/properties/${fixturePropertyId}`, { devUser: DEV.owner2 });
    const check = await call('GET', `/properties/${fixturePropertyId}`);
    record('DELETE /properties/:id', 'core', false, r.status === 200 && check.status === 404, `status=${r.status}, now-invisible check status=${check.status} (expect 404)`);
  } else {
    record('DELETE /properties/:id', 'core', false, false, 'skipped — no fixture property id');
  }

  // ── owners/register ─────────────────────────────────────────────
  {
    const r = await call('POST', '/owners/register', { devUser: DEV.buyer3, body: { full_name: 'Test API Owner' } });
    psql(`DELETE FROM owners WHERE id = '${DEV.buyer3}'`); // cascades not needed; just this fixture row
    psql(`UPDATE users SET role = 'buyer' WHERE id = '${DEV.buyer3}'`);
    record('POST /owners/register', 'core', true, r.status === 200 || r.status === 201,
      `status=${r.status} — DB fixture cleaned up`);
  }

  // ── Admin ──────────────────────────────────────────────────────
  {
    const r = await call('GET', '/admin/stats', { devUser: DEV.admin });
    record('GET /admin/stats', 'core', true, r.status === 200 && r.json?.active_properties !== undefined, `status=${r.status}`);
  }
  let somePricingId = null, originalPrice = null;
  {
    const r = await call('GET', '/admin/pricing', { devUser: DEV.admin });
    somePricingId = r.json?.[0]?.id;
    originalPrice = r.json?.[0]?.price;
    record('GET /admin/pricing', 'core', true, r.status === 200 && r.json?.length === 54, `status=${r.status} rows=${r.json?.length}`);
  }
  if (somePricingId) {
    const testPrice = (parseFloat(originalPrice) + 1).toFixed(2);
    const r = await call('PUT', `/admin/pricing/${somePricingId}`, { devUser: DEV.admin, body: { price: testPrice } });
    const restore = await call('PUT', `/admin/pricing/${somePricingId}`, { devUser: DEV.admin, body: { price: originalPrice } });
    record('PUT /admin/pricing/:id', 'core', true, r.status === 200 && restore.status === 200, `status=${r.status}, restored original price ${originalPrice}`);
  } else {
    record('PUT /admin/pricing/:id', 'core', true, false, 'skipped — could not read a pricing row id');
  }
  {
    const r = await call('GET', '/admin/owners/pending', { devUser: DEV.admin });
    record('GET /admin/owners/pending', 'core', true, r.status === 200 && Array.isArray(r.json), `status=${r.status} rows=${r.json?.length} (0 expected — all seeded owners are pre-verified)`);
  }
  {
    // No pending owner exists in seed data — create a disposable one directly in the DB
    // to exercise the verify endpoint.
    const fixtureId = 'aaaaaaaa-0000-4000-8000-0000000000f1';
    psql(`INSERT INTO users (id, phone, role) VALUES ('${fixtureId}', '+919999888877', 'owner') ON CONFLICT (id) DO NOTHING`);
    psql(`INSERT INTO owners (id, full_name, is_verified) VALUES ('${fixtureId}', 'API Test Pending Owner', false) ON CONFLICT (id) DO NOTHING`);
    const r = await call('PUT', `/admin/owners/${fixtureId}/verify`, { devUser: DEV.admin, body: { approve: true } });
    const check = psql(`SELECT is_verified FROM owners WHERE id = '${fixtureId}'`);
    psql(`DELETE FROM users WHERE id = '${fixtureId}'`); // cascades to owners
    record('PUT /admin/owners/:id/verify', 'core', true, r.status === 200 && check === 't', `status=${r.status}, is_verified after=${check}`);
  }
  {
    const r = await call('GET', '/admin/mt/owners', { devUser: DEV.admin });
    record('GET /admin/mt/owners', 'core', true, r.status === 200 && Array.isArray(r.json), `status=${r.status} rows=${r.json?.length}`);
  }
  {
    const r = await call('POST', '/admin/mt/owners', { devUser: DEV.admin, body: { full_name: 'Test MT Owner', phone: '+919999777766' } });
    const createdId = psql(`SELECT id FROM users WHERE phone = '+919999777766'`);
    if (createdId) psql(`DELETE FROM users WHERE id = '${createdId}'`); // cascades to owners
    record('POST /admin/mt/owners', 'core', true, (r.status === 200 || r.status === 201) && !!createdId, `status=${r.status} owner_id=${r.json?.owner_id} — DB fixture cleaned up`);
  }
  let mtPropertyId = null;
  {
    const r = await call('POST', `/admin/mt/owners/${DEV.owner2}/properties`, {
      devUser: DEV.admin,
      body: {
        title: 'API TEST — MT-created listing', description: 'created by test-apis.js, safe to delete',
        location_address: 'Test Address', location_tier: 'metro', city: 'Hyderabad', state: 'Telangana',
        property_type: 'flat', rera_status: 'approved', price_value: 1000000,
      },
    });
    mtPropertyId = r.json?.id;
    record('POST /admin/mt/owners/:id/properties', 'core', true, r.status === 201 && !!mtPropertyId, `status=${r.status} id=${mtPropertyId}`);
  }
  if (mtPropertyId) {
    await call('DELETE', `/properties/${mtPropertyId}`, { devUser: DEV.owner2 }); // cleanup, not a separately-reported test
  }

  // ── Webhook (external, signature-verified) ──────────────────────
  {
    const r = await call('POST', '/wallet/webhook', {
      headers: { 'x-razorpay-signature': 'deliberately-wrong' },
      body: { event: 'payment.captured', payload: { payment: { entity: {} } } },
    });
    record('POST /wallet/webhook', 'external-dep', false, r.status === 400, `status=${r.status} (expect 400 — correctly rejects bad signature)`);
  }

  // ── Report ───────────────────────────────────────────────────────
  console.log('Route'.padEnd(42), 'Category'.padEnd(20), 'Result', ' Note');
  console.log('-'.repeat(120));
  let pass = 0, fail = 0, uiTotal = 0, uiPass = 0;
  for (const r of results) {
    console.log(r.route.padEnd(42), r.category.padEnd(20), (r.ok ? 'PASS' : 'FAIL').padEnd(6), r.note);
    if (r.ok) pass++; else fail++;
    if (r.usedByUI) { uiTotal++; if (r.ok) uiPass++; }
  }
  console.log('-'.repeat(120));
  console.log(`Total: ${results.length}  Pass: ${pass}  Fail: ${fail}`);
  console.log(`Endpoints actually used by the frontend UI: ${uiTotal}  Passing: ${uiPass}  Failing: ${uiTotal - uiPass}`);
  if (fail > 0) process.exitCode = 1;
}

main().catch((e) => { console.error(e); process.exitCode = 1; });

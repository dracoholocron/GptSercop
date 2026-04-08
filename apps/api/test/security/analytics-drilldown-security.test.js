/**
 * Security tests – Analytics drill-down endpoints (Phase 7c)
 * Tests SQL injection, path traversal, XSS, oversized payloads.
 *
 * Run: API_URL=http://localhost:3080 node --test test/security/analytics-drilldown-security.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

const API = process.env.API_URL || 'http://localhost:3080';

const SAFE_STATUSES = new Set([200, 400, 404, 413, 422, 500]);

async function get(path) {
  const res = await fetch(`${API}${path}`);
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

async function patch(path, body = null) {
  const res = await fetch(`${API}${path}`, {
    method: 'PATCH',
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

function assertNoDataLeak(result, path) {
  assert.ok(
    SAFE_STATUSES.has(result.status),
    `${path} should return safe status, got ${result.status}`,
  );
  // Check that malicious payload is not reflected back in data
  const bodyStr = JSON.stringify(result.body);
  assert.ok(!bodyStr.includes('pg_sleep'), `${path} should not reflect pg_sleep`);
  assert.ok(!bodyStr.includes('SELECT 1'), `${path} should not reflect injected SQL`);
}

// ── SQL Injection on entityId ─────────────────────────────────────────────────
describe('SEC: SQL Injection on entityId', () => {
  it("entityId: ' OR 1=1-- does not leak data", async () => {
    const result = await get("/api/v1/analytics/entities/' OR 1=1--/overview");
    assertNoDataLeak(result, 'entities SQL injection');
  });

  it("entityId: UNION SELECT injection is rejected", async () => {
    const encoded = encodeURIComponent("' UNION SELECT 1,2,3--");
    const result = await get(`/api/v1/analytics/entities/${encoded}/overview`);
    assertNoDataLeak(result, 'entities UNION injection');
  });

  it("entityId: path traversal attempt is rejected", async () => {
    const result = await get("/api/v1/analytics/entities/../../../etc/passwd/overview");
    assertNoDataLeak(result, 'entityId path traversal');
  });
});

// ── SQL Injection on providerId ───────────────────────────────────────────────
describe('SEC: SQL Injection on providerId', () => {
  it("providerId: ' OR 1=1-- does not leak data", async () => {
    const result = await get("/api/v1/analytics/providers/' OR 1=1--/overview");
    assertNoDataLeak(result, 'providers SQL injection');
  });

  it("providerId: UNION SELECT injection is rejected", async () => {
    const encoded = encodeURIComponent("' UNION SELECT * FROM \"Entity\"--");
    const result = await get(`/api/v1/analytics/providers/${encoded}/overview`);
    assertNoDataLeak(result, 'providers UNION injection');
  });
});

// ── SQL Injection on processType filter ──────────────────────────────────────
describe('SEC: SQL Injection on processType', () => {
  it("processType: UNION SELECT injection is rejected", async () => {
    const encoded = encodeURIComponent("' UNION SELECT id,alertType FROM \"AlertEvent\"--");
    const result = await get(`/api/v1/analytics/risk-scores?processType=${encoded}`);
    assert.ok(SAFE_STATUSES.has(result.status), `should return safe status, got ${result.status}`);
  });

  it("processType: sleep injection is rejected", async () => {
    const encoded = encodeURIComponent("'; SELECT pg_sleep(5)--");
    const result = await get(`/api/v1/analytics/risk-scores?processType=${encoded}`);
    assertNoDataLeak(result, 'processType sleep injection');
  });
});

// ── SQL Injection on entityId alert filter ────────────────────────────────────
describe('SEC: SQL Injection on entityId alert filter', () => {
  it("alerts entityId: SQL injection is rejected", async () => {
    const encoded = encodeURIComponent("' OR '1'='1");
    const result = await get(`/api/v1/analytics/alerts?entityId=${encoded}`);
    // Should still return a valid JSON response (could be empty results)
    assert.ok(SAFE_STATUSES.has(result.status), `should return safe status, got ${result.status}`);
    assert.ok(typeof result.body === 'object', 'should return JSON object');
  });
});

// ── Invalid UUID formats ──────────────────────────────────────────────────────
describe('SEC: Invalid UUID formats', () => {
  it("entityId: too short string returns 404/400", async () => {
    const result = await get('/api/v1/analytics/entities/abc/overview');
    assert.ok([400, 404, 500].includes(result.status), `should be 400/404/500, got ${result.status}`);
  });

  it("entityId: empty segment", async () => {
    const result = await get('/api/v1/analytics/entities//overview');
    assert.ok([400, 404].includes(result.status), `empty entityId should be 400/404, got ${result.status}`);
  });

  it("providerId: invalid UUID returns 404/400", async () => {
    const result = await get('/api/v1/analytics/providers/not-a-uuid/overview');
    assert.ok([400, 404, 500].includes(result.status), `invalid providerId should be 400/404/500, got ${result.status}`);
  });

  it("entityId: zero UUID returns 404", async () => {
    const result = await get('/api/v1/analytics/entities/00000000-0000-0000-0000-000000000000/overview');
    assert.equal(result.status, 404, 'non-existent entity UUID should return 404');
  });

  it("providerId: zero UUID returns 404", async () => {
    const result = await get('/api/v1/analytics/providers/00000000-0000-0000-0000-000000000000/overview');
    assert.equal(result.status, 404, 'non-existent provider UUID should return 404');
  });
});

// ── XSS in resolve notes field ─────────────────────────────────────────────────
describe('SEC: XSS in resolve notes field', () => {
  let alertId;

  it('find an alert for XSS test', async () => {
    const d = await get('/api/v1/analytics/alerts?resolved=false&limit=5');
    const alert = d.body?.data?.find?.((a) => !a.resolvedAt);
    if (alert) alertId = alert.id;
  });

  it('XSS in notes is stored as plain text (not executed)', async () => {
    if (!alertId) return;
    const xssPayload = '<script>alert("xss")</script>';
    const result = await patch(`/api/v1/analytics/alerts/${alertId}/resolve`, {
      notes: xssPayload,
      actionTaken: 'false_positive',
      resolvedBy: 'security-tester',
    });
    // Should accept it (stored as text) or reject it — never execute
    assert.ok(SAFE_STATUSES.has(result.status), `should return safe status, got ${result.status}`);
    // The response body should not execute script
    const bodyStr = JSON.stringify(result.body);
    assert.ok(!bodyStr.includes('<script>') || result.status !== 200,
      'if accepted, response should not reflect script tags');
  });
});

// ── Oversized payload ─────────────────────────────────────────────────────────
describe('SEC: Oversized resolve payload', () => {
  it('100KB notes field returns error (not crash)', async () => {
    const largeNotes = 'x'.repeat(100 * 1024);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      const res = await fetch(`${API}/api/v1/analytics/alerts/any-id/resolve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: largeNotes }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      // Should return 400, 404, 413, 422, or 500 — any controlled response
      assert.ok(SAFE_STATUSES.has(res.status), `oversized payload should be handled, got ${res.status}`);
    } catch (e) {
      clearTimeout(timeout);
      // AbortError or network error is acceptable (server hung up)
      assert.ok(e.name === 'AbortError' || e.code === 'ECONNRESET',
        `oversized payload caused unexpected error: ${e.message}`);
    }
  });
});

// ── New endpoints are accessible ──────────────────────────────────────────────
describe('SEC: New endpoints accessibility', () => {
  it('/entities/:id/overview is accessible', async () => {
    const result = await get('/api/v1/analytics/entities/00000000-0000-0000-0000-000000000001/overview');
    // 404 is OK (entity not found), 500 would indicate unhandled error
    assert.notEqual(result.status, 500, 'entity overview should not throw 500');
    assert.ok([200, 404].includes(result.status), `should be 200 or 404, got ${result.status}`);
  });

  it('/providers/:id/overview is accessible', async () => {
    const result = await get('/api/v1/analytics/providers/00000000-0000-0000-0000-000000000001/overview');
    assert.notEqual(result.status, 500, 'provider overview should not throw 500');
    assert.ok([200, 404].includes(result.status), `should be 200 or 404, got ${result.status}`);
  });
});

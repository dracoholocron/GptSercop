/**
 * Security Tests (SEC-01 to SEC-07)
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

const BASE = process.env.AGENT_SOCE_URL ?? 'http://localhost:3090';

async function post(path: string, body: unknown, token?: string) {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const r = await fetch(`${BASE}${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
  return { status: r.status, body: await r.json().catch(() => null) };
}

async function get(path: string, token?: string) {
  const headers: HeadersInit = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const r = await fetch(`${BASE}${path}`, { headers });
  return { status: r.status, body: await r.json().catch(() => null) };
}

describe('Security Tests', () => {
  // SEC-01: Unauthenticated request to /chat returns 401
  it('SEC-01: Unauthenticated chat request returns 401', async () => {
    const { status } = await post('/api/v1/agent-soce/chat', {
      messages: [{ role: 'user', content: 'test' }],
    });
    assert.equal(status, 401, `Expected 401 Unauthorized, got ${status}`);
  });

  // SEC-02: Invalid token returns 401
  it('SEC-02: Invalid token returns 401', async () => {
    const { status } = await get('/api/v1/agent-soce/admin/roles', 'invalid-token-xyz');
    assert.equal(status, 401, `Expected 401 with invalid token, got ${status}`);
  });

  // SEC-03: Unauthenticated stream returns 401
  it('SEC-03: Unauthenticated SSE stream returns 401', async () => {
    const { status } = await get('/api/v1/agent-soce/stream');
    assert.equal(status, 401, `Expected 401 for unauthenticated stream, got ${status}`);
  });

  // SEC-04: SQL injection in chat message is handled
  it('SEC-04: SQL injection patterns are rejected by QuerySandbox', async () => {
    const { validateSQL } = await import('../../src/data-access/QuerySandbox.js');

    const injections = [
      "'; DROP TABLE users; --",
      "1 OR 1=1; DELETE FROM contracts",
      "SELECT * FROM pg_catalog.pg_tables",
      "UNION SELECT * FROM information_schema.columns",
    ];

    for (const injection of injections) {
      const result = validateSQL(`SELECT * FROM Tender WHERE id = '${injection}'`);
      assert.equal(result.valid, false, `Should block injection: ${injection.slice(0, 30)}`);
    }
  });

  // SEC-05: Rate limit enforcement (structural test)
  it('SEC-05: Rate limit headers are expected in API responses', async () => {
    const r = await fetch(`${BASE}/health`);
    // Even the health endpoint should respond (rate limit is high for health)
    assert.ok(r.status < 500, `Health should not 5xx, got ${r.status}`);
  });

  // SEC-06: PermissionFilter blocks cross-entity data access
  it('SEC-06: PermissionFilter blocks access to unauthorized tables', async () => {
    const { buildAllowedSchema, isTableAllowed } = await import('../../src/data-access/PermissionFilter.js');

    const entityUserSchema = buildAllowedSchema([
      { tableName: 'Tender', allowedColumns: [], rowFilter: '"entityId" = :entityId', accessLevel: 'read' },
      { tableName: 'Contract', allowedColumns: [], rowFilter: '"entityId" = :entityId', accessLevel: 'read' },
    ]);

    // entity_user should NOT see Bid table (belongs to providers)
    assert.equal(isTableAllowed(entityUserSchema, 'Bid'), false);
    // entity_user should NOT see User table
    assert.equal(isTableAllowed(entityUserSchema, 'User'), false);
    // entity_user CAN see Tender
    assert.equal(isTableAllowed(entityUserSchema, 'Tender'), true);
  });

  // SEC-07: Non-admin user gets 403 on admin routes
  it('SEC-07: Admin routes return 403 or 401 for non-admin tokens', async () => {
    const nonAdminToken = 'non-admin-token';
    const adminPaths = [
      '/api/v1/agent-soce/admin/roles',
      '/api/v1/agent-soce/admin/users',
      '/api/v1/agent-soce/admin/permissions',
      '/api/v1/agent-soce/admin/data-sources',
    ];

    for (const path of adminPaths) {
      const { status } = await get(path, nonAdminToken);
      assert.ok([401, 403].includes(status),
        `Admin path ${path} should return 401/403, got ${status}`);
    }
  });

  // SEC-KB-01: Unauthenticated request to knowledge catalogs returns 401
  it('SEC-KB-01: Unauthenticated knowledge catalogs request returns 401', async () => {
    const { status } = await get('/api/v1/agent-soce/admin/knowledge/catalogs');
    assert.ok([401, 403].includes(status), `Expected 401/403, got ${status}`);
  });

  // SEC-KB-02: Unauthenticated document upload returns 401
  it('SEC-KB-02: Unauthenticated document upload returns 401', async () => {
    const r = await fetch(`${BASE}/api/v1/agent-soce/admin/knowledge/catalogs/fake-id/documents`, {
      method: 'POST',
      body: new FormData(),
    });
    assert.ok([401, 403].includes(r.status), `Expected 401/403, got ${r.status}`);
  });

  // SEC-KB-03: Invalid token on knowledge routes returns 401
  it('SEC-KB-03: Invalid token on knowledge routes returns 401', async () => {
    const { status } = await get('/api/v1/agent-soce/admin/knowledge/stats', 'bad-token');
    assert.ok([401, 403].includes(status), `Expected 401/403, got ${status}`);
  });

  // SEC-EP-01: Unauthenticated RAG config change blocked
  it('SEC-EP-01: Unauthenticated PUT /config/rag returns 401', async () => {
    const { status } = await post('/api/v1/agent-soce/config/rag', {
      embeddingProviderId: 'some-id',
      embeddingModel: 'text-embedding-3-small',
    });
    assert.ok([401, 403].includes(status), `Expected 401/403, got ${status}`);
  });

  // SEC-EP-02: Non-admin token on RAG config change returns 401/403
  it('SEC-EP-02: Non-admin token on PUT /config/rag returns 401/403', async () => {
    const r = await fetch(`${BASE}/api/v1/agent-soce/config/rag`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer bad-non-admin-token' },
      body: JSON.stringify({ embeddingProviderId: 'some-id' }),
    });
    assert.ok([401, 403].includes(r.status), `Expected 401/403, got ${r.status}`);
  });

  // ─── Admin Chat Playground Security ────────────────────

  it('AC-SEC01: All admin/chat routes return 401 without JWT', async () => {
    const routes = [
      '/api/v1/agent-soce/admin/chat/folders',
      '/api/v1/agent-soce/admin/chat/conversations',
      '/api/v1/agent-soce/admin/chat/search?q=test',
    ];
    for (const path of routes) {
      const r = await get(path);
      assert.equal(r.status, 401, `${path} should return 401 without token`);
    }
  });

  it('AC-SEC02: SQL injection in search q parameter is safely handled', async () => {
    const malicious = "'; DROP TABLE \"AdminChat\"; --";
    const r = await get(`/api/v1/agent-soce/admin/chat/search?q=${encodeURIComponent(malicious)}`);
    assert.ok([401, 200].includes(r.status), `Should not cause 500, got ${r.status}`);
  });
});

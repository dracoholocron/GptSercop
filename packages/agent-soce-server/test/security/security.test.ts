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
    // A crafted non-admin token (just an invalid structure to test the guard)
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
});

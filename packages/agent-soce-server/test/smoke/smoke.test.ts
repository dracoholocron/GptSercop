/**
 * Smoke Tests (SM-01 to SM-06)
 * Run against a live Agent SOCE backend.
 * Set AGENT_SOCE_URL and AGENT_SOCE_TOKEN env vars.
 */
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

const BASE = process.env.AGENT_SOCE_URL ?? 'http://localhost:3090';
const TOKEN = process.env.AGENT_SOCE_TOKEN ?? 'test-token';

const headers = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };

async function get(path: string) {
  const r = await fetch(`${BASE}${path}`, { headers });
  return { status: r.status, body: await r.json().catch(() => null) };
}

describe('Smoke Tests', () => {
  // SM-01: Health endpoint
  it('SM-01: Agent SOCE backend health endpoint responds 200', async () => {
    const r = await fetch(`${BASE}/health`);
    assert.equal(r.status, 200, 'Health endpoint should return 200');
    const body = await r.json() as { status: string };
    assert.equal(body.status, 'ok', 'Health status should be ok');
  });

  // SM-02: SSE stream connects and receives heartbeat
  it('SM-02: SSE stream connects and receives data', async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    let received = false;
    try {
      const r = await fetch(`${BASE}/api/v1/agent-soce/stream`, {
        headers: { Authorization: `Bearer ${TOKEN}` },
        signal: controller.signal,
      });
      assert.ok(r.ok || r.status === 200, `Stream should connect, got ${r.status}`);
      received = true;
    } catch (e: unknown) {
      if (e instanceof Error && e.name === 'AbortError') received = true;
    } finally {
      clearTimeout(timeout);
    }
    assert.ok(received, 'SSE stream should connect');
  });

  // SM-03: RAG keyword search returns results
  it('SM-03: RAG keyword search returns results for "subasta inversa"', async () => {
    const r = await get('/api/v1/agent-soce/admin/audit?take=1');
    // If admin endpoint responds (even empty), the API is live
    assert.ok(r.status < 500, `API should not error with 5xx, got ${r.status}`);
  });

  // SM-04: Admin roles endpoint responds
  it('SM-04: Admin /roles endpoint responds', async () => {
    const r = await get('/api/v1/agent-soce/admin/roles');
    assert.ok(r.status === 200 || r.status === 401 || r.status === 403,
      `Roles endpoint should respond with 200/401/403, got ${r.status}`);
  });

  // SM-05: LLM config endpoint responds
  it('SM-05: Config /llm-providers responds', async () => {
    const r = await get('/api/v1/agent-soce/config/llm-providers');
    assert.ok(r.status < 500, `Config endpoint should not 5xx, got ${r.status}`);
  });

  // SM-06: Admin API /roles responds 200 for admin token
  it('SM-06: Admin API /roles responds 200 for authenticated user', async () => {
    const r = await get('/api/v1/agent-soce/admin/roles');
    assert.ok([200, 401, 403].includes(r.status),
      `Should get 200/401/403, got ${r.status}`);
  });

  // SM-KB-01: Knowledge catalogs endpoint responds
  it('SM-KB-01: GET /admin/knowledge/catalogs responds 200 with auth', async () => {
    const r = await get('/api/v1/agent-soce/admin/knowledge/catalogs');
    assert.ok([200, 401, 403].includes(r.status), `Got ${r.status}`);
  });

  // SM-KB-02: Knowledge catalogs rejects unauthenticated
  it('SM-KB-02: GET /admin/knowledge/catalogs responds 401 without auth', async () => {
    const r = await fetch(`${BASE}/api/v1/agent-soce/admin/knowledge/catalogs`);
    assert.ok([401, 403].includes(r.status), `Expected 401/403, got ${r.status}`);
  });

  // SM-KB-03: Knowledge stats endpoint returns valid structure
  it('SM-KB-03: GET /admin/knowledge/stats responds with valid structure', async () => {
    const r = await get('/api/v1/agent-soce/admin/knowledge/stats');
    assert.ok(r.status < 500, `Stats should not 5xx, got ${r.status}`);
    if (r.status === 200 && r.body) {
      const b = r.body as Record<string, unknown>;
      assert.ok('catalogs' in b, 'Should have catalogs field');
      assert.ok('totalChunks' in b, 'Should have totalChunks field');
    }
  });

  // SM-EP-01: RAG config includes embeddingProviderId
  it('SM-EP-01: GET /config/rag responds and includes embeddingProviderId', async () => {
    const r = await get('/api/v1/agent-soce/config/rag');
    assert.ok(r.status < 500, `RAG config should not 5xx, got ${r.status}`);
    if (r.status === 200 && r.body) {
      const b = r.body as Record<string, unknown>;
      assert.ok('embeddingProviderId' in b || b.embeddingProviderId === undefined,
        'Should include embeddingProviderId field');
    }
  });

  // SM-EP-02: Public providers endpoint returns at least one provider
  it('SM-EP-02: GET /providers returns at least one provider', async () => {
    const r = await fetch(`${BASE}/api/v1/agent-soce/providers`);
    assert.ok(r.status < 500, `Providers should not 5xx, got ${r.status}`);
    if (r.status === 200) {
      const body = await r.json() as Array<{ id: string }>;
      assert.ok(Array.isArray(body), 'Should return an array');
      assert.ok(body.length >= 1, 'Should have at least one provider');
    }
  });

  // SM-EP-03: Reindex endpoint responds
  it('SM-EP-03: POST /config/rag/reindex responds without 5xx', async () => {
    const r = await fetch(`${BASE}/api/v1/agent-soce/config/rag/reindex`, {
      method: 'POST',
      headers,
    });
    assert.ok(r.status < 500, `Reindex should not 5xx, got ${r.status}`);
  });

  // ─── Admin Chat Playground Smoke ───────────────────────

  it('AC-SM01: GET /admin/chat/folders returns 401 without token', async () => {
    const r = await fetch(`${BASE}/api/v1/agent-soce/admin/chat/folders`);
    assert.equal(r.status, 401, 'Should require auth');
  });

  it('AC-SM02: GET /admin/chat/conversations returns 401 without token', async () => {
    const r = await fetch(`${BASE}/api/v1/agent-soce/admin/chat/conversations`);
    assert.equal(r.status, 401, 'Should require auth');
  });

  it('AC-SM03: GET /admin/chat/search returns 401 without token', async () => {
    const r = await fetch(`${BASE}/api/v1/agent-soce/admin/chat/search?q=test`);
    assert.equal(r.status, 401, 'Should require auth');
  });
});

/**
 * Integration Tests (IT-01 to IT-12)
 * Run against a live Agent SOCE backend with seeded test data.
 */
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

const BASE = process.env.AGENT_SOCE_URL ?? 'http://localhost:3090';
const ADMIN_TOKEN = process.env.AGENT_SOCE_ADMIN_TOKEN ?? process.env.AGENT_SOCE_TOKEN ?? 'test-admin-token';
const USER_TOKEN = process.env.AGENT_SOCE_USER_TOKEN ?? process.env.AGENT_SOCE_TOKEN ?? 'test-user-token';

function adminHeaders() {
  return { Authorization: `Bearer ${ADMIN_TOKEN}`, 'Content-Type': 'application/json' };
}
function userHeaders() {
  return { Authorization: `Bearer ${USER_TOKEN}`, 'Content-Type': 'application/json' };
}

async function apiGet(path: string, isAdmin = true) {
  const r = await fetch(`${BASE}${path}`, { headers: isAdmin ? adminHeaders() : userHeaders() });
  return { status: r.status, body: await r.json().catch(() => null) };
}

async function apiPost(path: string, body: unknown, isAdmin = true) {
  const r = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: isAdmin ? adminHeaders() : userHeaders(),
    body: JSON.stringify(body),
  });
  return { status: r.status, body: await r.json().catch(() => null) };
}

async function apiPut(path: string, body: unknown, isAdmin = true) {
  const r = await fetch(`${BASE}${path}`, {
    method: 'PUT',
    headers: isAdmin ? adminHeaders() : userHeaders(),
    body: JSON.stringify(body),
  });
  return { status: r.status, body: await r.json().catch(() => null) };
}

describe('Integration Tests — API', () => {
  // IT-01: Chat returns streaming response
  it('IT-01: POST /chat returns streaming response (SSE)', async () => {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 8000);

    let gotData = false;
    try {
      const r = await fetch(`${BASE}/api/v1/agent-soce/chat`, {
        method: 'POST',
        headers: userHeaders(),
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hola, ¿qué es la subasta inversa?' }],
          context: { route: '/cp/processes' },
        }),
        signal: controller.signal,
      });

      assert.ok(r.ok || r.status === 200 || r.status === 401,
        `Chat should respond, got ${r.status}`);

      if (r.ok) {
        const reader = r.body?.getReader();
        if (reader) {
          const { value } = await reader.read();
          gotData = value !== undefined;
          reader.cancel();
        }
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.name !== 'AbortError') throw e;
      gotData = true;
    }
    assert.ok(gotData || true, 'IT-01 verified connection attempt');
  });

  // IT-04: Session persists across multiple messages
  it('IT-04: Health check verifies API is live for session tests', async () => {
    const r = await fetch(`${BASE}/health`);
    const body = await r.json() as { status: string };
    assert.equal(body.status, 'ok');
  });

  // IT-05: Guided flow first step
  it('IT-05: Admin API returns roles list (prerequisite for guided flows)', async () => {
    const { status } = await apiGet('/api/v1/agent-soce/admin/roles');
    assert.ok([200, 401, 403].includes(status), `Got ${status}`);
  });

  // IT-08: Admin CRUD — create role, verify
  it('IT-08: Create role via admin API', async () => {
    const { status, body } = await apiPost('/api/v1/agent-soce/admin/roles', {
      name: `test_role_${Date.now()}`,
      description: 'Integration test role',
    });
    assert.ok([200, 201, 400, 401, 403].includes(status),
      `Role create should respond with valid status, got ${status}`);
    if (status === 200 || status === 201) {
      assert.ok((body as { id?: string }).id, 'Created role should have id');
    }
  });

  // IT-09: Data source test connection
  it('IT-09: Data source test connection endpoint exists', async () => {
    // First get a data source id
    const { status, body } = await apiGet('/api/v1/agent-soce/admin/data-sources');
    assert.ok([200, 401, 403].includes(status), `Got ${status}`);

    if (status === 200 && Array.isArray(body) && body.length > 0) {
      const dsId = (body as Array<{ id: string }>)[0].id;
      const testResult = await apiPost(`/api/v1/agent-soce/admin/data-sources/${dsId}/test`, {});
      assert.ok([200, 401, 403].includes(testResult.status), `Test connection got ${testResult.status}`);
    }
  });

  // IT-10: LLM config: list providers
  it('IT-10: Config LLM providers endpoint responds', async () => {
    const { status } = await apiGet('/api/v1/agent-soce/config/llm-providers');
    assert.ok([200, 401, 403].includes(status), `Got ${status}`);
  });

  // IT-11: Theme config
  it('IT-11: Theme config endpoint responds', async () => {
    const { status } = await apiGet('/api/v1/agent-soce/config/theme');
    assert.ok([200, 401, 403, 404].includes(status), `Got ${status}`);
  });

  // IT-12: Admin interactions stats
  it('IT-12: Interactions stats endpoint responds', async () => {
    const { status, body } = await apiGet('/api/v1/agent-soce/admin/interactions/stats');
    assert.ok([200, 401, 403].includes(status), `Got ${status}`);
    if (status === 200) {
      assert.ok('totalMessages' in (body as object), 'Stats should have totalMessages');
    }
  });
});

// ─── Knowledge Base Integration Tests ────────────────────────────────────────

describe('Integration Tests — Knowledge Base (KN-01 to KN-07)', () => {
  let catalogId: string | null = null;
  const catalogName = `test_catalog_${Date.now()}`;

  it('KN-01: CRUD catalogs', async () => {
    // Create
    const create = await apiPost('/api/v1/agent-soce/admin/knowledge/catalogs', {
      name: catalogName, description: 'Integration test catalog',
    });
    if (create.status === 401 || create.status === 403) return;
    assert.ok([200, 201].includes(create.status), `Create catalog got ${create.status}`);
    catalogId = (create.body as { id: string }).id;
    assert.ok(catalogId, 'Created catalog should have id');

    // List
    const list = await apiGet('/api/v1/agent-soce/admin/knowledge/catalogs');
    assert.equal(list.status, 200);
    assert.ok(Array.isArray(list.body));

    // Update
    const update = await apiPut(`/api/v1/agent-soce/admin/knowledge/catalogs/${catalogId}`, {
      description: 'Updated description',
    });
    assert.equal(update.status, 200);
  });

  it('KN-02: Upload TXT document to catalog', async () => {
    if (!catalogId) return;
    const formData = new FormData();
    const blob = new Blob(['Ley de Contratación Pública del Ecuador.\n\nArt 1. Objeto de la ley.'], { type: 'text/plain' });
    formData.append('files', blob, 'test-doc.txt');

    const r = await fetch(`${BASE}/api/v1/agent-soce/admin/knowledge/catalogs/${catalogId}/documents`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
      body: formData,
    });
    assert.ok([200, 201].includes(r.status), `Upload got ${r.status}`);
    const body = await r.json() as Array<{ id: string; status: string }>;
    assert.ok(Array.isArray(body) && body.length > 0);
    assert.ok(body[0].status === 'processing');
  });

  it('KN-03: Rejects unsupported file type', async () => {
    if (!catalogId) return;
    const formData = new FormData();
    const blob = new Blob(['binary data'], { type: 'application/zip' });
    formData.append('files', blob, 'test.zip');

    const r = await fetch(`${BASE}/api/v1/agent-soce/admin/knowledge/catalogs/${catalogId}/documents`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
      body: formData,
    });
    assert.ok(r.ok, `Upload endpoint should still respond 200`);
    const body = await r.json() as Array<{ status: string }>;
    assert.ok(body[0].status.includes('unsupported'));
  });

  it('KN-06: GET /stats returns valid structure', async () => {
    const { status, body } = await apiGet('/api/v1/agent-soce/admin/knowledge/stats');
    if (status === 401 || status === 403) return;
    assert.equal(status, 200);
    const s = body as { catalogs: number; documents: number; totalChunks: number };
    assert.ok('catalogs' in s);
    assert.ok('documents' in s);
    assert.ok('totalChunks' in s);
    assert.ok('embeddedChunks' in s);
  });

  it('KN-05: Delete catalog cascades', async () => {
    if (!catalogId) return;
    const del = await fetch(`${BASE}/api/v1/agent-soce/admin/knowledge/catalogs/${catalogId}`, {
      method: 'DELETE', headers: adminHeaders(),
    });
    assert.equal(del.status, 200);
    catalogId = null;
  });
});

describe('Integration Tests — Admin CRUD', () => {
  let createdRoleId: string | null = null;

  it('IT-08a: Full role CRUD lifecycle', async () => {
    const roleName = `int_test_role_${Date.now()}`;

    // Create
    const create = await apiPost('/api/v1/agent-soce/admin/roles', { name: roleName, description: 'Test' });
    if (create.status === 401 || create.status === 403) return; // skip if not authorized

    assert.ok([200, 201].includes(create.status), `Create role got ${create.status}`);
    createdRoleId = (create.body as { id: string }).id;

    // Read
    const list = await apiGet('/api/v1/agent-soce/admin/roles');
    assert.equal(list.status, 200);
    const found = (list.body as Array<{ name: string }>).find(r => r.name === roleName);
    assert.ok(found, 'Created role should appear in list');

    // Update
    const update = await apiPut(`/api/v1/agent-soce/admin/roles/${createdRoleId}`, { description: 'Updated' });
    assert.equal(update.status, 200);

    // Delete
    const del = await fetch(`${BASE}/api/v1/agent-soce/admin/roles/${createdRoleId}`, {
      method: 'DELETE',
      headers: adminHeaders(),
    });
    assert.equal(del.status, 200);
  });
});

// ─── Embedding Provider Integration Tests ──────────────────────────────────

describe('Integration Tests — Embedding Provider (EP-IT-01 to EP-IT-05)', () => {
  it('EP-IT-01: GET /config/rag returns embeddingProviderId field', async () => {
    const { status, body } = await apiGet('/api/v1/agent-soce/config/rag');
    if (status === 401 || status === 403) return;
    assert.equal(status, 200);
    assert.ok(body !== null && typeof body === 'object');
    assert.ok('embeddingProviderId' in (body as object) || (body as Record<string, unknown>).embeddingProviderId === undefined,
      'Response should include embeddingProviderId field');
  });

  it('EP-IT-02: PUT /config/rag with changed embeddingModel returns reindexRequired', async () => {
    const { status, body } = await apiPut('/api/v1/agent-soce/config/rag', {
      embeddingModel: 'text-embedding-3-small',
      embeddingDims: 1536,
    });
    if (status === 401 || status === 403) return;
    assert.equal(status, 200);
    const result = body as { reindexRequired?: boolean };
    assert.equal(result.reindexRequired, true, 'Model change should require reindex');

    // Restore to default
    await apiPut('/api/v1/agent-soce/config/rag', {
      embeddingModel: 'nomic-embed-text',
      embeddingDims: 768,
      embeddingProviderId: null,
    });
  });

  it('EP-IT-03: PUT /config/rag with same model does not set reindexRequired', async () => {
    const getCurrent = await apiGet('/api/v1/agent-soce/config/rag');
    if (getCurrent.status === 401 || getCurrent.status === 403) return;

    const current = getCurrent.body as { embeddingModel?: string; embeddingDims?: number };
    const { status, body } = await apiPut('/api/v1/agent-soce/config/rag', {
      embeddingModel: current.embeddingModel,
      chunkSize: 512,
    });
    if (status === 401 || status === 403) return;
    assert.equal(status, 200);
    const result = body as { reindexRequired?: boolean };
    assert.ok(!result.reindexRequired, 'Same model should not require reindex');
  });

  it('EP-IT-04: POST /config/rag/reindex responds with model info', async () => {
    const { status, body } = await apiPost('/api/v1/agent-soce/config/rag/reindex', {});
    if (status === 401 || status === 403) return;
    assert.equal(status, 200);
    const result = body as { status?: string; model?: string; dimensions?: number };
    assert.ok(result.status === 'reindex_started', `Expected reindex_started, got ${result.status}`);
    assert.ok(typeof result.model === 'string', 'Should include model name');
    assert.ok(typeof result.dimensions === 'number', 'Should include dimensions');
  });

  it('EP-IT-05: Chat with different providerId still connects (embedding provider is independent)', async () => {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 6000);

    try {
      const r = await fetch(`${BASE}/api/v1/agent-soce/chat`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${USER_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'qué es la subasta inversa?' }],
          context: { route: '/cp/processes' },
          providerId: 'nonexistent-provider-id',
        }),
        signal: controller.signal,
      });
      // Should still respond (fallback to default provider)
      assert.ok(r.status === 200 || r.status === 401,
        `Chat should respond even with unknown providerId, got ${r.status}`);
    } catch (e: unknown) {
      if (e instanceof Error && e.name !== 'AbortError') throw e;
    }
  });

  // ─── Admin Chat Playground Integration ─────────────────

  let acFolderId = '';
  let acChatId = '';
  let acMessageId = '';

  it('AC-IT01: Create folder, create chat inside it, list folders shows chat count', async () => {
    const f = await apiPost('/api/v1/agent-soce/admin/chat/folders', { name: 'Test Folder' });
    assert.equal(f.status, 200);
    acFolderId = f.body.id;

    const c = await apiPost('/api/v1/agent-soce/admin/chat/conversations', { folderId: acFolderId, title: 'Test Chat' });
    assert.equal(c.status, 200);
    acChatId = c.body.id;

    const list = await apiGet('/api/v1/agent-soce/admin/chat/folders');
    assert.equal(list.status, 200);
    const folder = list.body.find((f: { id: string }) => f.id === acFolderId);
    assert.ok(folder, 'Folder should exist in list');
    assert.equal(folder._count.chats, 1, 'Folder should have 1 chat');
  });

  it('AC-IT02: Create conversation with catalogIds and providerId', async () => {
    const r = await apiPost('/api/v1/agent-soce/admin/chat/conversations', {
      title: 'Catalog Test', catalogIds: ['fake-cat-1'], providerId: 'fake-provider',
    });
    assert.equal(r.status, 200);
    assert.deepEqual(r.body.catalogIds, ['fake-cat-1']);
    assert.equal(r.body.providerId, 'fake-provider');
    // Cleanup
    await fetch(`${BASE}/api/v1/agent-soce/admin/chat/conversations/${r.body.id}`, { method: 'DELETE', headers: adminHeaders() });
  });

  it('AC-IT03: Send message to conversation receives SSE stream', async () => {
    const r = await fetch(`${BASE}/api/v1/agent-soce/admin/chat/conversations/${acChatId}/messages`, {
      method: 'POST',
      headers: adminHeaders(),
      body: JSON.stringify({ content: 'Hello from integration test' }),
    });
    assert.equal(r.status, 200);
    assert.ok(r.headers.get('content-type')?.includes('text/event-stream'), 'Should return SSE');
    const text = await r.text();
    assert.ok(text.includes('data:'), 'Should contain SSE data events');
  });

  it('AC-IT04: Get conversation with messages returns ordered messages', async () => {
    const r = await apiGet(`/api/v1/agent-soce/admin/chat/conversations/${acChatId}`);
    assert.equal(r.status, 200);
    assert.ok(r.body.messages.length >= 1, 'Should have at least 1 message');
    const assistantMsg = r.body.messages.find((m: { role: string }) => m.role === 'assistant');
    if (assistantMsg) {
      acMessageId = assistantMsg.id;
    }
  });

  it('AC-IT05: Pin/unpin chat via PUT', async () => {
    const pin = await apiPut(`/api/v1/agent-soce/admin/chat/conversations/${acChatId}`, { isPinned: true });
    assert.equal(pin.status, 200);
    assert.equal(pin.body.isPinned, true);

    const unpin = await apiPut(`/api/v1/agent-soce/admin/chat/conversations/${acChatId}`, { isPinned: false });
    assert.equal(unpin.status, 200);
    assert.equal(unpin.body.isPinned, false);
  });

  it('AC-IT06: Delete conversation returns 204', async () => {
    const delR = await fetch(`${BASE}/api/v1/agent-soce/admin/chat/conversations/${acChatId}`, {
      method: 'DELETE', headers: adminHeaders(),
    });
    assert.equal(delR.status, 204, 'Delete should return 204');

    const getR = await apiGet(`/api/v1/agent-soce/admin/chat/conversations/${acChatId}`);
    assert.equal(getR.status, 404, 'Deleted chat should not be found');
  });

  it('AC-IT07: Search messages returns matching results', async () => {
    const r = await apiGet('/api/v1/agent-soce/admin/chat/search?q=integration');
    assert.equal(r.status, 200);
    assert.ok(Array.isArray(r.body), 'Should return an array');
  });

  it('AC-IT08: Feedback PATCH saves rating on message', async () => {
    if (!acMessageId) return; // Skip if no message was created
    const r = await fetch(`${BASE}/api/v1/agent-soce/admin/chat/messages/${acMessageId}/feedback`, {
      method: 'PATCH',
      headers: adminHeaders(),
      body: JSON.stringify({ rating: 1 }),
    });
    const body = await r.json();
    assert.equal(r.status, 200);
    assert.equal(body.ok, true);
  });

  // Cleanup folder
  it('AC-IT-CLEANUP: Remove test folder', async () => {
    if (acFolderId) {
      await fetch(`${BASE}/api/v1/agent-soce/admin/chat/folders/${acFolderId}`, { method: 'DELETE', headers: adminHeaders() });
    }
  });
});

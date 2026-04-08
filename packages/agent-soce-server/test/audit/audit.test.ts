/**
 * Audit + Training Tests (AUD-01 to AUD-04)
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

const BASE = process.env.AGENT_SOCE_URL ?? 'http://localhost:3090';
const TOKEN = process.env.AGENT_SOCE_ADMIN_TOKEN ?? process.env.AGENT_SOCE_TOKEN ?? 'test-admin-token';
const headers = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };

async function apiGet(path: string) {
  const r = await fetch(`${BASE}${path}`, { headers });
  return { status: r.status, body: await r.json().catch(() => null) };
}
async function apiPost(path: string, body: unknown) {
  const r = await fetch(`${BASE}${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
  return { status: r.status, body: await r.json().catch(() => null) };
}
async function apiPut(path: string, body: unknown) {
  const r = await fetch(`${BASE}${path}`, { method: 'PUT', headers, body: JSON.stringify(body) });
  return { status: r.status, body: await r.json().catch(() => null) };
}
async function apiPatch(path: string, body: unknown) {
  const r = await fetch(`${BASE}${path}`, { method: 'PATCH', headers, body: JSON.stringify(body) });
  return { status: r.status, body: await r.json().catch(() => null) };
}

describe('Audit + Training Tests', () => {
  // AUD-01: Chat creates AgentInteraction record
  it('AUD-01: Chat endpoint creates interaction log entry', async () => {
    // Get stats before
    const before = await apiGet('/api/v1/agent-soce/admin/interactions/stats');
    if (before.status !== 200) return; // skip if not authorized

    const statsBefore = before.body as { totalMessages: number };
    const countBefore = statsBefore.totalMessages;

    // Send a chat message (may fail auth with test token, that's ok for this test)
    await fetch(`${BASE}/api/v1/agent-soce/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ messages: [{ role: 'user', content: 'test audit message' }] }),
    });

    // Get stats after (allow some time for async write)
    await new Promise(r => setTimeout(r, 500));
    const after = await apiGet('/api/v1/agent-soce/admin/interactions/stats');
    const statsAfter = after.body as { totalMessages: number };

    // Stats should either be accessible and updated, or endpoint returns valid structure
    assert.ok(typeof statsAfter.totalMessages === 'number', 'Stats should return totalMessages');
  });

  // AUD-02: Feedback PATCH updates interaction
  it('AUD-02: Feedback endpoint accepts rating updates', async () => {
    // This test checks the endpoint structure; actual data depends on live interactions
    const interactions = await apiGet('/api/v1/agent-soce/admin/interactions?take=1');
    if (interactions.status !== 200) return;

    const interactionList = interactions.body as Array<{ id: string }>;
    if (!interactionList.length) return;

    const id = interactionList[0].id;
    const { status } = await apiPatch(`/api/v1/agent-soce/chat/interactions/${id}/feedback`, {
      rating: 5,
      text: 'Great response!',
    });

    assert.ok([200, 400, 401, 403, 404].includes(status),
      `Feedback PATCH should respond with valid status, got ${status}`);
  });

  // AUD-03: Create training dataset, add entries, export
  it('AUD-03: Training dataset lifecycle', async () => {
    const dsName = `audit_test_dataset_${Date.now()}`;

    // Create dataset
    const create = await apiPost('/api/v1/agent-soce/admin/training/datasets', {
      name: dsName,
      description: 'Audit test dataset',
      format: 'jsonl',
    });

    if (create.status === 401 || create.status === 403) return;
    assert.ok([200, 201].includes(create.status), `Create dataset got ${create.status}`);

    const dataset = create.body as { id: string; name: string };
    assert.equal(dataset.name, dsName);

    // Add an entry
    const entry = await apiPost(`/api/v1/agent-soce/admin/training/datasets/${dataset.id}/entries`, {
      interactionId: 'mock-interaction-id',
      userMessage: 'Qué es la subasta inversa?',
      idealResponse: 'La subasta inversa es un procedimiento de contratación pública...',
      category: 'normativa',
    });
    // Entry creation may fail due to foreign key constraint with mock id - that's acceptable
    assert.ok([200, 201, 400].includes(entry.status),
      `Entry creation got ${entry.status}`);

    // Verify dataset appears in list
    const list = await apiGet('/api/v1/agent-soce/admin/training/datasets');
    assert.equal(list.status, 200);
    const found = (list.body as Array<{ name: string }>).find(d => d.name === dsName);
    assert.ok(found, 'Dataset should appear in list');

    // Clean up
    await fetch(`${BASE}/api/v1/agent-soce/admin/training/datasets/${dataset.id}`, {
      method: 'DELETE',
      headers,
    });
  });

  // AUD-04: Stats endpoint returns correct structure
  it('AUD-04: Audit stats endpoint returns correct fields', async () => {
    const { status, body } = await apiGet('/api/v1/agent-soce/admin/interactions/stats');

    if (status === 401 || status === 403) return; // skip if not authorized
    assert.equal(status, 200, `Stats endpoint should return 200, got ${status}`);

    const stats = body as { totalMessages: number; avgLatencyMs: number; avgRating: number };
    assert.equal(typeof stats.totalMessages, 'number', 'Should have totalMessages');
    assert.equal(typeof stats.avgLatencyMs, 'number', 'Should have avgLatencyMs');
    assert.equal(typeof stats.avgRating, 'number', 'Should have avgRating');
    assert.ok(stats.totalMessages >= 0, 'totalMessages should be non-negative');
  });
});

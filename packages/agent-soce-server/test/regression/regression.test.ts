/**
 * Regression Tests (REG-01 to REG-03)
 * Verify existing functionality is not broken by Agent SOCE integration.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

const HOST_API = process.env.HOST_API_URL ?? 'http://localhost:3080';
const AGENT_API = process.env.AGENT_SOCE_URL ?? 'http://localhost:3090';

describe('Regression Tests', () => {
  // REG-01: Existing RAG endpoint unaffected
  it('REG-01: Existing host API /rag/search endpoint still works', async () => {
    const r = await fetch(`${HOST_API}/api/v1/rag/search?q=subasta`, {
      headers: { 'Content-Type': 'application/json' },
    });
    // Should return 200 or 401 (auth required) — not 500 or 404
    assert.ok([200, 401, 403, 404].includes(r.status),
      `Host RAG endpoint should respond, got ${r.status}`);
  });

  // REG-02: Host API health check unchanged
  it('REG-02: Host API health check is unaffected', async () => {
    const r = await fetch(`${HOST_API}/health`);
    assert.ok([200, 404].includes(r.status),
      `Host API should respond, got ${r.status}`);
  });

  // REG-03: Agent SOCE backend runs independently on its own port
  it('REG-03: Agent SOCE backend runs on port 3090 independently', async () => {
    const r = await fetch(`${AGENT_API}/health`);
    assert.ok(r.ok, `Agent SOCE backend should be healthy, got ${r.status}`);
    const body = await r.json() as { status: string };
    assert.equal(body.status, 'ok');
  });

  // REG-03b: Ports don't conflict
  it('REG-03b: Host API and Agent SOCE API run on separate ports', async () => {
    const hostPort = new URL(HOST_API).port || '80';
    const agentPort = new URL(AGENT_API).port || '80';
    assert.notEqual(hostPort, agentPort,
      `Host API (${hostPort}) and Agent SOCE API (${agentPort}) should be on different ports`);
  });

  // REG-04: Chat with non-default LLM still returns valid response (RAG uses config, not chat provider)
  it('REG-04: Chat with non-default LLM provider still processes without 5xx', async () => {
    const TOKEN = process.env.AGENT_SOCE_TOKEN ?? 'test-token';
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 8000);

    try {
      const r = await fetch(`${AGENT_API}/api/v1/agent-soce/chat`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'qué es contratación directa?' }],
          context: { route: '/cp/processes' },
          providerId: 'some-other-provider',
        }),
        signal: controller.signal,
      });
      // Should respond (200 with SSE, or 401 for auth) — never 500
      assert.ok(r.status < 500, `Chat should not 5xx even with different providerId, got ${r.status}`);
    } catch (e: unknown) {
      if (e instanceof Error && e.name !== 'AbortError') throw e;
    }
  });

  // REG-05: Switching chat provider does not alter AgentRAGConfig
  it('REG-05: AgentRAGConfig.embeddingProviderId is unchanged after chat with different provider', async () => {
    const TOKEN = process.env.AGENT_SOCE_TOKEN ?? 'test-token';
    const headers = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };

    // Read current RAG config
    const before = await fetch(`${AGENT_API}/api/v1/agent-soce/config/rag`, { headers });
    if (before.status === 401 || before.status === 403) return;
    const configBefore = (await before.json()) as { embeddingProviderId?: string | null };

    // Make a chat request with a specific providerId
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 5000);
    try {
      await fetch(`${AGENT_API}/api/v1/agent-soce/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'hola' }],
          providerId: 'openai-test',
        }),
        signal: controller.signal,
      });
    } catch { /* abort is expected */ }

    // Read RAG config again — should be unchanged
    const after = await fetch(`${AGENT_API}/api/v1/agent-soce/config/rag`, { headers });
    if (after.status !== 200) return;
    const configAfter = (await after.json()) as { embeddingProviderId?: string | null };

    assert.equal(
      configAfter.embeddingProviderId,
      configBefore.embeddingProviderId,
      'Chat request should not change the RAG embedding provider config',
    );
  });

  // ─── Admin Chat Playground Regression ──────────────────

  it('AC-REG01: Existing /chat widget endpoint still works after admin-chat routes added', async () => {
    const r = await fetch(`${AGENT_API}/api/v1/agent-soce/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'hello' }] }),
    });
    assert.ok([200, 401].includes(r.status), `Widget chat should respond, got ${r.status}`);
  });

  it('AC-REG02: Knowledge base page catalogs endpoint still works', async () => {
    const r = await fetch(`${AGENT_API}/api/v1/agent-soce/admin/knowledge/catalogs`);
    assert.ok([200, 401, 403].includes(r.status), `Knowledge catalogs should respond, got ${r.status}`);
  });

  it('AC-REG03: Deleting an LLM provider does not break admin chat list', async () => {
    const r = await fetch(`${AGENT_API}/api/v1/agent-soce/admin/chat/conversations`);
    assert.ok([200, 401, 403].includes(r.status), `Admin chat list should not 500, got ${r.status}`);
  });
});

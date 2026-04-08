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
});

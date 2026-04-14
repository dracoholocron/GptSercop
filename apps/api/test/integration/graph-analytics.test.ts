/**
 * Integration tests — Graph Analytics API extension.
 * Requires API running (e.g. http://localhost:3080). Uses JWT when available;
 * with AUTH_DISABLED=true, requests succeed without a token.
 *
 * When the API is not reachable, all cases are skipped (see `before` + `testApi`).
 */
import test, { before } from 'node:test';
import assert from 'node:assert/strict';

const API = process.env.API_URL || process.env.INTEGRATION_BASE_URL || 'http://localhost:3080';

let apiAvailable = false;

before(async () => {
  try {
    const r = await fetch(`${API}/health`, { signal: AbortSignal.timeout(3000) });
    apiAvailable = r.ok;
  } catch {
    apiAvailable = false;
  }
});

function testApi(name: string, fn: () => void | Promise<void>): void {
  test(name, async (t) => {
    if (!apiAvailable) return t.skip(`API not reachable at ${API}`);
    await fn();
  });
}

let tokenCache: string | undefined;
let tokenAttempted = false;

async function getToken(): Promise<string | undefined> {
  if (tokenAttempted) return tokenCache;
  tokenAttempted = true;
  try {
    const resp = await fetch(`${API}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@mec.gob.ec', role: 'admin' }),
    });
    if (!resp.ok) return undefined;
    const data = (await resp.json()) as { token?: string };
    tokenCache = typeof data.token === 'string' ? data.token : undefined;
    return tokenCache;
  } catch {
    return undefined;
  }
}

async function authGet(path: string, token?: string): Promise<Response> {
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(`${API}/api/v1/analytics${path}`, { headers });
}

async function firstProviderId(): Promise<string | undefined> {
  const res = await fetch(`${API}/api/v1/providers`);
  if (!res.ok) return undefined;
  const body = (await res.json()) as { data?: Array<{ id: string }> };
  return body.data?.[0]?.id;
}

// ---- Graph overview (1–7) ----

testApi('GET /graph-analytics/overview returns 200', async () => {
  const token = await getToken();
  const res = await authGet('/graph-analytics/overview', token);
  assert.strictEqual(res.status, 200);
});

testApi('Overview has totalProviders >= 0', async () => {
  const token = await getToken();
  const body = (await authGet('/graph-analytics/overview', token).then((r) => r.json())) as {
    totalProviders: number;
  };
  assert.ok(typeof body.totalProviders === 'number');
  assert.ok(body.totalProviders >= 0);
});

testApi('Overview has totalRelations >= 0', async () => {
  const token = await getToken();
  const body = (await authGet('/graph-analytics/overview', token).then((r) => r.json())) as {
    totalRelations: number;
  };
  assert.ok(body.totalRelations >= 0);
});

testApi('Overview has totalCommunities >= 0', async () => {
  const token = await getToken();
  const body = (await authGet('/graph-analytics/overview', token).then((r) => r.json())) as {
    totalCommunities: number;
  };
  assert.ok(body.totalCommunities >= 0);
});

testApi('Overview has avgDegree >= 0', async () => {
  const token = await getToken();
  const body = (await authGet('/graph-analytics/overview', token).then((r) => r.json())) as {
    avgDegree: number;
  };
  assert.ok(body.avgDegree >= 0);
});

testApi('Overview has networkDensity between 0 and 1', async () => {
  const token = await getToken();
  const body = (await authGet('/graph-analytics/overview', token).then((r) => r.json())) as {
    networkDensity: number;
  };
  assert.ok(body.networkDensity >= 0 && body.networkDensity <= 1);
});

testApi('Overview has riskSummary object', async () => {
  const token = await getToken();
  const body = (await authGet('/graph-analytics/overview', token).then((r) => r.json())) as {
    riskSummary: { highRiskNodes: number; collusionCandidates: number; isolatedWinners: number };
  };
  assert.ok(body.riskSummary);
  assert.ok(typeof body.riskSummary.highRiskNodes === 'number');
  assert.ok(typeof body.riskSummary.collusionCandidates === 'number');
  assert.ok(typeof body.riskSummary.isolatedWinners === 'number');
});

// ---- Collusion (8–11) ----

testApi('GET /graph-analytics/collusion returns 200', async () => {
  const token = await getToken();
  const res = await authGet('/graph-analytics/collusion', token);
  assert.strictEqual(res.status, 200);
});

testApi('Collusion response has data array', async () => {
  const token = await getToken();
  const body = (await authGet('/graph-analytics/collusion', token).then((r) => r.json())) as {
    data: unknown[];
    total: number;
  };
  assert.ok(Array.isArray(body.data));
  assert.strictEqual(typeof body.total, 'number');
});

testApi('Collusion candidates have riskLevel in CRITICAL | WARNING | INFO', async () => {
  const token = await getToken();
  const body = (await authGet('/graph-analytics/collusion', token).then((r) => r.json())) as {
    data: Array<{ riskLevel: string }>;
  };
  const allowed = new Set(['CRITICAL', 'WARNING', 'INFO']);
  for (const c of body.data) {
    assert.ok(allowed.has(c.riskLevel), `unexpected riskLevel ${c.riskLevel}`);
  }
});

testApi('Collusion candidates have members array', async () => {
  const token = await getToken();
  const body = (await authGet('/graph-analytics/collusion', token).then((r) => r.json())) as {
    data: Array<{ members: unknown[] }>;
  };
  for (const c of body.data) {
    assert.ok(Array.isArray(c.members));
  }
});

// ---- Centrality (12–16) ----

testApi('GET /graph-analytics/centrality returns 200', async () => {
  const token = await getToken();
  const res = await authGet('/graph-analytics/centrality', token);
  assert.strictEqual(res.status, 200);
});

testApi('Centrality response has data array', async () => {
  const token = await getToken();
  const body = (await authGet('/graph-analytics/centrality', token).then((r) => r.json())) as {
    data: unknown[];
  };
  assert.ok(Array.isArray(body.data));
});

testApi('Centrality items have pageRank >= 0', async () => {
  const token = await getToken();
  const body = (await authGet('/graph-analytics/centrality', token).then((r) => r.json())) as {
    data: Array<{ pageRank: number }>;
  };
  for (const row of body.data) {
    assert.ok(row.pageRank >= 0);
  }
});

testApi('Centrality items have degree >= 0', async () => {
  const token = await getToken();
  const body = (await authGet('/graph-analytics/centrality', token).then((r) => r.json())) as {
    data: Array<{ degree: number }>;
  };
  for (const row of body.data) {
    assert.ok(row.degree >= 0);
  }
});

testApi('GET /graph-analytics/centrality?limit=5 returns at most 5 items', async () => {
  const token = await getToken();
  const res = await authGet('/graph-analytics/centrality?limit=5', token);
  assert.strictEqual(res.status, 200);
  const body = (await res.json()) as { data: unknown[] };
  assert.ok(body.data.length <= 5);
});

// ---- Ego network (17–19) ----

testApi('GET /graph-analytics/provider/:id/network returns 200 for valid provider', async () => {
  const token = await getToken();
  const pid = await firstProviderId();
  if (!pid) {
    console.log('  skip: no providers returned from /api/v1/providers');
    return;
  }
  const res = await authGet(`/graph-analytics/provider/${pid}/network`, token);
  assert.strictEqual(res.status, 200);
});

testApi('GET /graph-analytics/provider/nonexistent/network returns 404', async () => {
  const token = await getToken();
  const res = await authGet('/graph-analytics/provider/nonexistent-id-xyz-404/network', token);
  assert.strictEqual(res.status, 404);
});

testApi('Ego network has center, nodes, edges', async () => {
  const token = await getToken();
  const pid = await firstProviderId();
  if (!pid) {
    console.log('  skip: no providers for ego network shape');
    return;
  }
  const body = (await authGet(`/graph-analytics/provider/${pid}/network`, token).then((r) =>
    r.json(),
  )) as {
    center: { id: string; name: string };
    nodes: unknown[];
    edges: unknown[];
  };
  assert.ok(body.center?.id);
  assert.ok(typeof body.center.name === 'string');
  assert.ok(Array.isArray(body.nodes));
  assert.ok(Array.isArray(body.edges));
});

// ---- Risk propagation (20–21) ----

testApi('GET /graph-analytics/risk-propagation returns 200', async () => {
  const token = await getToken();
  const res = await authGet('/graph-analytics/risk-propagation', token);
  assert.strictEqual(res.status, 200);
});

testApi('Risk propagation has data array', async () => {
  const token = await getToken();
  const body = (await authGet('/graph-analytics/risk-propagation', token).then((r) => r.json())) as {
    data: unknown[];
  };
  assert.ok(Array.isArray(body.data));
});

// ---- Backward compatibility — core analytics (22+) ----

async function expect200AnalyticsPath(path: string, token?: string): Promise<void> {
  const res = await authGet(path, token);
  assert.strictEqual(res.status, 200, `expected 200 for ${path}, got ${res.status}`);
}

testApi('Backward compat: GET /analytics/dashboard returns 200', async () => {
  const token = await getToken();
  await expect200AnalyticsPath('/dashboard', token);
});

testApi('Backward compat: GET /analytics/risk-scores returns 200', async () => {
  const token = await getToken();
  await expect200AnalyticsPath('/risk-scores', token);
});

testApi('Backward compat: GET /analytics/competition returns 200', async () => {
  const token = await getToken();
  await expect200AnalyticsPath('/competition', token);
});

testApi('Backward compat: GET /analytics/market returns 200', async () => {
  const token = await getToken();
  await expect200AnalyticsPath('/market', token);
});

testApi('Backward compat: GET /analytics/alerts returns 200', async () => {
  const token = await getToken();
  await expect200AnalyticsPath('/alerts', token);
});

testApi('Backward compat: GET /analytics/pac-vs-executed returns 200', async () => {
  const token = await getToken();
  await expect200AnalyticsPath('/pac-vs-executed', token);
});

testApi('Backward compat: GET /analytics/provider-network returns 200', async () => {
  const token = await getToken();
  await expect200AnalyticsPath('/provider-network', token);
});

testApi('Risk scores endpoint includes flags field on rows', async () => {
  const token = await getToken();
  const res = await authGet('/risk-scores?limit=5', token);
  assert.strictEqual(res.status, 200);
  const body = (await res.json()) as { data: Array<{ flags?: unknown }> };
  assert.ok(Array.isArray(body.data));
  if (body.data.length > 0) {
    assert.ok(Array.isArray(body.data[0].flags), 'flags should be an array when rows exist');
  }
});

testApi('Overview includes topCommunities array', async () => {
  const token = await getToken();
  const body = (await authGet('/graph-analytics/overview', token).then((r) => r.json())) as {
    topCommunities: unknown[];
  };
  assert.ok(Array.isArray(body.topCommunities));
});

testApi('Centrality items include providerId and providerName', async () => {
  const token = await getToken();
  const body = (await authGet('/graph-analytics/centrality?limit=3', token).then((r) => r.json())) as {
    data: Array<{ providerId: string; providerName: string }>;
  };
  for (const row of body.data) {
    assert.ok(typeof row.providerId === 'string');
    assert.ok(typeof row.providerName === 'string');
  }
});

// ---- Visual Network (NEW) ----

testApi('GET /graph-analytics/visual-network returns 200 with nodes, links, stats', async () => {
  const token = await getToken();
  const res = await authGet('/graph-analytics/visual-network', token);
  assert.strictEqual(res.status, 200);
  const body = (await res.json()) as {
    nodes: unknown[]; links: unknown[]; stats: { totalNodes: number; totalLinks: number; communities: number };
  };
  assert.ok(Array.isArray(body.nodes));
  assert.ok(Array.isArray(body.links));
  assert.ok(typeof body.stats === 'object');
  assert.ok(typeof body.stats.totalNodes === 'number');
  assert.ok(typeof body.stats.totalLinks === 'number');
  assert.ok(typeof body.stats.communities === 'number');
});

testApi('Visual network nodes have required fields', async () => {
  const token = await getToken();
  const body = (await authGet('/graph-analytics/visual-network?limit=5', token).then((r) => r.json())) as {
    nodes: Array<{ id: string; name: string; degree: number; riskLevel: unknown; pageRank: number; communityId: number }>;
  };
  for (const n of body.nodes) {
    assert.ok(typeof n.id === 'string', 'node.id must be string');
    assert.ok(typeof n.name === 'string', 'node.name must be string');
    assert.ok(typeof n.degree === 'number', 'node.degree must be number');
    assert.ok(typeof n.pageRank === 'number', 'node.pageRank must be number');
    assert.ok(typeof n.communityId === 'number', 'node.communityId must be number');
  }
});

testApi('Visual network links have source, target, sharedTenders', async () => {
  const token = await getToken();
  const body = (await authGet('/graph-analytics/visual-network?limit=20', token).then((r) => r.json())) as {
    links: Array<{ source: string; target: string; sharedTenders: number }>;
  };
  for (const l of body.links) {
    assert.ok(typeof l.source === 'string', 'link.source must be string');
    assert.ok(typeof l.target === 'string', 'link.target must be string');
    assert.ok(typeof l.sharedTenders === 'number', 'link.sharedTenders must be number');
  }
});

testApi('Visual network ?limit=5 caps nodes at ≤ 5', async () => {
  const token = await getToken();
  const body = (await authGet('/graph-analytics/visual-network?limit=5', token).then((r) => r.json())) as {
    nodes: unknown[];
  };
  assert.ok(body.nodes.length <= 5, `expected ≤5 nodes, got ${body.nodes.length}`);
});

testApi('Visual network ?communityId=0 returns subset', async () => {
  const token = await getToken();
  const full = (await authGet('/graph-analytics/visual-network', token).then((r) => r.json())) as {
    nodes: unknown[];
  };
  const filtered = (await authGet('/graph-analytics/visual-network?communityId=0', token).then((r) => r.json())) as {
    nodes: Array<{ communityId: number }>;
  };
  if (full.nodes.length > 0 && filtered.nodes.length > 0) {
    for (const n of filtered.nodes) {
      assert.strictEqual(n.communityId, 0, 'all nodes should belong to community 0');
    }
  }
});

testApi('Visual network: links only reference nodes in the result set', async () => {
  const token = await getToken();
  const body = (await authGet('/graph-analytics/visual-network?limit=50', token).then((r) => r.json())) as {
    nodes: Array<{ id: string }>; links: Array<{ source: string; target: string }>;
  };
  const nodeIds = new Set(body.nodes.map((n) => n.id));
  for (const l of body.links) {
    assert.ok(nodeIds.has(l.source), `link.source ${l.source} not in node set`);
    assert.ok(nodeIds.has(l.target), `link.target ${l.target} not in node set`);
  }
});

testApi('Visual network: no auth returns 200 or 401 (depending on config)', async () => {
  const res = await authGet('/graph-analytics/visual-network');
  assert.ok([200, 401].includes(res.status), `expected 200 or 401, got ${res.status}`);
});

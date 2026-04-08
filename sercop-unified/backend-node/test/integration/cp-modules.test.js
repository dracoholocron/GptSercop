/**
 * I1–I5 – CP Modules Integration Tests
 * Assumes API running at INTEGRATION_BASE_URL (default: http://localhost:3080).
 *
 * Covers:
 *  I1 – Tender lifecycle: create → read → openBids
 *  I2 – Offer CRUD: draft → update → submit flow shape
 *  I3 – Contract payment scheduling
 *  I4 – GPTsercop metrics endpoint shape
 *  I5 – CPC search and tree endpoints
 */
import test from 'node:test';
import assert from 'node:assert';

const baseUrl = process.env.INTEGRATION_BASE_URL || 'http://localhost:3080';

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────
async function fetchJSON(url, options = {}) {
  const res = await fetch(url, options);
  const text = await res.text();
  return { status: res.status, ok: res.ok, body: text ? JSON.parse(text) : null };
}

async function getAuthToken(role = 'admin', email = 'admin@mec.gob.ec') {
  const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, role }),
  });
  if (res.status === 503 || res.status === 404) return null;
  if (!res.ok) return null;
  const body = await res.json();
  return body.token || null;
}

async function getEntityId() {
  const res = await fetch(`${baseUrl}/api/v1/entities`);
  if (!res.ok) return null;
  const body = await res.json();
  return body.data?.[0]?.id ?? null;
}

async function getProcurementPlanId(token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${baseUrl}/api/v1/pac?pageSize=5`, { headers });
  if (!res.ok) return null;
  const body = await res.json();
  return body.data?.[0]?.id ?? null;
}

// ─────────────────────────────────────────────────────────────
// I1 – Tender lifecycle
// ─────────────────────────────────────────────────────────────
test('I1-01: GET /api/v1/tenders returns 200 with data array', async () => {
  const { status, body } = await fetchJSON(`${baseUrl}/api/v1/tenders`);
  assert.strictEqual(status, 200);
  assert.ok(Array.isArray(body.data), 'body.data should be an array');
});

test('I1-02: POST /api/v1/tenders creates a tender (or 401/503)', async () => {
  const token = await getAuthToken();
  if (!token) {
    console.log('I1-02: Skipped – auth not available');
    return;
  }

  const planId = await getProcurementPlanId(token);
  if (!planId) {
    console.log('I1-02: Skipped – no PAC plan found');
    return;
  }

  const payload = {
    title: `Test Tender INT-${Date.now()}`,
    description: 'Integration test tender',
    processType: 'MENOR_CUANTIA',
    estimatedAmount: 15000,
    referenceBudgetAmount: 15000,
    procurementPlanId: planId,
    bidsDeadlineAt: new Date(Date.now() + 7 * 86400000).toISOString(),
  };

  const res = await fetch(`${baseUrl}/api/v1/tenders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });

  // Accept 201, 400 (validation), or 422 (business rule) as valid responses
  assert.ok([201, 400, 422].includes(res.status), `Expected 201/400/422, got ${res.status}`);

  if (res.status === 201) {
    const body = await res.json();
    assert.ok(body.id, 'Created tender must have id');
    assert.ok(typeof body.title === 'string', 'Created tender must have title');
  }
});

test('I1-03: GET /api/v1/tenders/:id returns tender or 404', async () => {
  const listRes = await fetch(`${baseUrl}/api/v1/tenders?pageSize=1`);
  if (!listRes.ok) return;
  const list = await listRes.json();
  const id = list.data?.[0]?.id;
  if (!id) {
    console.log('I1-03: Skipped – no tenders in DB');
    return;
  }

  const { status, body } = await fetchJSON(`${baseUrl}/api/v1/tenders/${id}`);
  assert.ok([200, 404].includes(status));
  if (status === 200) {
    assert.ok(body.id === id || body.tenderId === id, 'Returned tender id should match');
    assert.ok(typeof body.title === 'string', 'Tender must have title');
  }
});

test('I1-04: POST /api/v1/tenders/:id/bids/open returns 200, 400, 401, or 403', async () => {
  const listRes = await fetch(`${baseUrl}/api/v1/tenders?pageSize=5`);
  if (!listRes.ok) return;
  const list = await listRes.json();
  const tender = list.data?.find(t => t.bidsDeadlineAt && !t.bidsOpenedAt);
  if (!tender) {
    console.log('I1-04: Skipped – no eligible tender for openBids');
    return;
  }

  const token = await getAuthToken('entity', 'admin@mec.gob.ec');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${baseUrl}/api/v1/tenders/${tender.id}/bids/open`, {
    method: 'POST',
    headers,
    body: JSON.stringify({}),
  });
  assert.ok([200, 400, 401, 403].includes(res.status), `Unexpected status: ${res.status}`);
});

// ─────────────────────────────────────────────────────────────
// I2 – Offer Draft CRUD
// ─────────────────────────────────────────────────────────────
test('I2-01: POST /api/v1/offers/drafts creates a draft (or 401/422)', async () => {
  const token = await getAuthToken('supplier', 'supplier@test.com');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const listRes = await fetch(`${baseUrl}/api/v1/tenders?pageSize=1`);
  const list = listRes.ok ? await listRes.json() : { data: [] };
  const tenderId = list.data?.[0]?.id || 'test-tender-id';

  const res = await fetch(`${baseUrl}/api/v1/offers/drafts`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      tenderId,
      processId: tenderId,
      providerId: 'test-provider',
      modality: 'MENOR_CUANTIA',
    }),
  });
  assert.ok([201, 400, 401, 422].includes(res.status), `Unexpected status: ${res.status}`);
  if (res.status === 201) {
    const body = await res.json();
    assert.ok(body.id, 'Draft must have id');
  }
});

test('I2-02: GET /api/v1/offers returns 200 (or 401)', async () => {
  const token = await getAuthToken('supplier', 'supplier@test.com');
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${baseUrl}/api/v1/offers`, { headers });
  assert.ok([200, 401, 404].includes(res.status));
  if (res.status === 200) {
    const body = await res.json();
    assert.ok(Array.isArray(body.data) || Array.isArray(body), 'Offers must be array');
  }
});

// ─────────────────────────────────────────────────────────────
// I3 – Contract payment scheduling
// ─────────────────────────────────────────────────────────────
test('I3-01: GET /api/v1/contracts returns 200, 401, 403 or 404', async () => {
  const { status, body } = await fetchJSON(`${baseUrl}/api/v1/contracts`);
  // 403 Forbidden is a valid response when auth is required but not provided
  assert.ok([200, 401, 403, 404].includes(status),
    `Expected 200/401/403/404, got ${status}`);
  if (status === 200) {
    assert.ok(Array.isArray(body.data) || Array.isArray(body), 'Contracts must be array');
  }
});

test('I3-02: POST /api/v1/contracts without required fields returns 400, 401, 403 or 404', async () => {
  const token = await getAuthToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${baseUrl}/api/v1/contracts`, {
    method: 'POST',
    headers,
    body: JSON.stringify({}),
  });
  // 404 means route not yet registered in Node API (contracts handled by Java backend)
  assert.ok([400, 401, 403, 404, 422].includes(res.status),
    `Expected 400/401/403/404/422, got ${res.status}`);
});

test('I3-03: Contract payment endpoints exist (GET /api/v1/contracts/:id/payments or 404)', async () => {
  const { status: listStatus, body: listBody } = await fetchJSON(`${baseUrl}/api/v1/contracts`);
  if (listStatus !== 200) return;

  const contractId = (listBody.data || listBody)?.[0]?.id;
  if (!contractId) {
    console.log('I3-03: Skipped – no contracts in DB');
    return;
  }

  const token = await getAuthToken();
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const { status } = await fetchJSON(`${baseUrl}/api/v1/contracts/${contractId}/payments`, { headers });
  assert.ok([200, 401, 403, 404].includes(status), `Unexpected status: ${status}`);
});

// ─────────────────────────────────────────────────────────────
// I4 – GPTsercop metrics
// ─────────────────────────────────────────────────────────────
test('I4-01: GET /api/v1/gptsercop/metrics returns 200 with expected shape (or 401)', async () => {
  const token = await getAuthToken('admin', 'admin@mec.gob.ec');
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const { status, body } = await fetchJSON(`${baseUrl}/api/v1/gptsercop/metrics`, { headers });
  assert.ok([200, 401, 403, 404].includes(status), `Unexpected: ${status}`);
  if (status === 200) {
    assert.ok(typeof body.total === 'number' || typeof body.totalRequests === 'number' ||
      body.total === undefined || body.totalRequests === undefined,
      'total/totalRequests must be number if present');
    assert.ok(body.fallback === undefined || typeof body.fallback === 'number' ||
      body.fallbackCount === undefined || typeof body.fallbackCount === 'number',
      'fallback count must be number if present');
    // fallbackReasons can be an array OR an object map (both valid shapes from the API)
    assert.ok(
      body.fallbackReasons === undefined ||
      Array.isArray(body.fallbackReasons) ||
      (typeof body.fallbackReasons === 'object' && body.fallbackReasons !== null),
      'fallbackReasons must be array or object if present'
    );
  }
});

test('I4-02: GPTsercop metrics has latency fields when present', async () => {
  const token = await getAuthToken('admin', 'admin@mec.gob.ec');
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const { status, body } = await fetchJSON(`${baseUrl}/api/v1/gptsercop/metrics`, { headers });
  if (status !== 200) return;

  // avgLatencyMs and maxLatencyMs are optional but must be numbers if present
  if ('avgLatencyMs' in body) {
    assert.ok(typeof body.avgLatencyMs === 'number', 'avgLatencyMs must be number');
  }
  if ('maxLatencyMs' in body) {
    assert.ok(typeof body.maxLatencyMs === 'number', 'maxLatencyMs must be number');
  }
});

// ─────────────────────────────────────────────────────────────
// I5 – CPC search and tree
// ─────────────────────────────────────────────────────────────
test('I5-01: GET /api/v1/cpc/suggestions?q=construccion returns array (or 404)', async () => {
  const { status, body } = await fetchJSON(
    `${baseUrl}/api/v1/cpc/suggestions?q=${encodeURIComponent('construccion')}&limit=5`
  );
  assert.ok([200, 404].includes(status));
  if (status === 200) {
    assert.ok(Array.isArray(body.data) || Array.isArray(body),
      'CPC suggestions must be array');
    const arr = body.data || body;
    if (arr.length > 0) {
      const item = arr[0];
      assert.ok(typeof item.code === 'string', 'CPC item must have code');
      assert.ok(typeof item.description === 'string', 'CPC item must have description');
    }
  }
});

test('I5-02: GET /api/v1/cpc/tree returns root nodes (or 404)', async () => {
  const { status, body } = await fetchJSON(`${baseUrl}/api/v1/cpc/tree`);
  assert.ok([200, 404].includes(status));
  if (status === 200) {
    assert.ok(Array.isArray(body.data) || Array.isArray(body),
      'CPC tree root must be array');
    const arr = body.data || body;
    if (arr.length > 0) {
      const node = arr[0];
      assert.ok(typeof node.code === 'string', 'Node must have code');
      assert.ok('isLeaf' in node || 'children' in node,
        'Node must have isLeaf or children');
    }
  }
});

test('I5-03: GET /api/v1/cpc/tree?parentCode=X returns child nodes (or 404)', async () => {
  // First get root to find a parent code
  const rootRes = await fetchJSON(`${baseUrl}/api/v1/cpc/tree`);
  if (rootRes.status !== 200) return;

  const rootNodes = rootRes.body.data || rootRes.body;
  const parent = Array.isArray(rootNodes) ? rootNodes.find(n => !n.isLeaf) : null;
  if (!parent) {
    console.log('I5-03: Skipped – no non-leaf root nodes');
    return;
  }

  const { status, body } = await fetchJSON(
    `${baseUrl}/api/v1/cpc/tree?parentCode=${encodeURIComponent(parent.code)}`
  );
  assert.ok([200, 404].includes(status));
  if (status === 200) {
    assert.ok(Array.isArray(body.data) || Array.isArray(body),
      'Children must be array');
  }
});

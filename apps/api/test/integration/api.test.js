/**
 * Pruebas de integración (Fase 0): asumen API en marcha (ej. docker compose up + db:setup).
 * Base URL: INTEGRATION_BASE_URL o http://localhost:3080
 */
import test from 'node:test';
import assert from 'node:assert';

const baseUrl = process.env.INTEGRATION_BASE_URL || 'http://localhost:3080';

async function fetchOk(url, options = {}) {
  const res = await fetch(url, options);
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${text}`);
  return text ? JSON.parse(text) : null;
}

test('GET /health returns 200 and status', async () => {
  const body = await fetchOk(`${baseUrl}/health`);
  assert.ok(body.status === 'ok' || body.status === 'degraded');
  assert.strictEqual(body.service, 'api');
});

test('GET /api/v1/tenders returns 200 and data array', async () => {
  const body = await fetchOk(`${baseUrl}/api/v1/tenders`);
  assert.ok(Array.isArray(body.data));
  if (typeof body.total === 'number') {
    assert.ok(body.page === undefined || typeof body.page === 'number');
    assert.ok(body.pageSize === undefined || typeof body.pageSize === 'number');
  }
});

test('GET /api/v1/tenders?page=1&pageSize=10 returns data array', async () => {
  const body = await fetchOk(`${baseUrl}/api/v1/tenders?page=1&pageSize=10`);
  assert.ok(Array.isArray(body.data));
  if (typeof body.total === 'number') assert.strictEqual(body.page, 1);
  if (typeof body.pageSize === 'number') assert.ok(body.data.length <= body.pageSize);
});

test('GET /api/v1/providers returns 200 and data array', async () => {
  const body = await fetchOk(`${baseUrl}/api/v1/providers`);
  assert.ok(Array.isArray(body.data));
});

test('POST /api/v1/providers with empty name returns 400', async () => {
  let headers = { 'Content-Type': 'application/json' };
  const token = await getToken();
  if (token) headers = { ...headers, Authorization: `Bearer ${token}` };
  const res = await fetch(`${baseUrl}/api/v1/providers`, { method: 'POST', headers, body: '{}' });
  assert.strictEqual(res.status, 400);
});

test('POST /api/v1/providers with name creates provider', async () => {
  let headers = { 'Content-Type': 'application/json' };
  let res = await fetch(`${baseUrl}/api/v1/providers`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: 'Proveedor Integración Test', identifier: '9999999999999' }),
  });
  if (res.status === 401) {
    const token = await getToken();
    assert.ok(token, 'Auth required but login failed');
    headers = { ...headers, Authorization: `Bearer ${token}` };
    res = await fetch(`${baseUrl}/api/v1/providers`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: 'Proveedor Integración Test', identifier: '9999999999999' }),
    });
  }
  assert.strictEqual(res.status, 201);
  const body = await res.json();
  assert.ok(body.id);
  assert.strictEqual(body.name, 'Proveedor Integración Test');
});

async function getToken() {
  const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test@test.com', role: 'supplier' }),
  });
  if (res.status === 503) return null;
  if (!res.ok) return null;
  const data = await res.json();
  return data.token || null;
}

test('POST /api/v1/auth/login returns token when JWT configured', async () => {
  const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test@test.com', role: 'entity' }),
  });
  if (res.status === 503) return;
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.ok(data.token);
});

test('POST protected route without token returns 401 when auth on, or 201/400 when auth off', async () => {
  const res = await fetch(`${baseUrl}/api/v1/pac`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ entityId: '00000000-0000-0000-0000-000000000001', year: 2026 }),
  });
  assert.ok([400, 401, 201, 503].includes(res.status), `Unexpected status ${res.status}`);
});

test('GET /api/v1/pac returns 200 and data array', async () => {
  const body = await fetchOk(`${baseUrl}/api/v1/pac`);
  assert.ok(Array.isArray(body.data));
});

test('GET /api/v1/tenders/:id/bids returns 200 and data array', async () => {
  const tenders = await fetchOk(`${baseUrl}/api/v1/tenders`);
  if (tenders.data.length === 0) return;
  const bids = await fetchOk(`${baseUrl}/api/v1/tenders/${tenders.data[0].id}/bids`);
  assert.ok(Array.isArray(bids.data));
});

test('GET /api/v1/rag/search returns 200 and results array', async () => {
  const body = await fetchOk(`${baseUrl}/api/v1/rag/search?q=contratacion`);
  assert.ok(Array.isArray(body.results));
  if (body.results.length > 0) {
    assert.ok(typeof body.results[0].title === 'string');
    assert.ok(typeof body.results[0].snippet === 'string');
  }
});

test('GET /api/v1/rag/search responds within 2 seconds (UX target)', async () => {
  const start = performance.now();
  await fetchOk(`${baseUrl}/api/v1/rag/search?q=normativa`);
  const elapsed = performance.now() - start;
  assert.ok(elapsed < 2000, `RAG search took ${elapsed.toFixed(0)}ms, expected < 2000ms`);
});

test('POST /api/v1/rag/ask returns 200 and answer', async () => {
  const body = await fetchOk(`${baseUrl}/api/v1/rag/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: '¿Qué es un proceso de contratación?' }),
  });
  assert.ok(typeof body.answer === 'string');
  assert.ok(Array.isArray(body.sources));
});

async function getAdminToken() {
  const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@mec.gob.ec', role: 'admin' }),
  });
  if (res.status === 503 || !res.ok) return null;
  const data = await res.json();
  return data.token || null;
}

test('GET /api/v1/users returns 200 with token when route exists', async () => {
  const token = await getAdminToken();
  if (!token) return;
  const res = await fetch(`${baseUrl}/api/v1/users`, { headers: { Authorization: `Bearer ${token}` } });
  if (res.status === 404) return; // API antigua sin ruta /users
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${text}`);
  const body = text ? JSON.parse(text) : null;
  assert.ok(Array.isArray(body.data));
  assert.strictEqual(typeof body.total, 'number');
});

test('GET /api/v1/rag/chunks CRUD with token when route exists', async () => {
  const token = await getAdminToken();
  if (!token) return;
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  const listRes = await fetch(`${baseUrl}/api/v1/rag/chunks`, { headers });
  if (listRes.status === 404) return; // API antigua sin ruta /rag/chunks
  const list = listRes.ok ? (await listRes.json()) : null;
  if (!listRes.ok) throw new Error(`${listRes.status} ${await listRes.text()}`);
  assert.ok(Array.isArray(list.data));
  assert.strictEqual(typeof list.total, 'number');
  const created = await fetchOk(`${baseUrl}/api/v1/rag/chunks`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      title: 'Chunk integración test',
      content: 'Contenido de prueba para test de integración.',
      source: 'normativa',
      documentType: 'guia',
    }),
  });
  assert.ok(created.id);
  assert.strictEqual(created.title, 'Chunk integración test');
  const one = await fetchOk(`${baseUrl}/api/v1/rag/chunks/${created.id}`, { headers });
  assert.strictEqual(one.id, created.id);
  const updated = await fetchOk(`${baseUrl}/api/v1/rag/chunks/${created.id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ title: 'Chunk actualizado', content: one.content, source: one.source, documentType: one.documentType }),
  });
  assert.strictEqual(updated.title, 'Chunk actualizado');
  const delRes = await fetch(`${baseUrl}/api/v1/rag/chunks/${created.id}`, { method: 'DELETE', headers });
  assert.strictEqual(delRes.status, 204);
});

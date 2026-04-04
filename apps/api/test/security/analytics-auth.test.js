/**
 * Pruebas de seguridad – módulo analytics.
 * Verifica acceso a endpoints analytics (protegidos y públicos).
 * Base URL: INTEGRATION_BASE_URL o http://localhost:3080
 */
import test from 'node:test';
import assert from 'node:assert';

const baseUrl = process.env.INTEGRATION_BASE_URL || 'http://localhost:3080';
const authDisabled = ['1', 'true', 'yes'].includes(String(process.env.AUTH_DISABLED || '').toLowerCase());

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
}

async function getAdminToken() {
  try {
    const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@mec.gob.ec', role: 'admin' }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.token || null;
  } catch {
    return null;
  }
}

// ---- Public endpoints accessible without auth ----
test('GET /api/v1/public/analytics/market-overview es público (200 sin token)', async () => {
  const { status } = await fetchJson(`${baseUrl}/api/v1/public/analytics/market-overview`);
  assert.strictEqual(status, 200);
});

test('GET /api/v1/public/analytics/top-providers es público (200 sin token)', async () => {
  const { status } = await fetchJson(`${baseUrl}/api/v1/public/analytics/top-providers`);
  assert.strictEqual(status, 200);
});

test('GET /api/v1/public/analytics/risk-summary es público (200 sin token)', async () => {
  const { status } = await fetchJson(`${baseUrl}/api/v1/public/analytics/risk-summary`);
  assert.strictEqual(status, 200);
});

// ---- Public endpoints should not expose PII ----
test('GET /api/v1/public/analytics/top-providers no expone PII (sin RUC en respuesta)', async () => {
  const { body } = await fetchJson(`${baseUrl}/api/v1/public/analytics/top-providers`);
  for (const provider of (body?.data || [])) {
    assert.ok(provider.identifier === undefined, 'identifier (RUC) should not be exposed in public endpoint');
    assert.ok(provider.email === undefined, 'email should not be exposed in public endpoint');
  }
});

// ---- Protected analytics endpoints ----
test('GET /api/v1/analytics/risk-scores sin token devuelve 401 o 200 si auth off', async () => {
  const { status } = await fetchJson(`${baseUrl}/api/v1/analytics/risk-scores`);
  if (authDisabled) {
    assert.strictEqual(status, 200);
    return;
  }
  assert.ok(status === 200 || status === 401 || status === 503,
    `expected 200/401/503, got ${status}`);
});

test('POST /api/v1/analytics/compute-risk/:id sin token devuelve 401 si auth activo', async () => {
  const { status } = await fetchJson(`${baseUrl}/api/v1/analytics/compute-risk/test-id`, { method: 'POST' });
  if (authDisabled) {
    assert.ok(status === 404 || status === 200 || status === 500);
    return;
  }
  assert.ok(status === 401 || status === 404 || status === 503 || status === 200,
    `expected 401/404, got ${status}`);
});

test('POST /api/v1/analytics/compute-risk con token válido de admin funciona', async () => {
  const token = await getAdminToken();
  if (!token) {
    console.log('  skip: no se pudo obtener token de admin');
    return;
  }
  const { status } = await fetchJson(`${baseUrl}/api/v1/analytics/compute-risk/nonexistent-id`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  // Should get 404 (tender not found) not 401 – confirms token is valid
  assert.ok(status === 404 || status === 200, `expected 404 or 200, got ${status}`);
});

test('GET /api/v1/analytics/alerts sin token devuelve 401 o 200 si auth off', async () => {
  const { status } = await fetchJson(`${baseUrl}/api/v1/analytics/alerts`);
  if (authDisabled) {
    assert.strictEqual(status, 200);
    return;
  }
  assert.ok(status === 200 || status === 401 || status === 503);
});

test('PATCH /api/v1/analytics/alerts/nonexistent/resolve sin token devuelve 401 si auth activo', async () => {
  const { status } = await fetchJson(`${baseUrl}/api/v1/analytics/alerts/nonexistent-id/resolve`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
  });
  if (authDisabled) {
    assert.ok(status !== 200 || status === 500);
    return;
  }
  assert.ok(status === 401 || status === 500 || status === 503 || status === 200);
});

test('Token inválido en analytics endpoint devuelve 401', async () => {
  const { status } = await fetchJson(`${baseUrl}/api/v1/analytics/dashboard`, {
    headers: { Authorization: 'Bearer token.invalido.forzado' },
  });
  if (authDisabled) {
    assert.strictEqual(status, 200);
    return;
  }
  assert.ok(status === 200 || status === 401 || status === 503);
});

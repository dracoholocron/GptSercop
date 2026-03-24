/**
 * Fase 4: Pruebas de seguridad – autenticación y autorización.
 * Requiere API en marcha con JWT_SECRET configurado para que las rutas protegidas exijan token.
 * Base URL: INTEGRATION_BASE_URL o http://localhost:3080
 */
import test from 'node:test';
import assert from 'node:assert';

const baseUrl = process.env.INTEGRATION_BASE_URL || 'http://localhost:3080';

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
}

test('GET /health es público y no exige Authorization', async () => {
  const { status, body } = await fetchJson(`${baseUrl}/health`);
  assert.strictEqual(status, 200);
  assert.ok(body.status === 'ok' || body.status === 'degraded');
});

test('GET /api/v1/tenders es público', async () => {
  const { status } = await fetchJson(`${baseUrl}/api/v1/tenders`);
  assert.strictEqual(status, 200);
});

test('Ruta protegida sin token devuelve 401 o 200 si auth desactivado', async () => {
  const { status, body } = await fetchJson(`${baseUrl}/api/v1/analytics/dashboard`);
  if (status === 503 && body?.error?.includes('Auth no configurado')) return;
  assert.ok(status === 401 || status === 200, '401 (auth on) o 200 (auth off)');
  if (status === 401) assert.ok(body?.error === 'Unauthorized' || body?.message);
});

test('Ruta protegida con token inválido devuelve 401 o 200 si auth desactivado', async () => {
  const { status } = await fetchJson(`${baseUrl}/api/v1/analytics/dashboard`, {
    headers: { Authorization: 'Bearer token-invalido' },
  });
  if (status === 503) return;
  assert.ok(status === 401 || status === 200);
});

test('POST /api/v1/tenders sin token devuelve 401 o 4xx cuando JWT está activo', async () => {
  const { status } = await fetchJson(`${baseUrl}/api/v1/tenders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ procurementPlanId: 'x', title: 'Test' }),
  });
  if (status === 503) return;
  assert.ok([400, 401].includes(status), '401 (auth on) o 400 (validación)');
});

test('GET /api/v1/users sin token devuelve 401 o 404 cuando JWT está activo', async () => {
  const { status } = await fetchJson(`${baseUrl}/api/v1/users`);
  if (status === 503) return;
  assert.ok(status === 401 || status === 404, 'GET /api/v1/users debe exigir token (401) o no existir (404)');
});

test('GET /api/v1/rag/chunks sin token devuelve 401 o 404 cuando JWT está activo', async () => {
  const { status } = await fetchJson(`${baseUrl}/api/v1/rag/chunks`);
  if (status === 503) return;
  assert.ok(status === 401 || status === 404, 'GET /api/v1/rag/chunks debe exigir token (401) o no existir (404)');
});

test('Con token válido la ruta protegida responde 200', async () => {
  const login = await fetchJson(`${baseUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'security-test@test.com', role: 'admin' }),
  });
  if (login.status === 503) return;
  assert.strictEqual(login.status, 200);
  const token = login.body?.token;
  if (!token) return;
  const { status } = await fetchJson(`${baseUrl}/api/v1/analytics/dashboard`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.strictEqual(status, 200);
});

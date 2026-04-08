/**
 * Pruebas de seguridad – Endpoints públicos analytics (M10 / M8).
 * Cubre casos no cubiertos por analytics-auth.test.js:
 *   - Ausencia de PII en todas las respuestas públicas
 *   - Comportamiento con parámetros inválidos (year, limit)
 *   - Content-Type y estructura de respuesta correcta
 *   - Respuestas degradadas sin exponer detalles internos
 *   - Rate limiting / múltiples requests rápidos
 *
 * Pre-requisitos: API en marcha.
 * Base URL: INTEGRATION_BASE_URL o http://localhost:3080
 */
import test from 'node:test';
import assert from 'node:assert';

const baseUrl = process.env.INTEGRATION_BASE_URL || 'http://localhost:3080';

const PII_FIELDS = ['identifier', 'ruc', 'email', 'address', 'phone', 'cedula', 'password'];

async function fetchRaw(url, options = {}) {
  const res = await fetch(url, options);
  const text = await res.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  return { status: res.status, headers: res.headers, body };
}

function assertNoPII(obj, path = '') {
  if (!obj || typeof obj !== 'object') return;
  for (const field of PII_FIELDS) {
    assert.ok(
      !(field in obj),
      `Campo PII "${field}" encontrado en ${path || 'respuesta'}`,
    );
  }
  if (Array.isArray(obj)) {
    obj.forEach((item, i) => assertNoPII(item, `${path}[${i}]`));
  } else {
    for (const [key, val] of Object.entries(obj)) {
      if (typeof val === 'object' && val !== null) assertNoPII(val, `${path}.${key}`);
    }
  }
}

// ---- CASO 1: market-overview no expone PII ----
test('M10-01: GET /public/analytics/market-overview no expone campos PII', async () => {
  const { status, body } = await fetchRaw(`${baseUrl}/api/v1/public/analytics/market-overview`);
  assert.strictEqual(status, 200);
  assertNoPII(body, 'market-overview');
});

// ---- CASO 2: top-providers no expone identifier/RUC ni otros datos sensibles ----
test('M10-02: GET /public/analytics/top-providers no expone identifier, email ni ruc', async () => {
  const { status, body } = await fetchRaw(`${baseUrl}/api/v1/public/analytics/top-providers`);
  assert.strictEqual(status, 200);
  assert.ok(Array.isArray(body.data), 'data debe ser array');
  for (const provider of body.data) {
    assertNoPII(provider, 'top-providers.data[]');
  }
});

// ---- CASO 3: risk-summary no expone PII ni detalles internos de tenders ----
test('M10-03: GET /public/analytics/risk-summary no expone PII ni tenderId individuales', async () => {
  const { status, body } = await fetchRaw(`${baseUrl}/api/v1/public/analytics/risk-summary`);
  assert.strictEqual(status, 200);
  // risk-summary es solo {low, medium, high, total} – sin entidades individuales
  assert.ok(
    !('data' in body) || !Array.isArray(body.data),
    'risk-summary no debe exponer array de records individuales',
  );
  assertNoPII(body, 'risk-summary');
});

// ---- CASO 4: year=0 no produce 500 en market-overview ----
test('M10-04: GET /public/analytics/market-overview?year=0 no produce 500', async () => {
  const { status } = await fetchRaw(`${baseUrl}/api/v1/public/analytics/market-overview?year=0`);
  assert.ok(status !== 500, `year=0 produjo error 500`);
});

// ---- CASO 5: year=texto no produce 500 en top-providers ----
test('M10-05: GET /public/analytics/top-providers?year=abc no produce 500', async () => {
  const { status, body } = await fetchRaw(`${baseUrl}/api/v1/public/analytics/top-providers?year=abc`);
  assert.ok(status !== 500, `year=abc produjo 500`);
  // Si retorna 400, el body debe tener error string, no stack trace
  if (status === 400 && body?.error) {
    assert.ok(typeof body.error === 'string', 'error debe ser string');
    assert.ok(!JSON.stringify(body).toLowerCase().includes('at '), 'no debe exponer stack trace');
  }
});

// ---- CASO 6: limit extremo (9999) no produce 500 ni expone datos ilimitados ----
test('M10-06: GET /public/analytics/top-providers?limit=9999 está acotado', async () => {
  const { status, body } = await fetchRaw(`${baseUrl}/api/v1/public/analytics/top-providers?limit=9999`);
  assert.ok(status === 200 || status === 400, `limit=9999 produjo ${status}`);
  if (status === 200) {
    assert.ok(body.data.length <= 200, `limit no está acotado: devolvió ${body.data.length} registros`);
  }
});

// ---- CASO 7: Content-Type es application/json en todos los endpoints públicos ----
test('M10-07: endpoints públicos retornan Content-Type application/json', async () => {
  const endpoints = [
    '/api/v1/public/analytics/market-overview',
    '/api/v1/public/analytics/top-providers',
    '/api/v1/public/analytics/risk-summary',
  ];
  for (const ep of endpoints) {
    const { status, headers } = await fetchRaw(`${baseUrl}${ep}`);
    assert.strictEqual(status, 200, `${ep} retornó ${status}`);
    const ct = headers.get('content-type') || '';
    assert.ok(ct.includes('application/json'), `${ep}: Content-Type inesperado: ${ct}`);
  }
});

// ---- CASO 8: múltiples requests simultáneos no crashean el servidor ----
test('M10-08: 10 requests paralelos a public endpoints no producen errores 500', async () => {
  const requests = Array.from({ length: 10 }, () =>
    fetchRaw(`${baseUrl}/api/v1/public/analytics/market-overview`),
  );
  const results = await Promise.all(requests);
  const failures = results.filter((r) => r.status === 500);
  assert.strictEqual(failures.length, 0, `${failures.length}/10 requests produjeron 500`);
});

// ---- CASO 9: errores internos no exponen stack trace en respuesta ----
test('M10-09: respuestas de error de endpoints protegidos no exponen stack trace', async () => {
  // Intentar acceder a endpoint protegido sin token
  const { body } = await fetchRaw(`${baseUrl}/api/v1/analytics/risk-scores`);
  if (body && typeof body === 'object') {
    const bodyStr = JSON.stringify(body).toLowerCase();
    assert.ok(!bodyStr.includes('at object.'), 'no debe exponer stack trace Node.js');
    assert.ok(!bodyStr.includes('prisma'), 'no debe exponer detalles de ORM');
    assert.ok(!bodyStr.includes('postgresql'), 'no debe exponer detalles de DB');
  }
});

// ---- CASO 10: year=futuro lejano retorna datos vacíos, no error ----
test('M10-10: GET /public/analytics/top-providers?year=2099 retorna array vacío, no 500', async () => {
  const { status, body } = await fetchRaw(`${baseUrl}/api/v1/public/analytics/top-providers?year=2099`);
  assert.ok(status === 200 || status === 404, `year=2099 produjo ${status}`);
  if (status === 200) {
    assert.ok(Array.isArray(body.data), 'data debe ser array');
    // No debería haber datos del futuro
    assert.strictEqual(body.data.length, 0, `se esperaba array vacío para año futuro, hay ${body.data.length}`);
  }
});

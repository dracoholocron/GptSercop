const test = require('node:test');
const assert = require('node:assert/strict');
const { createServer } = require('../../src/server');

async function withServer(fn) {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    await fn(base);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

function assertSecurityHeaders(headers) {
  assert.equal(headers.get('x-content-type-options'), 'nosniff');
  assert.equal(headers.get('x-frame-options'), 'DENY');
  assert.equal(headers.get('referrer-policy'), 'strict-origin-when-cross-origin');
  assert.match(headers.get('permissions-policy') || '', /geolocation=\(\)/);
  const csp = headers.get('content-security-policy') || '';
  assert.match(csp, /default-src 'self'/);
  assert.match(csp, /frame-ancestors 'none'/);
}

test('security headers are present on html route', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/app/process-analysis`);
    assert.equal(res.status, 200);
    assertSecurityHeaders(res.headers);
  });
});

test('security headers are present on json route', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/v1/public/search?q=SERCOP`);
    assert.equal(res.status, 200);
    assertSecurityHeaders(res.headers);
  });
});

const test = require('node:test');
const assert = require('node:assert/strict');
const { createServer, normalizeError } = require('../../src/server');

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

test('normalizeError enforces standard payload shape', () => {
  const e = normalizeError({ status: 404, payload: { title: 'Process not found' } });
  assert.equal(e.status, 404);
  assert.equal(e.payload.type, 'upstream_error');
  assert.equal(e.payload.title, 'Process not found');
  assert.equal(e.payload.status, 404);
});

test('critical route errors return standardized payload', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/v1/processes/DOES-NOT-EXIST`);
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.type, 'upstream_error');
    assert.equal(body.status, 404);
    assert.ok(typeof body.title === 'string' && body.title.length > 0);
  });
});

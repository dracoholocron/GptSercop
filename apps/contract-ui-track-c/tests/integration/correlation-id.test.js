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

test('sets x-correlation-id automatically when absent', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/v1/public/search?q=SERCOP`);
    assert.equal(res.status, 200);
    const cid = res.headers.get('x-correlation-id');
    assert.ok(cid && cid.startsWith('cid-'));
    const body = await res.json();
    assert.equal(body.correlationId, cid);
  });
});

test('propagates incoming x-correlation-id', async () => {
  await withServer(async (base) => {
    const wanted = 'cid-client-abc-123';
    const res = await fetch(`${base}/v1/processes/DOES-NOT-EXIST`, {
      headers: { 'x-correlation-id': wanted },
    });
    assert.equal(res.status, 404);
    assert.equal(res.headers.get('x-correlation-id'), wanted);
    const body = await res.json();
    assert.equal(body.correlationId, wanted);
  });
});

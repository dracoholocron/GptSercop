const test = require('node:test');
const assert = require('node:assert/strict');
const { createTrackAServer } = require('../../src/track-a-handlers');

const BASE = 'http://127.0.0.1';

async function withServer(fn) {
  const server = createTrackAServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  try {
    await fn(`${BASE}:${port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test('CF-01 manual protocol declared (PAC/PAA)', async () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const doc = fs.readFileSync(path.resolve(__dirname, '../../../../docs/critical-flows-test-suite-sci-008.md'), 'utf8');
  assert.match(doc, /CF-01/);
  assert.match(doc, /READY-MANUAL/);
});

test('CF-02 process lifecycle core endpoints are reachable', async () => {
  await withServer(async (baseUrl) => {
    const listRes = await fetch(`${baseUrl}/v1/public/search?q=SERCOP`);
    assert.equal(listRes.status, 200);
    const list = await listRes.json();
    assert.ok(Array.isArray(list.items));
    assert.ok(list.items.length >= 1);

    const processId = list.items[0].processId;
    const detailRes = await fetch(`${baseUrl}/v1/processes/${encodeURIComponent(processId)}`);
    assert.equal(detailRes.status, 200);
    const detail = await detailRes.json();
    assert.equal(detail.processId, processId);
  });
});

test('CF-03 offer-adjacent validation through GPT summary on process context', async () => {
  await withServer(async (baseUrl) => {
    const summaryRes = await fetch(`${baseUrl}/v1/processes/SERCOP-2026-LIC-0001/gpt-analysis-summary`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ mode: 'executive' }),
    });
    assert.equal(summaryRes.status, 200);
    const summary = await summaryRes.json();
    assert.equal(summary.processId, 'SERCOP-2026-LIC-0001');
    assert.ok(typeof summary.executiveSummary === 'string' && summary.executiveSummary.length > 0);
  });
});

test('CF-04 manual protocol declared (clarifications)', async () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const doc = fs.readFileSync(path.resolve(__dirname, '../../../../docs/critical-flows-test-suite-sci-008.md'), 'utf8');
  assert.match(doc, /CF-04/);
  assert.match(doc, /READY-MANUAL/);
});

test('CF-05 manual protocol declared (claims)', async () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const doc = fs.readFileSync(path.resolve(__dirname, '../../../../docs/critical-flows-test-suite-sci-008.md'), 'utf8');
  assert.match(doc, /CF-05/);
  assert.match(doc, /READY-MANUAL/);
});

test('CF-06 manual protocol declared (supplier enablement)', async () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const doc = fs.readFileSync(path.resolve(__dirname, '../../../../docs/critical-flows-test-suite-sci-008.md'), 'utf8');
  assert.match(doc, /CF-06/);
  assert.match(doc, /READY-MANUAL/);
});

test('CF-07 manual protocol declared (contracts/payments)', async () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const doc = fs.readFileSync(path.resolve(__dirname, '../../../../docs/critical-flows-test-suite-sci-008.md'), 'utf8');
  assert.match(doc, /CF-07/);
  assert.match(doc, /READY-MANUAL/);
});

test('CF-08 public search + invalid process negative path', async () => {
  await withServer(async (baseUrl) => {
    const searchRes = await fetch(`${baseUrl}/v1/public/search?q=SERCOP`);
    assert.equal(searchRes.status, 200);
    const search = await searchRes.json();
    assert.ok(search.total >= 0);

    const missingRes = await fetch(`${baseUrl}/v1/processes/DOES-NOT-EXIST`);
    assert.equal(missingRes.status, 404);
    const missing = await missingRes.json();
    assert.equal(missing.status, 404);
  });
});

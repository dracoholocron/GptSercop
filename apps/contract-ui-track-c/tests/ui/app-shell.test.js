const test = require('node:test');
const assert = require('node:assert/strict');
const { createServer } = require('../../src/server');

async function withServer(fn) {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try { await fn(base); } finally { await new Promise((resolve) => server.close(resolve)); }
}

test('process analysis page renders parity markers for state/responsive/a11y baseline', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/app/process-analysis`);
    assert.equal(res.status, 200);
    const html = await res.text();

    assert.match(html, /class="app-shell"/);
    assert.match(html, /class="skip-link"/);
    assert.match(html, /id="main-content"/);
    assert.match(html, /id="results" class="process-list" role="region" aria-live="polite" aria-busy="false"/);
    assert.match(html, /id="retryDetail"/);
    assert.match(html, /id="retryAi"/);
    assert.match(html, /renderState\('loading','Buscando procesos\.\.\.'/);
    assert.match(html, /@media\(max-width:768px\)/);
    assert.match(html, /@media\(prefers-reduced-motion:reduce\)/);
    assert.match(html, /STATUS_META/);
  });
});

test('ai-help endpoint exposes success payload for panel state transitions', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/v1/ai-help`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ processId: 'SERCOP-2026-LIC-0001', section: 'configuracion' })
    });

    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.state, 'success');
    assert.equal(json.processId, 'SERCOP-2026-LIC-0001');
    assert.match(json.message, /Sugerencia generada/);
  });
});

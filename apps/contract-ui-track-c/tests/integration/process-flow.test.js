const test = require('node:test');
const assert = require('node:assert/strict');
const { createServer } = require('../../src/server');
const { createTrackAServer } = require('../../src/track-a-handlers');
const { createTrackAClient } = require('../../src/track-a-client');

async function listen(server) {
  await new Promise((resolve) => server.listen(0, resolve));
  return `http://127.0.0.1:${server.address().port}`;
}

test('query -> process detail -> GPT summary flow works end-to-end via Track A handlers', async () => {
  const trackAServer = createTrackAServer();
  const trackABase = await listen(trackAServer);
  const uiServer = createServer({ trackAClient: createTrackAClient({ baseUrl: trackABase }) });
  const uiBase = await listen(uiServer);

  try {
    const search = await fetch(`${uiBase}/v1/public/search?q=biomédicos`);
    assert.equal(search.status, 200);
    const searchBody = await search.json();
    assert.ok(searchBody.total >= 1);

    const selected = searchBody.items[0];
    const detail = await fetch(`${uiBase}/v1/processes/${encodeURIComponent(selected.processId)}`);
    assert.equal(detail.status, 200);
    const detailBody = await detail.json();
    assert.equal(detailBody.processId, selected.processId);

    const summary = await fetch(`${uiBase}/v1/processes/${encodeURIComponent(selected.processId)}/gpt-analysis-summary`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ mode: 'executive' })
    });
    assert.equal(summary.status, 200);
    const summaryBody = await summary.json();
    assert.equal(summaryBody.processId, selected.processId);
    assert.ok(summaryBody.executiveSummary.includes(selected.processId));
  } finally {
    await new Promise((resolve) => uiServer.close(resolve));
    await new Promise((resolve) => trackAServer.close(resolve));
  }
});

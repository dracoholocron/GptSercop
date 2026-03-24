const test = require('node:test');
const assert = require('node:assert/strict');
const { createTrackAServer } = require('../../src/track-a-handlers');
const { createTrackAClient } = require('../../src/track-a-client');

test('Track A client enforces real contract schemas on query->detail->summary', async () => {
  const server = createTrackAServer();
  await new Promise((resolve) => server.listen(0, resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  try {
    const client = createTrackAClient({ baseUrl });
    const search = await client.search('mobiliario');
    assert.ok(search.total >= 1);

    const processId = search.items[0].processId;
    const detail = await client.processDetail(processId);
    assert.equal(detail.processId, processId);

    const summary = await client.summary(processId, { mode: 'executive' });
    assert.equal(summary.processId, processId);
    assert.equal(typeof summary.executiveSummary, 'string');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

const test = require('node:test');
const assert = require('node:assert/strict');
const { createServer } = require('../../src/server');
const { createTrackAServer } = require('../../src/track-a-handlers');
const { createTrackAClient } = require('../../src/track-a-client');

async function listen(server) {
  await new Promise((resolve) => server.listen(0, resolve));
  return `http://127.0.0.1:${server.address().port}`;
}

test('INT-001 e2e: process -> offer submit -> award', async () => {
  const trackAServer = createTrackAServer();
  const trackABase = await listen(trackAServer);
  const uiServer = createServer({ trackAClient: createTrackAClient({ baseUrl: trackABase }) });
  const uiBase = await listen(uiServer);

  try {
    const processId = 'SERCOP-2026-LIC-0001';

    const submit = await fetch(`${uiBase}/v1/offers`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ processId, supplierId: 'SUP-001', amountUsd: 301000 }),
    });
    assert.equal(submit.status, 201);
    const offer = await submit.json();
    assert.equal(offer.processId, processId);
    assert.ok(offer.offerId);

    const offers = await fetch(`${uiBase}/v1/processes/${encodeURIComponent(processId)}/offers`);
    assert.equal(offers.status, 200);
    const offerList = await offers.json();
    assert.ok(Array.isArray(offerList.items));
    assert.ok(offerList.items.some((o) => o.offerId === offer.offerId));

    const award = await fetch(`${uiBase}/v1/processes/${encodeURIComponent(processId)}/award`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ offerId: offer.offerId }),
    });
    assert.equal(award.status, 200);
    const awardBody = await award.json();
    assert.equal(awardBody.state, 'AWARDED');

    const detail = await fetch(`${uiBase}/v1/processes/${encodeURIComponent(processId)}`);
    assert.equal(detail.status, 200);
    const detailBody = await detail.json();
    assert.equal(detailBody.state, 'AWARDED');
  } finally {
    await new Promise((resolve) => uiServer.close(resolve));
    await new Promise((resolve) => trackAServer.close(resolve));
  }
});

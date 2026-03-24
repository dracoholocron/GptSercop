const test = require('node:test');
const assert = require('node:assert/strict');
const { createServer } = require('../../src/server');
const { createTrackAServer } = require('../../src/track-a-handlers');
const { createTrackAClient } = require('../../src/track-a-client');

async function listen(server) {
  await new Promise((resolve) => server.listen(0, resolve));
  return `http://127.0.0.1:${server.address().port}`;
}

test('INT-002 e2e: adjudication -> contract -> payment', async () => {
  const trackAServer = createTrackAServer();
  const trackABase = await listen(trackAServer);
  const uiServer = createServer({ trackAClient: createTrackAClient({ baseUrl: trackABase }) });
  const uiBase = await listen(uiServer);

  try {
    const processId = 'SERCOP-2026-COT-0177';

    const submit = await fetch(`${uiBase}/v1/offers`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ processId, supplierId: 'SUP-002', amountUsd: 88000 }),
    });
    assert.equal(submit.status, 201);
    const offer = await submit.json();

    const award = await fetch(`${uiBase}/v1/processes/${encodeURIComponent(processId)}/award`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ offerId: offer.offerId }),
    });
    assert.equal(award.status, 200);

    const contractRes = await fetch(`${uiBase}/v1/contracts`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ processId, offerId: offer.offerId }),
    });
    assert.equal(contractRes.status, 201);
    const contract = await contractRes.json();
    assert.ok(contract.contractId);

    const listContracts = await fetch(`${uiBase}/v1/processes/${encodeURIComponent(processId)}/contracts`);
    assert.equal(listContracts.status, 200);
    const contractsBody = await listContracts.json();
    assert.ok(contractsBody.items.some((c) => c.contractId === contract.contractId));

    const paymentRes = await fetch(`${uiBase}/v1/payments`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ contractId: contract.contractId, amountUsd: 50000 }),
    });
    assert.equal(paymentRes.status, 201);
    const payment = await paymentRes.json();
    assert.ok(payment.paymentId);

    const listPayments = await fetch(`${uiBase}/v1/contracts/${encodeURIComponent(contract.contractId)}/payments`);
    assert.equal(listPayments.status, 200);
    const paymentsBody = await listPayments.json();
    assert.ok(paymentsBody.items.some((p) => p.paymentId === payment.paymentId));
  } finally {
    await new Promise((resolve) => uiServer.close(resolve));
    await new Promise((resolve) => trackAServer.close(resolve));
  }
});

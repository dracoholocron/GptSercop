const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { htmlPage } = require('../../src/ui-template');

function digest(html) {
  return crypto.createHash('sha256').update(html).digest('hex');
}

test('process-analysis shell snapshot contains batch-1 parity markers', () => {
  const html = htmlPage();
  const hash = digest(html);
  assert.equal(hash.length, 64);
  assert.match(html, /id="screenDashboard"/);
  assert.match(html, /id="screenProcesses"/);
  assert.match(html, /id="screenForm"/);
  assert.match(html, /id="requiredProgress"/);
  assert.match(html, /id="saveDraft"/);
  assert.match(html, /const ROUTES =/);
});

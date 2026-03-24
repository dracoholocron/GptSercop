const test = require('node:test');
const assert = require('node:assert/strict');
const { htmlPage } = require('../../src/ui-template');

test('html includes interaction parity hooks (dialog, collapsible sections, ai states)', () => {
  const html = htmlPage();
  assert.match(html, /id="openNewProcess"/);
  assert.match(html, /dialog id="newProcessDialog"/);
  assert.match(html, /id="startNewProcess"/);
  assert.match(html, /<details open>/);
  assert.match(html, /IA en estado loading/);
  assert.match(html, /IA en estado success/);
  assert.match(html, /IA en estado error/);
});

test('html includes table parity hooks \(filters, sort, pagination and row navigation\)', () => {
  const html = htmlPage();
  assert.match(html, /id="typeFilter"/);
  assert.match(html, /id="sortBy"/);
  assert.match(html, /id="pageSize"/);
  assert.match(html, /id="prevPage"/);
  assert.match(html, /id="nextPage"/);
  assert.match(html, /applyFiltersAndRender\(/);
  assert.match(html, /selectProcess\(row\.dataset\.processId\)/);
});

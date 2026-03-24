const test = require('node:test');
const assert = require('node:assert/strict');
const { statusClass, statusLabel, resolveStatusMeta, formatCurrency } = require('../../src/ui-components');

test('status helpers expose compras-publicas parity labels/classes from catalog mapping', () => {
  assert.equal(statusClass('PUBLISHED'), 'status-published');
  assert.equal(statusClass('EVALUATION'), 'status-evaluation');
  assert.equal(statusClass('AWARDED'), 'status-awarded');
  assert.equal(statusClass('UNKNOWN'), 'status-default');

  assert.equal(statusLabel('PUBLISHED'), 'Publicado');
  assert.equal(statusLabel('EVALUATION'), 'En evaluación');
  assert.equal(statusLabel('AWARDED'), 'Adjudicado');
  assert.equal(statusLabel('UNKNOWN'), 'UNKNOWN');
});

test('unknown statuses fallback and are logged once for observability', () => {
  const warnings = [];
  const logger = { warn: (line) => warnings.push(line) };

  const metaA = resolveStatusMeta('custom-x', { logger });
  const metaB = resolveStatusMeta('custom-x', { logger });

  assert.equal(metaA.className, 'status-default');
  assert.equal(metaA.label, 'CUSTOM-X');
  assert.equal(metaB.className, 'status-default');
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /Unknown status encountered: CUSTOM-X/);
});

test('currency formatter keeps USD compact style used across cards', () => {
  assert.equal(formatCurrency(312500), '$312.500');
  assert.equal(formatCurrency(0), '$0');
});

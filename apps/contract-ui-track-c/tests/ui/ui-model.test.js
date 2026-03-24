const test = require('node:test');
const assert = require('node:assert/strict');
const { mapSearchResponse, formatSummary } = require('../../src/ui-model');

test('mapSearchResponse adapts contract payload for UI list', () => {
  const mapped = mapSearchResponse({
    total: 1,
    items: [{ processId: 'SERCOP-2026-LIC-0001', state: 'PUBLISHED', title: 'Equipos' }]
  });

  assert.deepEqual(mapped, [{ id: 'SERCOP-2026-LIC-0001', title: 'Equipos', badge: 'PUBLISHED', badgeLabel: 'Publicado', entity: 'Entidad no informada' }]);
});

test('formatSummary renders human-readable summary block', () => {
  const text = formatSummary({ executiveSummary: 'Proceso en evaluación', riskLevel: 'LOW', confidence: 0.91 });
  assert.ok(text.includes('Proceso en evaluación'));
  assert.ok(text.includes('Riesgo: LOW'));
  assert.ok(text.includes('91%'));
});

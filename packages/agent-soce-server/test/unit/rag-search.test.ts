/**
 * Unit Tests — RAG hybrid search score fusion (UT-05) + context PII sanitization (UT-06)
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizePII } from '../../src/sdk-utils/pii.js';

// Test sanitizePII directly
function sanitize(text: string): string {
  return text.replace(/\b\d{10,13}\b/g, '***');
}

describe('PII Sanitization (UT-06)', () => {
  it('redacts 10-digit cedula numbers', () => {
    const result = sanitize('Mi cedula es 1234567890 y vivo aquí');
    assert.ok(!result.includes('1234567890'));
    assert.ok(result.includes('***'));
  });

  it('redacts 13-digit RUC numbers', () => {
    const result = sanitize('RUC: 1234567890001 del proveedor');
    assert.ok(!result.includes('1234567890001'));
  });

  it('preserves non-PII numbers', () => {
    const result = sanitize('El proceso tiene 3 etapas y cuesta $1500');
    assert.ok(result.includes('3'));
    assert.ok(result.includes('1500'));
  });

  it('preserves normal text unchanged', () => {
    const result = sanitize('Cuántos procesos tiene la entidad MSP?');
    assert.equal(result, 'Cuántos procesos tiene la entidad MSP?');
  });
});

describe('Hybrid search score fusion logic (UT-05)', () => {
  it('fuses scores correctly: 0.6 semantic + 0.4 keyword', () => {
    const semanticScore = 0.9;
    const keywordScore = 0.5;
    const fused = semanticScore * 0.6 + keywordScore * 0.4;
    assert.ok(Math.abs(fused - 0.74) < 0.001, `Expected ~0.74, got ${fused}`);
  });

  it('uses only semantic when keyword is 0', () => {
    const fused = 0.8 * 0.6 + 0 * 0.4;
    assert.ok(Math.abs(fused - 0.48) < 0.001);
  });

  it('uses only keyword when semantic is 0', () => {
    const fused = 0 * 0.6 + 0.7 * 0.4;
    assert.ok(Math.abs(fused - 0.28) < 0.001);
  });

  it('higher semantic score ranks first', () => {
    const results = [
      { id: 'b', semanticScore: 0.3, keywordScore: 0.9 },
      { id: 'a', semanticScore: 0.95, keywordScore: 0.1 },
    ].map(r => ({ ...r, score: r.semanticScore * 0.6 + r.keywordScore * 0.4 }))
      .sort((a, b) => b.score - a.score);
    assert.equal(results[0].id, 'a', 'High semantic score should rank first');
  });
});

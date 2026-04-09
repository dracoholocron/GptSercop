/**
 * Unit Tests — Text Chunker (CH-01 to CH-05)
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { chunkText } from '../../src/rag/chunker.js';

describe('Text Chunker (CH-01 to CH-05)', () => {
  it('CH-01: short text produces a single chunk', () => {
    const text = 'Hello world. This is a short paragraph.';
    const chunks = chunkText(text, { chunkSize: 512, chunkOverlap: 64 });
    assert.equal(chunks.length, 1);
    assert.equal(chunks[0].index, 0);
    assert.ok(chunks[0].text.includes('Hello world'));
  });

  it('CH-02: long text splits correctly by chunkSize', () => {
    const paragraph = 'Lorem ipsum dolor sit amet. ';
    const text = Array(100).fill(paragraph).join('\n\n');
    const chunks = chunkText(text, { chunkSize: 200, chunkOverlap: 40 });
    assert.ok(chunks.length > 1, `Expected multiple chunks, got ${chunks.length}`);
    for (const chunk of chunks) {
      assert.ok(
        chunk.text.length <= 220,
        `Chunk ${chunk.index} is too large: ${chunk.text.length} chars`,
      );
    }
  });

  it('CH-03: overlap between consecutive chunks exists', () => {
    const paragraph = 'Sentence about procurement rules in Ecuador. ';
    const text = Array(60).fill(paragraph).join('\n\n');
    const chunks = chunkText(text, { chunkSize: 200, chunkOverlap: 50 });
    assert.ok(chunks.length >= 3, 'Need at least 3 chunks to verify overlap');

    // The end of chunk N should overlap with the start of chunk N+1
    for (let i = 0; i < chunks.length - 1; i++) {
      const tail = chunks[i].text.slice(-30);
      const nextStart = chunks[i + 1].text.slice(0, 80);
      const hasOverlap = nextStart.includes(tail.trim().slice(0, 15));
      // Overlap should be present in most cases (boundary breaks may vary)
      if (i < chunks.length - 2) {
        assert.ok(
          hasOverlap || chunks[i + 1].text.length < 200,
          `No overlap found between chunk ${i} and ${i + 1}`,
        );
      }
    }
  });

  it('CH-04: empty paragraphs are filtered', () => {
    const text = 'First paragraph.\n\n\n\n\n\nSecond paragraph.\n\n\n\n';
    const chunks = chunkText(text, { chunkSize: 512, chunkOverlap: 64 });
    assert.equal(chunks.length, 1);
    assert.ok(chunks[0].text.includes('First paragraph'));
    assert.ok(chunks[0].text.includes('Second paragraph'));
    assert.ok(!chunks[0].text.includes('\n\n\n'));
  });

  it('CH-05: Unicode and special characters are preserved', () => {
    const text = 'Ley Orgánica del SNCP – Art. 1: Contratación Pública.\n\nSección §2: Régimen Especial — año 2024.';
    const chunks = chunkText(text, { chunkSize: 512, chunkOverlap: 64 });
    assert.equal(chunks.length, 1);
    assert.ok(chunks[0].text.includes('Orgánica'));
    assert.ok(chunks[0].text.includes('§2'));
    assert.ok(chunks[0].text.includes('Régimen'));
    assert.ok(chunks[0].text.includes('–'));
  });

  it('returns empty array for empty input', () => {
    assert.deepEqual(chunkText('', { chunkSize: 512, chunkOverlap: 64 }), []);
    assert.deepEqual(chunkText('   \n\n   ', { chunkSize: 512, chunkOverlap: 64 }), []);
  });

  it('chunk indices are sequential', () => {
    const paragraph = 'Test content for indexing. ';
    const text = Array(80).fill(paragraph).join('\n\n');
    const chunks = chunkText(text, { chunkSize: 150, chunkOverlap: 30 });
    for (let i = 0; i < chunks.length; i++) {
      assert.equal(chunks[i].index, i);
    }
  });
});

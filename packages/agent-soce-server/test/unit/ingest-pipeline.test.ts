/**
 * Unit Tests — Ingest Pipeline (IP-01 to IP-04)
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { extractText, isSupportedMimeType } from '../../src/rag/ingest-pipeline.js';

describe('Ingest Pipeline — Text extraction (IP-01 to IP-04)', () => {
  it('IP-01: extracts text from plain text buffer', async () => {
    const content = 'Ley Orgánica del SNCP establece los procedimientos de contratación.';
    const buffer = Buffer.from(content, 'utf-8');
    const result = await extractText(buffer, 'text/plain');
    assert.equal(result, content);
  });

  it('IP-02: extracts text from markdown buffer (preserves text content)', async () => {
    const md = '# Título\n\nEste es un **párrafo** con _formato_.\n\n- Item 1\n- Item 2';
    const buffer = Buffer.from(md, 'utf-8');
    const result = await extractText(buffer, 'text/markdown');
    assert.ok(result.includes('Título'));
    assert.ok(result.includes('párrafo'));
    assert.ok(result.includes('Item 1'));
  });

  it('IP-03: isSupportedMimeType validates correctly', () => {
    assert.equal(isSupportedMimeType('text/plain'), true);
    assert.equal(isSupportedMimeType('text/markdown'), true);
    assert.equal(isSupportedMimeType('application/pdf'), true);
    assert.equal(
      isSupportedMimeType('application/vnd.openxmlformats-officedocument.wordprocessingml.document'),
      true,
    );
    assert.equal(isSupportedMimeType('image/png'), false);
    assert.equal(isSupportedMimeType('application/zip'), false);
    assert.equal(isSupportedMimeType(''), false);
  });

  it('IP-04: extractText throws on unsupported MIME type', async () => {
    const buffer = Buffer.from('data', 'utf-8');
    await assert.rejects(
      () => extractText(buffer, 'application/zip'),
      (err: Error) => {
        assert.ok(err.message.includes('Unsupported MIME type'));
        return true;
      },
    );
  });
});

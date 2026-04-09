/**
 * Unit Tests — Embedding Provider Decoupling (EP-01 to EP-06)
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getEmbeddingProvider, KNOWN_DIMS, embedChunks } from '../../src/rag/embed-service.js';

function mockProvider(id: string, embedResult: number[]) {
  return {
    id,
    chat: async function* () { yield 'mock'; },
    embed: async (_text: string) => embedResult,
    healthCheck: async () => true,
  };
}

function mockRouter(providers: Map<string, ReturnType<typeof mockProvider>>, defaultId?: string) {
  return {
    getProvider(id?: string) {
      const targetId = id ?? defaultId;
      if (!targetId) throw new Error('No default provider');
      const p = providers.get(targetId);
      if (!p) throw new Error(`Provider "${targetId}" not found`);
      return p;
    },
  };
}

describe('Embedding Provider Decoupling (EP-01 to EP-06)', () => {
  it('EP-01: getEmbeddingProvider resolves specific provider when embeddingProviderId is set', () => {
    const openaiEmbed = [0.1, 0.2, 0.3];
    const providers = new Map([
      ['ollama-1', mockProvider('ollama-1', [0.9, 0.8])],
      ['openai-1', mockProvider('openai-1', openaiEmbed)],
    ]);
    const router = mockRouter(providers, 'ollama-1');

    const ep = getEmbeddingProvider(router, {
      embeddingProviderId: 'openai-1',
      embeddingModel: 'text-embedding-3-small',
      embeddingDims: 1536,
    });

    assert.equal(ep.id, 'openai-1');
    assert.equal(ep.model, 'text-embedding-3-small');
    assert.equal(ep.dimensions, 1536);
  });

  it('EP-02: getEmbeddingProvider falls back to Ollama when embeddingProviderId is null', () => {
    const providers = new Map([['ollama-1', mockProvider('ollama-1', [0.5])]]);
    const router = mockRouter(providers, 'ollama-1');

    const ep = getEmbeddingProvider(router, {
      embeddingProviderId: null,
      embeddingModel: 'nomic-embed-text',
      embeddingDims: 768,
    });

    assert.equal(ep.id, 'ollama-local');
    assert.equal(ep.model, 'nomic-embed-text');
    assert.equal(ep.dimensions, 768);
  });

  it('EP-03: KNOWN_DIMS returns correct dimensions for each supported model', () => {
    assert.equal(KNOWN_DIMS['nomic-embed-text'], 768);
    assert.equal(KNOWN_DIMS['text-embedding-3-small'], 1536);
    assert.equal(KNOWN_DIMS['text-embedding-3-large'], 3072);
    assert.equal(KNOWN_DIMS['text-embedding-004'], 768);
    assert.equal(KNOWN_DIMS['mxbai-embed-large'], 1024);
    assert.equal(KNOWN_DIMS['all-minilm'], 384);
  });

  it('EP-04: embedText delegates to the resolved provider embed method', async () => {
    const expectedVec = [0.11, 0.22, 0.33, 0.44];
    const providers = new Map([['test-1', mockProvider('test-1', expectedVec)]]);
    const router = mockRouter(providers, 'test-1');

    const ep = getEmbeddingProvider(router, {
      embeddingProviderId: 'test-1',
      embeddingModel: 'test-model',
      embeddingDims: 4,
    });

    const result = await ep.embedText('hello world');
    assert.deepEqual(result, expectedVec);
  });

  it('EP-05: embedChunks processes rows and calls provider embed for each', async () => {
    let embedCallCount = 0;
    const fakeProvider = {
      id: 'test',
      model: 'test-model',
      dimensions: 4,
      async embedText(_text: string) {
        embedCallCount++;
        return [0.1, 0.2, 0.3, 0.4];
      },
    };

    const updatedIds: string[] = [];
    const fakePrisma = {
      $queryRawUnsafe: async <T>(_q: string): Promise<T> => {
        return [
          { id: 'chunk-1', title: 'Title 1', content: 'Content 1' },
          { id: 'chunk-2', title: 'Title 2', content: 'Content 2' },
        ] as T;
      },
      $executeRawUnsafe: async (_q: string, _vec: string, id: string) => {
        updatedIds.push(id);
        return 1;
      },
    };

    const result = await embedChunks(fakeProvider, fakePrisma);
    assert.equal(result.embedded, 2);
    assert.equal(result.total, 2);
    assert.equal(embedCallCount, 2);
    assert.deepEqual(updatedIds, ['chunk-1', 'chunk-2']);
  });

  it('EP-06: getEmbeddingProvider throws when embeddingProviderId references unknown provider', () => {
    const providers = new Map([['ollama-1', mockProvider('ollama-1', [0.5])]]);
    const router = mockRouter(providers, 'ollama-1');

    assert.throws(
      () =>
        getEmbeddingProvider(router, {
          embeddingProviderId: 'nonexistent-provider',
          embeddingModel: 'test',
          embeddingDims: 768,
        }),
      (err: Error) => {
        assert.ok(err.message.includes('nonexistent-provider'));
        return true;
      },
    );
  });

  it('EP-02b: getEmbeddingProvider with null router and null config falls back to Ollama defaults', () => {
    const ep = getEmbeddingProvider(null, null);
    assert.equal(ep.id, 'ollama-local');
    assert.equal(ep.model, 'nomic-embed-text');
    assert.equal(ep.dimensions, 768);
  });
});

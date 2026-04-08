/**
 * Unit Tests — LLM Router (UT-01, UT-02)
 */
import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { LLMRouter } from '../../src/llm/router.js';
import type { LLMProvider } from '../../src/llm/types.js';

function makeProvider(id: string, shouldFail = false): LLMProvider {
  return {
    id,
    async *chat() {
      if (shouldFail) throw new Error(`${id} provider failed`);
      yield `response from ${id}`;
    },
    async embed() {
      return [0.1, 0.2, 0.3];
    },
    async healthCheck() {
      return !shouldFail;
    },
  };
}

describe('LLMRouter unit tests', () => {
  it('UT-01: LLMRouter selects correct provider based on config', async () => {
    const router = new LLMRouter();
    const p1 = makeProvider('openai');
    const p2 = makeProvider('ollama');
    router.addProvider(p1);
    router.addProvider(p2);
    router.setDefault('openai');

    const chunks: string[] = [];
    for await (const chunk of router.chat([{ role: 'user', content: 'hello' }])) {
      chunks.push(chunk);
    }
    assert.deepEqual(chunks, ['response from openai']);
  });

  it('UT-02: LLMRouter falls back to Ollama when primary fails', async () => {
    const router = new LLMRouter();
    const failing = makeProvider('openai', true);
    const fallback = makeProvider('ollama', false);
    router.addProvider(failing);
    router.addProvider(fallback);
    router.setDefault('openai');
    // Expose the fallback id
    (router as unknown as { ollamaFallbackId: string }).ollamaFallbackId = 'ollama';

    const chunks: string[] = [];
    for await (const chunk of router.chat([{ role: 'user', content: 'hello' }])) {
      chunks.push(chunk);
    }
    assert.deepEqual(chunks, ['response from ollama']);
  });

  it('UT-01b: LLMRouter healthCheck returns status for all providers', async () => {
    const router = new LLMRouter();
    router.addProvider(makeProvider('openai'));
    router.addProvider(makeProvider('ollama'));
    router.setDefault('openai');

    const result = await router.healthCheck() as Record<string, boolean>;
    assert.equal(typeof result, 'object');
    assert.equal(result['openai'], true);
    assert.equal(result['ollama'], true);
  });

  it('UT-01c: LLMRouter throws when no default set', () => {
    const router = new LLMRouter();
    assert.throws(() => router.getProvider(), /No default LLM provider/);
  });
});

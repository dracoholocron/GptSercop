import type { ChatMessage, LLMOptions, AgentLLMProviderRecord } from '../types/index.js';
import type { LLMProvider } from './types.js';
import { OpenAIProvider } from './openai-provider.js';
import { AnthropicProvider } from './anthropic-provider.js';
import { GeminiProvider } from './gemini-provider.js';
import { OllamaProvider } from './ollama-provider.js';

export class LLMRouter {
  private providers = new Map<string, LLMProvider>();
  private defaultId: string | null = null;
  private ollamaFallbackId: string | null = null;

  addProvider(provider: LLMProvider): void {
    this.providers.set(provider.id, provider);
  }

  setDefault(id: string): void {
    if (!this.providers.has(id)) throw new Error(`Provider "${id}" not registered`);
    this.defaultId = id;
  }

  getProvider(id?: string): LLMProvider {
    const targetId = id ?? this.defaultId;
    if (!targetId) throw new Error('No default LLM provider configured');
    const provider = this.providers.get(targetId);
    if (!provider) throw new Error(`Provider "${targetId}" not found`);
    return provider;
  }

  async *chat(messages: ChatMessage[], options?: LLMOptions): AsyncGenerator<string> {
    try {
      yield* this.getProvider().chat(messages, options);
    } catch (err) {
      console.error(`[LLMRouter] Default provider failed, attempting fallback:`, err);
      const fallbackId = this.ollamaFallbackId ?? 'ollama';
      const fallback = this.providers.get(fallbackId);
      if (!fallback) throw err;
      yield* fallback.chat(messages, options);
    }
  }

  async embed(text: string): Promise<number[]> {
    return this.getProvider().embed(text);
  }

  async healthCheck(id?: string): Promise<Record<string, boolean> | boolean> {
    if (id) {
      return this.getProvider(id).healthCheck();
    }
    const results: Record<string, boolean> = {};
    for (const [pid, provider] of this.providers) {
      try {
        results[pid] = await provider.healthCheck();
      } catch {
        results[pid] = false;
      }
    }
    return results;
  }

  static fromConfig(records: AgentLLMProviderRecord[]): LLMRouter {
    const router = new LLMRouter();

    for (const rec of records) {
      if (!rec.isActive) continue;

      let provider: LLMProvider | null = null;
      const meta = (rec.metadata ?? {}) as Record<string, unknown>;

      switch (rec.type) {
        case 'openai':
          if (!rec.apiKey) break;
          provider = new OpenAIProvider({
            id: rec.id,
            apiKey: rec.apiKey,
            model: rec.model,
            baseUrl: rec.baseUrl ?? undefined,
            embeddingModel: meta.embeddingModel as string | undefined,
          });
          break;

        case 'anthropic':
          if (!rec.apiKey) break;
          provider = new AnthropicProvider({
            id: rec.id,
            apiKey: rec.apiKey,
            model: rec.model,
            embeddingApiKey: meta.embeddingApiKey as string | undefined,
          });
          break;

        case 'google':
          if (!rec.apiKey) break;
          provider = new GeminiProvider({
            id: rec.id,
            apiKey: rec.apiKey,
            model: rec.model,
          });
          break;

        case 'ollama':
          provider = new OllamaProvider({
            id: rec.id,
            baseUrl: rec.baseUrl ?? undefined,
            model: rec.model,
            embeddingModel: meta.embeddingModel as string | undefined,
          });
          router.ollamaFallbackId = rec.id;
          break;
      }

      if (provider) {
        router.addProvider(provider);
        if (rec.isDefault) router.setDefault(rec.id);
      }
    }

    return router;
  }
}

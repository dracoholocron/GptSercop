import OpenAI from 'openai';
import type { ChatMessage, LLMOptions } from '../types/index.js';
import type { LLMProvider } from './types.js';

export class OpenAIProvider implements LLMProvider {
  id: string;
  private client: OpenAI;
  private model: string;
  private embeddingModel: string;

  constructor(opts: { apiKey: string; model: string; baseUrl?: string; id?: string; embeddingModel?: string }) {
    this.id = opts.id ?? 'openai';
    this.model = opts.model;
    this.embeddingModel = opts.embeddingModel ?? 'text-embedding-3-small';
    this.client = new OpenAI({ apiKey: opts.apiKey, baseURL: opts.baseUrl });
  }

  async *chat(messages: ChatMessage[], options?: LLMOptions): AsyncGenerator<string> {
    const stream = await this.client.chat.completions.create({
      model: options?.model ?? this.model,
      messages: messages.map((m) => ({ role: m.role as 'user' | 'assistant' | 'system', content: m.content })),
      temperature: options?.temperature ?? 0.3,
      max_tokens: options?.maxTokens ?? 4096,
      stream: true,
    });
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) yield delta;
    }
  }

  async embed(text: string): Promise<number[]> {
    const res = await this.client.embeddings.create({
      model: this.embeddingModel,
      input: text,
    });
    return res.data[0].embedding;
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.client.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 5,
      });
      return true;
    } catch {
      return false;
    }
  }
}

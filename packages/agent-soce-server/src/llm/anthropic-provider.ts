import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import type { ChatMessage, LLMOptions } from '../types/index.js';
import type { LLMProvider } from './types.js';

export class AnthropicProvider implements LLMProvider {
  id: string;
  private client: Anthropic;
  private model: string;
  private embeddingClient: OpenAI | null;

  constructor(opts: { apiKey: string; model: string; id?: string; embeddingApiKey?: string }) {
    this.id = opts.id ?? 'anthropic';
    this.model = opts.model;
    this.client = new Anthropic({ apiKey: opts.apiKey });
    this.embeddingClient = opts.embeddingApiKey
      ? new OpenAI({ apiKey: opts.embeddingApiKey })
      : null;
  }

  async *chat(messages: ChatMessage[], options?: LLMOptions): AsyncGenerator<string> {
    const formatted = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));
    const systemMsg = messages.find((m) => m.role === 'system')?.content;

    const stream = this.client.messages.stream({
      model: options?.model ?? this.model,
      max_tokens: options?.maxTokens ?? 4096,
      messages: formatted,
      ...(systemMsg ? { system: systemMsg } : {}),
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && 'delta' in event) {
        const delta = event.delta as { type: string; text?: string };
        if (delta.type === 'text_delta' && delta.text) {
          yield delta.text;
        }
      }
    }
  }

  async embed(text: string): Promise<number[]> {
    if (!this.embeddingClient) {
      throw new Error('Anthropic provider requires embeddingApiKey for embeddings');
    }
    const res = await this.embeddingClient.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });
    return res.data[0].embedding;
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.client.messages.create({
        model: this.model,
        max_tokens: 5,
        messages: [{ role: 'user', content: 'ping' }],
      });
      return true;
    } catch {
      return false;
    }
  }
}

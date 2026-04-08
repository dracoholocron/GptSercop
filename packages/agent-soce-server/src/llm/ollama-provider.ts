import { Ollama } from 'ollama';
import type { ChatMessage, LLMOptions } from '../types/index.js';
import type { LLMProvider } from './types.js';

export class OllamaProvider implements LLMProvider {
  id: string;
  private client: Ollama;
  private model: string;
  private embeddingModel: string;

  constructor(opts: { baseUrl?: string; model: string; embeddingModel?: string; id?: string }) {
    this.id = opts.id ?? 'ollama';
    this.model = opts.model;
    this.embeddingModel = opts.embeddingModel ?? 'nomic-embed-text';
    this.client = new Ollama({ host: opts.baseUrl ?? 'http://localhost:11434' });
  }

  async *chat(messages: ChatMessage[], options?: LLMOptions): AsyncGenerator<string> {
    const response = await this.client.chat({
      model: options?.model ?? this.model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      stream: true,
      options: {
        temperature: options?.temperature ?? 0.3,
        num_predict: options?.maxTokens ?? 4096,
      },
    });
    for await (const chunk of response) {
      if (chunk.message?.content) yield chunk.message.content;
    }
  }

  async embed(text: string): Promise<number[]> {
    const res = await this.client.embed({
      model: this.embeddingModel,
      input: text,
    });
    return res.embeddings[0];
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.client.list();
      return true;
    } catch {
      return false;
    }
  }
}

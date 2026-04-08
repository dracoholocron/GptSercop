import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ChatMessage, LLMOptions } from '../types/index.js';
import type { LLMProvider } from './types.js';

export class GeminiProvider implements LLMProvider {
  id: string;
  private genAI: GoogleGenerativeAI;
  private model: string;

  constructor(opts: { apiKey: string; model: string; id?: string }) {
    this.id = opts.id ?? 'gemini';
    this.model = opts.model;
    this.genAI = new GoogleGenerativeAI(opts.apiKey);
  }

  async *chat(messages: ChatMessage[], options?: LLMOptions): AsyncGenerator<string> {
    const model = this.genAI.getGenerativeModel({
      model: options?.model ?? this.model,
      generationConfig: {
        temperature: options?.temperature ?? 0.3,
        maxOutputTokens: options?.maxTokens ?? 4096,
      },
    });

    const history = messages.slice(0, -1).map((m) => ({
      role: m.role === 'assistant' ? 'model' as const : 'user' as const,
      parts: [{ text: m.content }],
    }));

    const lastMessage = messages[messages.length - 1]?.content ?? '';
    const chat = model.startChat({ history });
    const result = await chat.sendMessageStream(lastMessage);

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) yield text;
    }
  }

  async embed(text: string): Promise<number[]> {
    const model = this.genAI.getGenerativeModel({ model: 'text-embedding-004' });
    const result = await model.embedContent(text);
    return result.embedding.values;
  }

  async healthCheck(): Promise<boolean> {
    try {
      const model = this.genAI.getGenerativeModel({ model: this.model });
      const result = await model.generateContent('ping');
      return !!result.response.text();
    } catch {
      return false;
    }
  }
}

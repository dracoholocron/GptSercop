import type { ChatMessage, LLMOptions } from '../types/index.js';

export interface LLMProvider {
  id: string;
  chat(messages: ChatMessage[], options?: LLMOptions): AsyncGenerator<string>;
  embed(text: string): Promise<number[]>;
  healthCheck(): Promise<boolean>;
}

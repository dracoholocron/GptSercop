export interface ToolCall {
  name: string;
  params: Record<string, unknown>;
  result?: unknown;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  toolCalls?: ToolCall[];
}

export interface ToolDef {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  requiresConfirmation?: boolean;
}

export interface LLMOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  tools?: ToolDef[];
}

export interface UIContext {
  route: string;
  screenId?: string;
  focusedField?: string;
  visibleFields?: string[];
  visibleActions?: string[];
  errors?: string[];
}

export interface AgentConfig {
  llmProvider: string;
  llmModel: string;
  embeddingProvider: string;
  embeddingModel: string;
  sessionTtl: number;
  rateLimitPerMinute: number;
}

export type SSEEventType = 'text' | 'tool_call' | 'tool_result' | 'guidance' | 'error' | 'done';

export interface SSEEvent {
  type: SSEEventType;
  data: unknown;
}

export interface AgentLLMProviderRecord {
  id: string;
  name: string;
  type: string;
  apiKey: string | null;
  baseUrl: string | null;
  model: string;
  isDefault: boolean;
  isActive: boolean;
  maxTokens: number;
  temperature: number;
  metadata: Record<string, unknown> | null;
}

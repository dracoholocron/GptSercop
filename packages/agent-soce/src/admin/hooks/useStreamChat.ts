import { useContext, useCallback } from 'react';
import { AgentAdminContext } from '../context/AgentAdminContext.js';

export interface SSEEvent {
  type: 'text' | 'rag_sources' | 'done' | 'error';
  data: unknown;
}

export interface RagChunk {
  id: string;
  title: string;
  source: string;
  score: number;
  snippet: string | null;
  documentType?: string;
}

export function useStreamChat() {
  const { apiBaseUrl, token } = useContext(AgentAdminContext);

  const sendMessage = useCallback(
    async function* (chatId: string, content: string): AsyncGenerator<SSEEvent> {
      const url = `${apiBaseUrl}/api/v1/agent-soce/admin/chat/conversations/${chatId}/messages`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ content }),
      });

      if (!res.ok) {
        yield { type: 'error', data: `HTTP ${res.status}` };
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop()!;
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              yield JSON.parse(line.slice(6)) as SSEEvent;
            } catch {
              // skip malformed events
            }
          }
        }
      }
    },
    [apiBaseUrl, token],
  );

  return { sendMessage };
}

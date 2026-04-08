import type { ChatMessage, SSEEvent, UIContext } from '../types/index.js';

export interface SendMessageOptions {
  messages: Array<{ role: string; content: string }>;
  context?: UIContext;
  sessionId?: string;
  providerId?: string;
}

export function createSSEClient(baseUrl: string, token: string) {
  async function* sendMessage(opts: SendMessageOptions): AsyncGenerator<SSEEvent> {
    const response = await fetch(`${baseUrl}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(opts),
    });

    if (!response.ok) {
      throw new Error(`Chat request failed: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const event = JSON.parse(line.slice(6)) as SSEEvent;
            yield event;
          } catch {
            // skip malformed events
          }
        }
      }
    }
  }

  function connectStream(onEvent: (event: SSEEvent) => void): () => void {
    const controller = new AbortController();

    (async () => {
      try {
        const response = await fetch(`${baseUrl}/stream`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        const reader = response.body?.getReader();
        if (!reader) return;

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                onEvent(JSON.parse(line.slice(6)));
              } catch {}
            }
          }
        }
      } catch {}
    })();

    return () => controller.abort();
  }

  async function sendFeedback(interactionId: string, rating: number, text?: string): Promise<void> {
    await fetch(`${baseUrl}/chat/interactions/${interactionId}/feedback`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ rating, text }),
    });
  }

  return { sendMessage, connectStream, sendFeedback };
}

import { useState, useCallback, useRef, useEffect } from 'react';
import type { ChatMessage, AgentSOCEConfig, UIContext, SSEEvent, GuidanceAction } from '../types/index.js';
import { createSSEClient } from '../transport/sse-client.js';
import { collectContext, sanitizePII } from '../context/ContextCollector.js';
import type { HostAdapter } from '../types/index.js';

export interface UseAgentSOCEOptions {
  config: AgentSOCEConfig;
  adapter?: HostAdapter;
  onGuidance?: (action: GuidanceAction) => void;
}

export function useAgentSOCE({ config, adapter, onGuidance }: UseAgentSOCEOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProviderId, setProviderId] = useState<string | undefined>(undefined);
  const sessionIdRef = useRef(config.sessionId ?? crypto.randomUUID());

  const sseClient = useRef(
    createSSEClient(
      `${config.apiBaseUrl}/api/v1/agent-soce`,
      config.token ?? '',
    ),
  );

  useEffect(() => {
    sseClient.current = createSSEClient(
      `${config.apiBaseUrl}/api/v1/agent-soce`,
      config.token ?? '',
    );
  }, [config.apiBaseUrl, config.token]);

  const sendMessage = useCallback(async (text: string) => {
    const sanitized = sanitizePII(text);
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: sanitized,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    setError(null);

    const context: UIContext = collectContext(adapter);

    const assistantMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    };
    setMessages((prev) => [...prev, assistantMsg]);

    try {
      const allMessages = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const stream = sseClient.current.sendMessage({
        messages: allMessages,
        context,
        sessionId: sessionIdRef.current,
        providerId: selectedProviderId,
      });

      for await (const event of stream) {
        handleSSEEvent(event, assistantMsg.id, onGuidance);
      }

      setMessages((prev) =>
        prev.map((m) => (m.id === assistantMsg.id ? { ...m, isStreaming: false } : m)),
      );
    } catch (err) {
      setError(String(err));
      setMessages((prev) => prev.filter((m) => m.id !== assistantMsg.id));
    } finally {
      setIsLoading(false);
    }
  }, [messages, adapter, onGuidance]);

  const handleSSEEvent = useCallback(
    (event: SSEEvent, assistantMsgId: string, guidanceCb?: (a: GuidanceAction) => void) => {
      switch (event.type) {
        case 'text':
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? { ...m, content: m.content + String(event.data) }
                : m,
            ),
          );
          break;
        case 'guidance':
          if (guidanceCb) guidanceCb(event.data as GuidanceAction);
          break;
        case 'error':
          setError(String(event.data));
          break;
      }
    },
    [],
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    sessionIdRef.current = crypto.randomUUID();
  }, []);

  const sendFeedback = useCallback(
    async (interactionId: string, rating: number, text?: string) => {
      await sseClient.current.sendFeedback(interactionId, rating, text);
    },
    [],
  );

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    sendFeedback,
    sessionId: sessionIdRef.current,
    selectedProviderId,
    setProviderId,
  };
}

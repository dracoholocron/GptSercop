/**
 * Hook para gestionar mensajes de una conversación
 */

import { useState, useEffect, useCallback } from 'react';
import { cmxChatService, type Message } from '../services/cmxChatService';

export const useChatMessages = (conversationId: number | null) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMessages = useCallback(async () => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await cmxChatService.getMessages(conversationId);
      setMessages(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar mensajes');
      console.error('Error loading messages:', err);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  const sendMessage = useCallback(async (content: string, useStreaming: boolean = true) => {
    if (!conversationId) {
      throw new Error('No hay conversación seleccionada');
    }

    try {
      setSending(true);
      setError(null);
      
      // Agregar mensaje del usuario inmediatamente (optimistic update)
      const tempId = -Date.now(); // Temporal ID negativo para evitar conflictos
      const userMessage: Message = {
        id: tempId,
        conversationId,
        role: 'USER',
        content,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);

      if (useStreaming) {
        // Usar streaming para mejor UX
        let aiMessageContent = '';
        const aiMessageId = -Date.now() - 1; // ID temporal para el mensaje de IA
        
        // Crear mensaje de IA vacío para ir actualizándolo
        const tempAiMessage: Message = {
          id: aiMessageId,
          conversationId,
          role: 'ASSISTANT',
          content: '',
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => {
          const filtered = prev.filter((m) => m.id !== tempId);
          return [...filtered, tempAiMessage];
        });

        // Enviar mensaje con streaming
        await cmxChatService.sendMessageStreaming(
          conversationId,
          content,
          (token) => {
            // Actualizar mensaje de IA con cada token
            aiMessageContent += token;
            setMessages((prev) => {
              return prev.map((msg) => {
                if (msg.id === aiMessageId) {
                  return { ...msg, content: aiMessageContent };
                }
                return msg;
              });
            });
          },
          (messageId) => {
            // Stream completado, actualizar con el ID real
            setMessages((prev) => {
              return prev.map((msg) => {
                if (msg.id === aiMessageId) {
                  return {
                    ...msg,
                    id: messageId,
                    content: aiMessageContent,
                  };
                }
                return msg;
              });
            });
            // Asegurar que sending se resetee
            setSending(false);
            // Recargar mensajes para mostrar el mensaje del usuario guardado en la BD
            setTimeout(() => {
              loadMessages();
            }, 500);
          },
          (error) => {
            setError(error.message);
            // Asegurar que sending se resetee en caso de error
            setSending(false);
            // Remover mensajes temporales en caso de error
            setMessages((prev) => prev.filter((m) => m.id !== tempId && m.id !== aiMessageId));
            throw error;
          }
        );
      } else {
        // Usar método tradicional (sin streaming)
        const aiMessage = await cmxChatService.sendMessage(conversationId, content);
        
        // Reemplazar mensaje temporal con el real y agregar respuesta
        setMessages((prev) => {
          const filtered = prev.filter((m) => m.id !== tempId);
          return [...filtered, aiMessage];
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar mensaje');
      // Remover mensaje temporal en caso de error
      const tempId = -Date.now();
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      throw err;
    } finally {
      setSending(false);
    }
  }, [conversationId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Resetear estado sending cuando cambia la conversación
  useEffect(() => {
    setSending(false);
    setError(null);
  }, [conversationId]);

  return {
    messages,
    loading,
    sending,
    error,
    loadMessages,
    sendMessage,
  };
};


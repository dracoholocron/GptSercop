/**
 * CMX Chat Service
 * Servicio para comunicación con la API de Chat CMX
 */

import { TOKEN_STORAGE_KEY } from '../config/api.config';

/**
 * Helper para hacer peticiones autenticadas directamente al backend
 * Usa fetch directamente para evitar problemas con apiClient que apunta a Kong
 */
const makeAuthenticatedRequest = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers as HeadersInit || {}),
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  console.log('[CMX Chat] Making request:', options.method || 'GET', url);
  console.log('[CMX Chat] Headers:', Object.keys(headers));
  
  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  console.log('[CMX Chat] Response status:', response.status, 'for URL:', url);
  
  return response;
};

/**
 * Helper para obtener la URL del endpoint según el entorno
 * En desarrollo usa el proxy de Vite (/api -> http://localhost:8080)
 * En producción usa rutas sin /api ya que API_BASE_URL ya lo incluye
 */
const getEndpointUrl = (path: string): string => {
  // Normalizar el path
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  // En desarrollo, usar el proxy de Vite (que redirige /api a http://localhost:8080)
  // Esto evita problemas de CORS
  if (import.meta.env.DEV) {
    return `/api${normalizedPath}`;
  }
  
  // En producción, usar ruta relativa (API_BASE_URL ya incluye /api)
  return normalizedPath;
};


// Tipos para el chat
export interface AIContext {
  id: number;
  code: string;
  name: string;
  description?: string;
  contextType?: string;
  enabled: boolean;
  displayOrder: number;
}

export interface Conversation {
  id: number;
  title: string;
  contextId?: number;
  contextName?: string;
  isFavorite: boolean;
  folderName?: string;
  createdAt: string;
  updatedAt: string;
  messageCount?: number;
  lastMessagePreview?: string;
}

export interface ChartMetadata {
  type: 'chart';
  chartConfig?: {
    type: 'bar' | 'line' | 'pie' | 'doughnut' | 'area' | 'horizontalBar';
    colors?: string[];
  };
  data?: Array<Record<string, string | number>>;
  title?: string;
  text?: string;
}

export interface Message {
  id: number;
  conversationId: number;
  role: 'USER' | 'ASSISTANT';
  content: string;
  createdAt: string;
  metadata?: string | ChartMetadata;
}

export interface CreateConversationRequest {
  title?: string;
  contextId?: number;
  folderName?: string;
}

export interface ChatMessageRequest {
  message: string;
  conversationId: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

/**
 * Servicio de Chat CMX
 */
export const cmxChatService = {
  /**
   * Obtener contextos de IA disponibles
   */
  async getAvailableContexts(): Promise<AIContext[]> {
    const url = getEndpointUrl('/v1/ai/chat/contexts');
    console.log('[CMX Chat] Requesting contexts from:', url);
    const response = await makeAuthenticatedRequest(url, { method: 'GET' });
    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const error = await response.json();
        errorMessage = error.message || error.error || errorMessage;
      } catch (e) {
        // Si no se puede parsear el JSON, usar el texto de la respuesta
        try {
          const text = await response.text();
          errorMessage = text || errorMessage;
        } catch (e2) {
          // Ignorar si tampoco se puede leer el texto
        }
      }
      throw new Error(errorMessage);
    }
    const result: ApiResponse<AIContext[]> = await response.json();
    return result.data || [];
  },

  /**
   * Crear una nueva conversación
   */
  async createConversation(request: CreateConversationRequest): Promise<Conversation> {
    const url = getEndpointUrl('/v1/ai/chat/conversations');
    const response = await makeAuthenticatedRequest(url, {
      method: 'POST',
      body: JSON.stringify(request),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }
    const result: ApiResponse<Conversation> = await response.json();
    if (!result.data) {
      throw new Error(result.message || 'Error al crear conversación');
    }
    return result.data;
  },

  /**
   * Obtener todas las conversaciones del usuario
   */
  async getConversations(): Promise<Conversation[]> {
    const url = getEndpointUrl('/v1/ai/chat/conversations');
    console.log('[CMX Chat] Requesting conversations from:', url);
    const response = await makeAuthenticatedRequest(url, { method: 'GET' });
    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const error = await response.json();
        errorMessage = error.message || error.error || errorMessage;
      } catch (e) {
        // Si no se puede parsear el JSON, usar el texto de la respuesta
        try {
          const text = await response.text();
          errorMessage = text || errorMessage;
        } catch (e2) {
          // Ignorar si tampoco se puede leer el texto
        }
      }
      throw new Error(errorMessage);
    }
    const result: ApiResponse<Conversation[]> = await response.json();
    return result.data || [];
  },

  /**
   * Obtener una conversación por ID
   */
  async getConversation(id: number): Promise<Conversation> {
    const url = getEndpointUrl(`/v1/ai/chat/conversations/${id}`);
    const response = await makeAuthenticatedRequest(url, { method: 'GET' });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }
    const result: ApiResponse<Conversation> = await response.json();
    if (!result.data) {
      throw new Error(result.message || 'Conversación no encontrada');
    }
    return result.data;
  },

  /**
   * Eliminar una conversación
   */
  async deleteConversation(id: number): Promise<void> {
    const url = getEndpointUrl(`/v1/ai/chat/conversations/${id}`);
    const response = await makeAuthenticatedRequest(url, { method: 'DELETE' });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }
  },

  /**
   * Enviar un mensaje en una conversación
   */
  async sendMessage(conversationId: number, message: string): Promise<Message> {
    const url = getEndpointUrl(`/v1/ai/chat/conversations/${conversationId}/messages`);
    const response = await makeAuthenticatedRequest(url, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }
    const result: ApiResponse<Message> = await response.json();
    if (!result.data) {
      throw new Error(result.message || 'Error al enviar mensaje');
    }
    return result.data;
  },

  /**
   * Enviar un mensaje en una conversación con streaming (Server-Sent Events)
   * @param conversationId ID de la conversación
   * @param message Mensaje del usuario
   * @param onToken Callback que se ejecuta para cada token recibido
   * @param onComplete Callback que se ejecuta cuando el stream termina
   * @param onError Callback que se ejecuta en caso de error
   */
  async sendMessageStreaming(
    conversationId: number,
    message: string,
    onToken: (token: string) => void,
    onComplete?: (messageId: number) => void,
    onError?: (error: Error) => void
  ): Promise<void> {
    const url = getEndpointUrl(`/v1/ai/chat/conversations/${conversationId}/messages/stream`);
    
    try {
      // Obtener token de autenticación
      const token = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (!token) {
        const error = new Error('No hay token de autenticación');
        if (onError) {
          onError(error);
        } else {
          throw error;
        }
        return;
      }

      console.log('[CMX Chat] Sending streaming message to:', url);
      console.log('[CMX Chat] Conversation ID:', conversationId);
      console.log('[CMX Chat] Message length:', message.length);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ message }),
      }).catch((fetchError) => {
        // Capturar errores de red específicos
        console.error('[CMX Chat] Fetch error:', fetchError);
        const error = new Error(
          fetchError instanceof TypeError && fetchError.message === 'Failed to fetch'
            ? 'Error de conexión: No se pudo conectar al servidor. Verifica que el backend esté corriendo.'
            : fetchError instanceof Error
            ? fetchError.message
            : 'Error de red desconocido'
        );
        if (onError) {
          onError(error);
        } else {
          throw error;
        }
        return null;
      });

      if (!response) {
        // El error ya fue manejado en el catch
        return;
      }

      console.log('[CMX Chat] Response status:', response.status);
      console.log('[CMX Chat] Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const error = await response.json();
          errorMessage = error.message || error.error || errorMessage;
        } catch (e) {
          // Si no se puede parsear JSON, intentar leer como texto
          try {
            const text = await response.text();
            errorMessage = text || errorMessage;
          } catch (e2) {
            // Ignorar si tampoco se puede leer el texto
          }
        }
        const error = new Error(errorMessage);
        if (onError) {
          onError(error);
        } else {
          throw error;
        }
        return;
      }

      // Leer el stream SSE
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No se pudo obtener el stream');
      }

      let buffer = '';
      let currentEvent = '';
      let lastMessageId: number | null = null;
      let streamCompleted = false;

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            // Stream terminado, asegurar que onComplete se llame si no se llamó antes
            if (!streamCompleted && lastMessageId && onComplete) {
              console.log('[CMX Chat] Stream ended, calling onComplete with last messageId:', lastMessageId);
              onComplete(lastMessageId);
              streamCompleted = true;
            }
            break;
          }

          // Decodificar chunk
          buffer += decoder.decode(value, { stream: true });
          
          // Procesar líneas completas
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Mantener línea incompleta en el buffer

          for (const line of lines) {
            // Manejar tanto "event: " como "event:" (con o sin espacio)
            if (line.startsWith('event:')) {
              // Tipo de evento
              const colonIndex = line.indexOf(':');
              currentEvent = line.substring(colonIndex + 1).trim();
              console.log('[CMX Chat] SSE event type:', currentEvent);
            } else if (line.startsWith('data:')) {
              const colonIndex = line.indexOf(':');
              const data = line.substring(colonIndex + 1).trim();
              
              if (data === '[DONE]') {
                console.log('[CMX Chat] SSE stream completed with [DONE]');
                if (!streamCompleted && lastMessageId && onComplete) {
                  onComplete(lastMessageId);
                  streamCompleted = true;
                }
                continue;
              }

              try {
                const event = JSON.parse(data);
                console.log('[CMX Chat] SSE data parsed:', { currentEvent, event });
                
                // Procesar según el tipo de evento
                if (currentEvent === 'token' || event.token) {
                  // Token recibido
                  const token = event.token || event.data?.token || '';
                  if (token) {
                    console.log('[CMX Chat] Token received:', token.substring(0, 20) + '...');
                    onToken(token);
                  }
                } else if (currentEvent === 'complete' || event.status === 'completed' || event.messageId) {
                  // Stream completado
                  const messageId = event.messageId || event.data?.messageId;
                  if (messageId) {
                    lastMessageId = messageId;
                    console.log('[CMX Chat] Stream completed, messageId:', messageId);
                    if (!streamCompleted && onComplete) {
                      onComplete(messageId);
                      streamCompleted = true;
                    }
                  }
                } else if (currentEvent === 'error' || event.error) {
                  // Error en el stream
                  const errorMsg = event.error || event.data?.error || 'Error desconocido';
                  console.error('[CMX Chat] SSE error:', errorMsg);
                  if (onError) {
                    onError(new Error(errorMsg));
                  }
                  streamCompleted = true;
                } else if (currentEvent === 'start' || event.status === 'started') {
                  // Stream iniciado
                  console.log('[CMX Chat] SSE stream started');
                  // No hacer nada, solo informativo
                } else if (event.token) {
                  // Fallback: si hay token en el objeto, usarlo
                  console.log('[CMX Chat] Token received (fallback):', event.token.substring(0, 20) + '...');
                  onToken(event.token);
                } else {
                  console.warn('[CMX Chat] Unhandled SSE event:', { currentEvent, event });
                }
              } catch (e) {
                // Ignorar errores de parsing, pueden ser líneas vacías o comentarios
                console.warn('[CMX Chat] Error parsing SSE event:', e, 'Line:', line, 'Current event:', currentEvent);
              }
              
              // Resetear el tipo de evento después de procesar
              currentEvent = '';
            } else if (line.trim() === '') {
              // Línea vacía indica fin de evento
              currentEvent = '';
            } else if (line.trim().startsWith(':')) {
              // Comentario SSE, ignorar
              continue;
            } else {
              console.warn('[CMX Chat] Unrecognized SSE line:', line);
            }
          }
        }
      } catch (err) {
        console.error('[CMX Chat] Error in sendMessageStreaming:', err);
        const error = err instanceof Error 
          ? err 
          : new Error(`Error desconocido en streaming: ${String(err)}`);
        
        // Proporcionar mensaje más descriptivo
        if (error.message.includes('Failed to fetch') || error.message.includes('network error')) {
          error.message = 'Error de conexión: No se pudo conectar al servidor. Verifica que el backend esté corriendo en http://localhost:8080';
        }
        
        if (onError) {
          onError(error);
        } else {
          throw error;
        }
      }
    } catch (err) {
      console.error('[CMX Chat] Error in sendMessageStreaming (outer):', err);
      const error = err instanceof Error 
        ? err 
        : new Error(`Error desconocido en streaming: ${String(err)}`);
      
      if (onError) {
        onError(error);
      } else {
        throw error;
      }
    }
  },

  /**
   * Obtener mensajes de una conversación
   */
  async getMessages(conversationId: number): Promise<Message[]> {
    const url = getEndpointUrl(`/v1/ai/chat/conversations/${conversationId}/messages`);
    const response = await makeAuthenticatedRequest(url, { method: 'GET' });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }
    const result: ApiResponse<Message[]> = await response.json();
    // Parsear metadata si es string JSON
    return (result.data || []).map(msg => {
      if (msg.metadata && typeof msg.metadata === 'string') {
        try {
          const parsed = JSON.parse(msg.metadata);
          // Si tiene chart, agregar type: 'chart' para compatibilidad
          if (parsed.chart) {
            parsed.type = 'chart';
          }
          return { ...msg, metadata: parsed };
        } catch (e) {
          console.error('Error parsing message metadata:', e);
          return { ...msg, metadata: undefined };
        }
      }
      return msg;
    });
  },

  /**
   * Actualizar favorito de conversación
   */
  async toggleFavorite(conversationId: number, isFavorite: boolean): Promise<Conversation> {
    const url = getEndpointUrl(`/v1/ai/chat/conversations/${conversationId}/favorite`);
    const response = await makeAuthenticatedRequest(url, {
      method: 'PATCH',
      body: JSON.stringify({ isFavorite }),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }
    const result: ApiResponse<Conversation> = await response.json();
    if (!result.data) {
      throw new Error(result.message || 'Error al actualizar favorito');
    }
    return result.data;
  },

  /**
   * Actualizar carpeta de conversación
   */
  async updateFolder(conversationId: number, folderName: string | null): Promise<Conversation> {
    const url = getEndpointUrl(`/v1/ai/chat/conversations/${conversationId}/folder`);
    const response = await makeAuthenticatedRequest(url, {
      method: 'PATCH',
      body: JSON.stringify({ folderName }),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }
    const result: ApiResponse<Conversation> = await response.json();
    if (!result.data) {
      throw new Error(result.message || 'Error al actualizar carpeta');
    }
    return result.data;
  },

  /**
   * Obtener lista de carpetas del usuario
   */
  async getFolders(): Promise<string[]> {
    const url = getEndpointUrl('/v1/ai/chat/folders');
    const response = await makeAuthenticatedRequest(url, { method: 'GET' });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }
    const result: ApiResponse<string[]> = await response.json();
    return result.data || [];
  },

  /**
   * Exportar conversación
   */
  async exportConversation(conversationId: number, format: 'pdf' | 'markdown' | 'json' = 'markdown'): Promise<Blob> {
    const url = getEndpointUrl(`/v1/ai/chat/conversations/${conversationId}/export?format=${format}`);
    const response = await makeAuthenticatedRequest(url, { method: 'POST' });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }
    return await response.blob();
  },
};

export default cmxChatService;


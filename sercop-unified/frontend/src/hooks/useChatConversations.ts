/**
 * Hook para gestionar conversaciones de chat
 */

import { useState, useEffect, useCallback } from 'react';
import { cmxChatService, type Conversation } from '../services/cmxChatService';

export const useChatConversations = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await cmxChatService.getConversations();
      setConversations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar conversaciones');
      console.error('Error loading conversations:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createConversation = useCallback(async (title?: string, contextId?: number, folderName?: string) => {
    try {
      const newConversation = await cmxChatService.createConversation({ title, contextId, folderName });
      setConversations((prev) => [newConversation, ...prev]);
      return newConversation;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear conversación');
      throw err;
    }
  }, []);

  const deleteConversation = useCallback(async (id: number) => {
    try {
      await cmxChatService.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar conversación');
      throw err;
    }
  }, []);

  const toggleFavorite = useCallback(async (id: number, isFavorite: boolean) => {
    try {
      const updated = await cmxChatService.toggleFavorite(id, isFavorite);
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? updated : c))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar favorito');
      throw err;
    }
  }, []);

  const updateFolder = useCallback(async (id: number, folderName: string | null) => {
    try {
      const updated = await cmxChatService.updateFolder(id, folderName);
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? updated : c))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar carpeta');
      throw err;
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  return {
    conversations,
    loading,
    error,
    loadConversations,
    createConversation,
    deleteConversation,
    toggleFavorite,
    updateFolder,
  };
};



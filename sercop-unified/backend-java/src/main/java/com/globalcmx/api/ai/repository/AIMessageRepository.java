package com.globalcmx.api.ai.repository;

import com.globalcmx.api.ai.entity.AIMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository para gestionar mensajes de chat.
 */
@Repository
public interface AIMessageRepository extends JpaRepository<AIMessage, Long> {
    
    /**
     * Obtener todos los mensajes de una conversación ordenados por fecha de creación
     */
    List<AIMessage> findByConversationIdOrderByCreatedAtAsc(Long conversationId);
    
    /**
     * Obtener los últimos N mensajes de una conversación
     */
    @Query("SELECT m FROM AIMessage m WHERE m.conversation.id = :conversationId " +
           "ORDER BY m.createdAt DESC")
    List<AIMessage> findTopByConversationIdOrderByCreatedAtDesc(@Param("conversationId") Long conversationId);
    
    /**
     * Contar mensajes de una conversación
     */
    long countByConversationId(Long conversationId);
    
    /**
     * Eliminar todos los mensajes de una conversación
     */
    void deleteByConversationId(Long conversationId);
}






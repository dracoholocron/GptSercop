package com.globalcmx.api.ai.repository;

import com.globalcmx.api.ai.entity.AIConversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository para gestionar conversaciones de chat.
 */
@Repository
public interface AIConversationRepository extends JpaRepository<AIConversation, Long> {
    
    /**
     * Obtener todas las conversaciones de un usuario ordenadas por fecha de actualización
     * Carga el contexto (JOIN FETCH) para evitar problemas de lazy loading
     */
    @Query("SELECT DISTINCT c FROM AIConversation c " +
           "LEFT JOIN FETCH c.context " +
           "WHERE c.user.id = :userId " +
           "ORDER BY c.updatedAt DESC")
    List<AIConversation> findByUserIdOrderByUpdatedAtDesc(@Param("userId") Long userId);
    
    /**
     * Obtener conversaciones favoritas de un usuario
     * Carga el contexto (JOIN FETCH) para evitar problemas de lazy loading
     */
    @Query("SELECT DISTINCT c FROM AIConversation c " +
           "LEFT JOIN FETCH c.context " +
           "WHERE c.user.id = :userId AND c.isFavorite = true " +
           "ORDER BY c.updatedAt DESC")
    List<AIConversation> findByUserIdAndIsFavoriteTrueOrderByUpdatedAtDesc(@Param("userId") Long userId);
    
    /**
     * Obtener conversaciones de un usuario en una carpeta específica
     * Carga el contexto (JOIN FETCH) para evitar problemas de lazy loading
     */
    @Query("SELECT DISTINCT c FROM AIConversation c " +
           "LEFT JOIN FETCH c.context " +
           "WHERE c.user.id = :userId AND c.folderName = :folderName " +
           "ORDER BY c.updatedAt DESC")
    List<AIConversation> findByUserIdAndFolderNameOrderByUpdatedAtDesc(@Param("userId") Long userId, 
                                                                        @Param("folderName") String folderName);
    
    /**
     * Obtener conversaciones de un usuario con un contexto específico
     * Carga el contexto (JOIN FETCH) para evitar problemas de lazy loading
     */
    @Query("SELECT DISTINCT c FROM AIConversation c " +
           "LEFT JOIN FETCH c.context " +
           "WHERE c.user.id = :userId AND c.context.id = :contextId " +
           "ORDER BY c.updatedAt DESC")
    List<AIConversation> findByUserIdAndContextIdOrderByUpdatedAtDesc(@Param("userId") Long userId, 
                                                                        @Param("contextId") Long contextId);
    
    /**
     * Verificar si una conversación pertenece a un usuario
     */
    @Query("SELECT CASE WHEN COUNT(c) > 0 THEN true ELSE false END " +
           "FROM AIConversation c WHERE c.id = :conversationId AND c.user.id = :userId")
    boolean existsByIdAndUserId(@Param("conversationId") Long conversationId, 
                                @Param("userId") Long userId);
    
    /**
     * Obtener una conversación por ID y usuario (para seguridad)
     * Carga el contexto (JOIN FETCH) para evitar problemas de lazy loading
     */
    @Query("SELECT DISTINCT c FROM AIConversation c " +
           "LEFT JOIN FETCH c.context " +
           "WHERE c.id = :id AND c.user.id = :userId")
    Optional<AIConversation> findByIdAndUserId(@Param("id") Long id, @Param("userId") Long userId);
    
    /**
     * Contar conversaciones de un usuario
     */
    long countByUserId(Long userId);
}






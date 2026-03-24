package com.globalcmx.api.ai.repository;

import com.globalcmx.api.ai.entity.AIContextRoleMapping;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository para gestionar mapeos de roles a contextos de IA.
 */
@Repository
public interface AIContextRoleMappingRepository extends JpaRepository<AIContextRoleMapping, Long> {
    
    /**
     * Obtener mapeo por contexto y rol
     */
    Optional<AIContextRoleMapping> findByContextIdAndRole(Long contextId, String role);
    
    /**
     * Obtener todos los contextos permitidos para un rol
     */
    @Query("SELECT m.context FROM AIContextRoleMapping m " +
           "WHERE m.role = :role AND m.enabled = true AND m.context.enabled = true " +
           "ORDER BY m.context.displayOrder ASC")
    List<com.globalcmx.api.ai.entity.AIContext> findEnabledContextsByRole(@Param("role") String role);
    
    /**
     * Verificar si un rol tiene acceso a un contexto
     */
    @Query("SELECT CASE WHEN COUNT(m) > 0 THEN true ELSE false END " +
           "FROM AIContextRoleMapping m " +
           "WHERE m.context.id = :contextId AND m.role = :role " +
           "AND m.enabled = true AND m.context.enabled = true")
    boolean hasAccess(@Param("contextId") Long contextId, @Param("role") String role);
    
    /**
     * Obtener todos los mapeos de un contexto
     */
    List<AIContextRoleMapping> findByContextId(Long contextId);
    
    /**
     * Obtener todos los mapeos de un rol
     */
    List<AIContextRoleMapping> findByRole(String role);
}






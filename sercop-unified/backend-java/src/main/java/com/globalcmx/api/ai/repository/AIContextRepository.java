package com.globalcmx.api.ai.repository;

import com.globalcmx.api.ai.entity.AIContext;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository para gestionar contextos de IA.
 */
@Repository
public interface AIContextRepository extends JpaRepository<AIContext, Long> {
    
    /**
     * Buscar contexto por código
     */
    Optional<AIContext> findByCode(String code);
    
    /**
     * Obtener todos los contextos habilitados ordenados por displayOrder
     */
    List<AIContext> findByEnabledTrueOrderByDisplayOrderAsc();
    
    /**
     * Verificar si existe un contexto con el código dado
     */
    boolean existsByCode(String code);
}






package com.globalcmx.api.ai.repository;

import com.globalcmx.api.ai.entity.AIPromptConfigHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repositorio para historial de versiones de prompts de IA.
 */
@Repository
public interface AIPromptConfigHistoryRepository extends JpaRepository<AIPromptConfigHistory, Long> {

    /**
     * Obtiene el historial de un prompt ordenado por versión descendente
     */
    List<AIPromptConfigHistory> findByPromptConfigIdOrderByVersionDesc(Long promptConfigId);

    /**
     * Obtiene el historial por clave de prompt
     */
    List<AIPromptConfigHistory> findByPromptKeyOrderByVersionDesc(String promptKey);

    /**
     * Obtiene una versión específica
     */
    Optional<AIPromptConfigHistory> findByPromptKeyAndVersion(String promptKey, Integer version);

    /**
     * Obtiene la última versión guardada
     */
    Optional<AIPromptConfigHistory> findFirstByPromptConfigIdOrderByVersionDesc(Long promptConfigId);
}

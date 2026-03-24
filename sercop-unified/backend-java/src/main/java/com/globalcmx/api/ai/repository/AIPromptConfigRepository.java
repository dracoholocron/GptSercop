package com.globalcmx.api.ai.repository;

import com.globalcmx.api.ai.entity.AIPromptConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repositorio para gestión de configuración de prompts de IA.
 */
@Repository
public interface AIPromptConfigRepository extends JpaRepository<AIPromptConfig, Long> {

    /**
     * Busca un prompt por su clave única
     */
    Optional<AIPromptConfig> findByPromptKey(String promptKey);

    /**
     * Busca un prompt activo por su clave única
     */
    Optional<AIPromptConfig> findByPromptKeyAndIsActiveTrue(String promptKey);

    /**
     * Obtiene todos los prompts activos
     */
    List<AIPromptConfig> findByIsActiveTrueOrderByCategory();

    /**
     * Obtiene prompts por categoría
     */
    List<AIPromptConfig> findByCategoryAndIsActiveTrueOrderByDisplayName(String category);

    /**
     * Obtiene prompts por tipo de mensaje SWIFT
     */
    List<AIPromptConfig> findByMessageTypeAndIsActiveTrueOrderByCategory(String messageType);

    /**
     * Obtiene prompts por idioma
     */
    List<AIPromptConfig> findByLanguageAndIsActiveTrueOrderByCategory(String language);

    /**
     * Obtiene prompts para extracción SWIFT (por tipo de mensaje e idioma)
     */
    @Query("SELECT p FROM AIPromptConfig p WHERE p.isActive = true " +
           "AND (p.messageType = :messageType OR p.messageType = 'ALL') " +
           "AND (p.language = :language OR p.language = 'all') " +
           "ORDER BY p.category, p.displayName")
    List<AIPromptConfig> findPromptsForExtraction(
        @Param("messageType") String messageType,
        @Param("language") String language
    );

    /**
     * Obtiene las categorías disponibles
     */
    @Query("SELECT DISTINCT p.category FROM AIPromptConfig p WHERE p.isActive = true ORDER BY p.category")
    List<String> findDistinctCategories();

    /**
     * Obtiene los tipos de mensaje configurados
     */
    @Query("SELECT DISTINCT p.messageType FROM AIPromptConfig p WHERE p.isActive = true ORDER BY p.messageType")
    List<String> findDistinctMessageTypes();

    /**
     * Verifica si existe un prompt con la clave dada
     */
    boolean existsByPromptKey(String promptKey);

    /**
     * Busca prompts por texto en el template
     */
    @Query("SELECT p FROM AIPromptConfig p WHERE p.isActive = true " +
           "AND (LOWER(p.promptTemplate) LIKE LOWER(CONCAT('%', :searchText, '%')) " +
           "OR LOWER(p.displayName) LIKE LOWER(CONCAT('%', :searchText, '%')) " +
           "OR LOWER(p.description) LIKE LOWER(CONCAT('%', :searchText, '%')))")
    List<AIPromptConfig> searchPrompts(@Param("searchText") String searchText);
}

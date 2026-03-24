package com.globalcmx.api.ai.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Entidad de configuración de prompts de IA.
 * Permite gestionar y versionar los prompts de extracción de documentos
 * desde la base de datos sin necesidad de deployments.
 */
@Entity
@Table(name = "ai_prompt_config", indexes = {
    @Index(name = "idx_prompt_key", columnList = "prompt_key"),
    @Index(name = "idx_category", columnList = "category"),
    @Index(name = "idx_message_type", columnList = "message_type"),
    @Index(name = "idx_is_active", columnList = "is_active")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AIPromptConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Identificador único del prompt (ej: 'swift_extraction_main', 'additional_analysis_es')
     */
    @Column(name = "prompt_key", nullable = false, unique = true, length = 100)
    private String promptKey;

    /**
     * Nombre descriptivo para mostrar en la UI
     */
    @Column(name = "display_name", nullable = false, length = 255)
    private String displayName;

    /**
     * Descripción del propósito del prompt
     */
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    /**
     * Categoría del prompt: EXTRACTION, ANALYSIS, ACTIONS, OTHER
     */
    @Column(name = "category", nullable = false, length = 50)
    @Builder.Default
    private String category = "OTHER";

    /**
     * Idioma del prompt: es, en, all
     */
    @Column(name = "language", nullable = false, length = 10)
    @Builder.Default
    private String language = "all";

    /**
     * Tipo de mensaje SWIFT al que aplica: MT700, MT760, ALL, etc.
     */
    @Column(name = "message_type", length = 20)
    @Builder.Default
    private String messageType = "ALL";

    /**
     * El template del prompt (puede contener variables como {{messageType}}, {{language}})
     */
    @Column(name = "prompt_template", columnDefinition = "LONGTEXT", nullable = false)
    private String promptTemplate;

    /**
     * Variables disponibles en el prompt (JSON array)
     */
    @Column(name = "available_variables", columnDefinition = "JSON")
    @JdbcTypeCode(SqlTypes.JSON)
    private String availableVariables;

    /**
     * Configuración adicional (JSON)
     */
    @Column(name = "config", columnDefinition = "JSON")
    @JdbcTypeCode(SqlTypes.JSON)
    private String config;

    /**
     * Versión del prompt para auditoría
     */
    @Column(name = "version", nullable = false)
    @Builder.Default
    private Integer version = 1;

    /**
     * Estado activo/inactivo
     */
    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    /**
     * Usuario que creó el prompt
     */
    @Column(name = "created_by", length = 100)
    private String createdBy;

    /**
     * Fecha de creación
     */
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    /**
     * Usuario que actualizó el prompt
     */
    @Column(name = "updated_by", length = 100)
    private String updatedBy;

    /**
     * Fecha de última actualización
     */
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

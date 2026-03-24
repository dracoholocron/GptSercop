package com.globalcmx.api.ai.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

/**
 * Entidad de historial de versiones de prompts de IA.
 * Permite auditar y restaurar versiones anteriores de prompts.
 */
@Entity
@Table(name = "ai_prompt_config_history", indexes = {
    @Index(name = "idx_prompt_config_id", columnList = "prompt_config_id"),
    @Index(name = "idx_prompt_key_version", columnList = "prompt_key, version")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AIPromptConfigHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * ID del prompt al que pertenece este historial
     */
    @Column(name = "prompt_config_id", nullable = false)
    private Long promptConfigId;

    /**
     * Clave del prompt (para búsquedas rápidas)
     */
    @Column(name = "prompt_key", nullable = false, length = 100)
    private String promptKey;

    /**
     * Número de versión
     */
    @Column(name = "version", nullable = false)
    private Integer version;

    /**
     * Template del prompt en esta versión
     */
    @Column(name = "prompt_template", columnDefinition = "LONGTEXT", nullable = false)
    private String promptTemplate;

    /**
     * Variables disponibles en esta versión
     */
    @Column(name = "available_variables", columnDefinition = "JSON")
    @JdbcTypeCode(SqlTypes.JSON)
    private String availableVariables;

    /**
     * Configuración en esta versión
     */
    @Column(name = "config", columnDefinition = "JSON")
    @JdbcTypeCode(SqlTypes.JSON)
    private String config;

    /**
     * Usuario que hizo el cambio
     */
    @Column(name = "changed_by", length = 100)
    private String changedBy;

    /**
     * Fecha del cambio
     */
    @Column(name = "changed_at")
    private LocalDateTime changedAt;

    /**
     * Razón del cambio
     */
    @Column(name = "change_reason", length = 500)
    private String changeReason;

    @PrePersist
    protected void onCreate() {
        if (changedAt == null) {
            changedAt = LocalDateTime.now();
        }
    }
}

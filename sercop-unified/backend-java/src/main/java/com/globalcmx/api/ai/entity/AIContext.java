package com.globalcmx.api.ai.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Entidad que representa un contexto de IA disponible en el sistema.
 * Los contextos definen qué datos y funcionalidades puede acceder el chat.
 * 
 * Ejemplos: Operaciones, Contabilidad, SWIFT, Comisiones
 */
@Entity
@Table(name = "ai_context", 
       uniqueConstraints = @UniqueConstraint(columnNames = "code"))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AIContext {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String code; // OPERATIONS, ACCOUNTING, SWIFT, COMMISSIONS

    @Column(nullable = false, length = 100)
    private String name; // Nombre legible del contexto

    @Column(length = 500)
    private String description; // Descripción del contexto

    @Column(name = "context_type", length = 50)
    private String contextType; // Tipo de contexto para configuración

    @Column(name = "system_prompt", columnDefinition = "TEXT")
    private String systemPrompt; // Prompt del sistema para este contexto

    @Column(name = "allowed_data_sources", columnDefinition = "JSON")
    private String allowedDataSources; // JSON array de fuentes de datos permitidas

    @Column(nullable = false)
    @Builder.Default
    private Boolean enabled = true;

    @Column(name = "display_order")
    @Builder.Default
    private Integer displayOrder = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
    }
}






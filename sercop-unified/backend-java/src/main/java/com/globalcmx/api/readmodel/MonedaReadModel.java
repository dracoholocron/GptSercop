package com.globalcmx.api.readmodel;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Read Model de Moneda - Optimizado para queries (CQRS)
 * Este modelo es actualizado por las proyecciones que escuchan eventos
 */
@Entity
@Table(name = "moneda_read_model", indexes = {
    @Index(name = "idx_codigo", columnList = "codigo"),
    @Index(name = "idx_activo", columnList = "activo"),
    @Index(name = "idx_nombre", columnList = "nombre")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MonedaReadModel {

    @Id
    private Long id;

    @Column(nullable = false, unique = true, length = 3)
    private String codigo;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(length = 10)
    private String simbolo;

    @Column(nullable = false)
    @Builder.Default
    private Boolean activo = true;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @Column(length = 100)
    private String createdBy;

    @Column(length = 100)
    private String updatedBy;

    /**
     * Versión del modelo (para optimistic locking y sincronización)
     */
    @Version
    private Long version;

    /**
     * Timestamp de la última actualización del read model
     */
    private LocalDateTime lastSyncedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        lastSyncedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        lastSyncedAt = LocalDateTime.now();
    }
}
